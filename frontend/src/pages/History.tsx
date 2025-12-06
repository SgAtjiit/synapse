import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
    Zap,
    ArrowLeft,
    MessageSquare,
    FileText,
    Clock,
    Loader2,
    Home,
} from 'lucide-react';

interface HistoryEntry {
    firebaseUid: string;
    roomId: string;
    roomName: string;
    username: string;
    lastVisited: string;
    firstVisited: string;
    messageCount: number;
}

interface Message {
    id: string;
    roomId: string;
    userId: string;
    username: string;
    content: string;
    isAI: boolean;
    timestamp: string;
}

interface Document {
    id: string;
    title: string;
    content: string;
    lastModified: string;
}

interface RoomData {
    id: string;
    name: string;
    documents: Document[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function History() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { roomId } = useParams();
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [roomLoading, setRoomLoading] = useState(false);
    const [activeDocId, setActiveDocId] = useState<string>('');

    // Fetch user's history
    useEffect(() => {
        if (!user?.uid) return;

        const fetchHistory = async () => {
            try {
                const response = await fetch(`${API_URL}/api/history/${user.uid}`);
                const data = await response.json();
                if (data.success) {
                    setHistory(data.history);
                }
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user?.uid]);

    // Load room from URL param
    useEffect(() => {
        if (roomId) {
            loadRoomDetails(roomId);
        }
    }, [roomId]);

    const loadRoomDetails = async (id: string) => {
        setRoomLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/room/${id}`);
            const data = await response.json();
            if (data.success) {
                setSelectedRoom(data.room);
                setMessages(data.messages);
                if (data.room.documents?.length > 0) {
                    setActiveDocId(data.room.documents[0].id);
                }
            }
        } catch (error) {
            console.error('Error loading room:', error);
        } finally {
            setRoomLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const activeDocument = selectedRoom?.documents?.find(d => d.id === activeDocId);

    if (loading) {
        return (
            <div className="min-h-screen synapse-gradient flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    // Room detail view
    if (selectedRoom || roomId) {
        if (roomLoading) {
            return (
                <div className="min-h-screen synapse-gradient flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            );
        }

        return (
            <div className="h-screen flex flex-col synapse-gradient">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSelectedRoom(null);
                                setMessages([]);
                                navigate('/history');
                            }}
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back
                        </Button>
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" />
                            <span className="font-semibold">Room: {selectedRoom?.id || roomId}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">
                            Read-only History View
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/')}
                        >
                            <Home className="w-4 h-4 mr-1" />
                            Join Room
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
                    {/* Chat History */}
                    <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
                        <div className="h-full flex flex-col bg-card/30">
                            <div className="p-3 border-b border-border">
                                <h3 className="font-medium flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-primary" />
                                    Chat History
                                    <span className="text-xs text-muted-foreground">({messages.length} messages)</span>
                                </h3>
                            </div>
                            <ScrollArea className="flex-1 p-3">
                                <div className="space-y-3">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`p-3 rounded-lg ${msg.isAI
                                                    ? 'bg-primary/10 border border-primary/20'
                                                    : 'bg-secondary/50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-sm font-medium ${msg.isAI ? 'text-primary' : ''}`}>
                                                    {msg.username}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(msg.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                                                {msg.content}
                                            </p>
                                        </div>
                                    ))}
                                    {messages.length === 0 && (
                                        <p className="text-center text-muted-foreground py-8">
                                            No messages in this room
                                        </p>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle className="bg-border hover:bg-primary/50 transition-colors" />

                    {/* Documents List */}
                    <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
                        <div className="h-full flex flex-col bg-card/30 border-x border-border">
                            <div className="p-3 border-b border-border">
                                <h3 className="font-medium flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    Documents
                                </h3>
                            </div>
                            <ScrollArea className="flex-1 p-2">
                                <div className="space-y-1">
                                    {selectedRoom?.documents?.map((doc) => (
                                        <button
                                            key={doc.id}
                                            onClick={() => setActiveDocId(doc.id)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeDocId === doc.id
                                                    ? 'bg-primary/20 text-primary'
                                                    : 'hover:bg-secondary/50'
                                                }`}
                                        >
                                            {doc.title}
                                        </button>
                                    ))}
                                    {(!selectedRoom?.documents || selectedRoom.documents.length === 0) && (
                                        <p className="text-center text-muted-foreground py-4 text-sm">
                                            No documents
                                        </p>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle className="bg-border hover:bg-primary/50 transition-colors" />

                    {/* Document Content */}
                    <ResizablePanel defaultSize={50} minSize={30}>
                        <div className="h-full flex flex-col bg-card/30">
                            <div className="p-3 border-b border-border">
                                <h3 className="font-medium">
                                    {activeDocument?.title || 'Select a document'}
                                </h3>
                            </div>
                            <ScrollArea className="flex-1 p-4">
                                {activeDocument ? (
                                    <div className="prose prose-invert max-w-none">
                                        <pre className="whitespace-pre-wrap text-sm text-foreground/80 font-sans">
                                            {activeDocument.content || 'Empty document'}
                                        </pre>
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">
                                        Select a document to view its content
                                    </p>
                                )}
                            </ScrollArea>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        );
    }

    // History list view
    return (
        <div className="min-h-screen synapse-gradient p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                            <Clock className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Room History</h1>
                            <p className="text-sm text-muted-foreground">View your past workspace sessions</p>
                        </div>
                    </div>
                    <Button onClick={() => navigate('/')}>
                        <Home className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                </div>

                {/* History List */}
                {history.length === 0 ? (
                    <div className="text-center py-16 bg-card/30 rounded-2xl border border-border">
                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No history yet</h3>
                        <p className="text-muted-foreground mb-6">
                            Join a room to start building your history
                        </p>
                        <Button onClick={() => navigate('/')}>
                            <Zap className="w-4 h-4 mr-2" />
                            Join a Room
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {history.map((entry) => (
                            <div
                                key={`${entry.firebaseUid}-${entry.roomId}`}
                                className="p-4 bg-card/50 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer"
                                onClick={() => {
                                    navigate(`/history/${entry.roomId}`);
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Zap className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{entry.roomName}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Room ID: {entry.roomId}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-4 h-4" />
                                                {entry.messageCount} messages
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {formatDate(entry.lastVisited)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
