import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatPanel } from '@/components/ChatPanel';
import { DocumentEditor } from '@/components/DocumentEditor';
import { DocumentList } from '@/components/DocumentList';
import { PresenceBar } from '@/components/PresenceBar';
import { Message, Room, PresenceUser } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MessageSquare, FileText, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkspaceProps {
  room: Room;
  messages: Message[];
  users: PresenceUser[];
  currentUser: string;
  isConnected: boolean;
  onSendMessage: (content: string) => void;
  onDocumentChange: (documentId: string, content: string) => void;
  onCreateDocument: (title: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onTyping: (isTyping: boolean) => void;
  onLeave: () => void;
}

type MobileTab = 'chat' | 'docs' | 'editor';

export function Workspace({
  room,
  messages,
  users,
  currentUser,
  isConnected,
  onSendMessage,
  onDocumentChange,
  onCreateDocument,
  onDeleteDocument,
  onTyping,
  onLeave,
}: WorkspaceProps) {
  const [activeDocumentId, setActiveDocumentId] = useState<string>('');
  const [showChat, setShowChat] = useState(true);
  const [showDocuments, setShowDocuments] = useState(true);
  const [showNewDocDialog, setShowNewDocDialog] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('New Document');
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();

  const prevMessagesLength = useRef(messages.length);
  const prevUsersLength = useRef(users.length);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set initial active document
  useEffect(() => {
    if (room.documents.length > 0 && !activeDocumentId) {
      setActiveDocumentId(room.documents[0].id);
    } else if (room.documents.length > 0 && !room.documents.find(d => d.id === activeDocumentId)) {
      // If active document was deleted, switch to first available
      setActiveDocumentId(room.documents[0].id);
    }
  }, [room.documents, activeDocumentId]);

  // Show toast for new messages
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      const lastMessage = messages[messages.length - 1];
      const sender = lastMessage && typeof lastMessage === 'object' && 'sender' in lastMessage
        ? (lastMessage as { sender?: string }).sender
        : undefined;
      const isAi = lastMessage && typeof lastMessage === 'object' && 'isAi' in lastMessage
        ? (lastMessage as { isAi?: boolean }).isAi
        : false;

      if (sender && sender !== currentUser && !isAi) {
        toast({
          title: "New message",
          description: `${sender} sent a message`,
          duration: 3000,
        });
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, currentUser, toast]);

  // Show toast for user join/leave
  useEffect(() => {
    if (users.length > prevUsersLength.current) {
      const newUsers = users.slice(prevUsersLength.current);
      newUsers.forEach(user => {
        if (user.username !== currentUser) {
          toast({
            title: "User joined",
            description: `${user.username} joined the room`,
            duration: 3000,
          });
        }
      });
    } else if (users.length < prevUsersLength.current) {
      toast({
        title: "User left",
        description: "A user left the room",
        duration: 3000,
      });
    }
    prevUsersLength.current = users.length;
  }, [users, currentUser, toast]);

  const activeDocument = room.documents.find(doc => doc.id === activeDocumentId);

  const handleDocumentChange = useCallback((content: string) => {
    if (activeDocumentId) {
      onDocumentChange(activeDocumentId, content);
    }
  }, [activeDocumentId, onDocumentChange]);

  const handleCreateDocument = useCallback(() => {
    setNewDocTitle('New Document');
    setShowNewDocDialog(true);
  }, []);

  const confirmCreateDocument = () => {
    if (newDocTitle.trim()) {
      onCreateDocument(newDocTitle.trim());
      setShowNewDocDialog(false);
      setNewDocTitle('New Document');
    }
  };

  // Add user colors
  const usersWithColors = users.map(user => ({
    ...user,
    color: user.color || getUserColor(user.username),
  }));

  // Mobile bottom navigation
  const MobileNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-40 safe-area-pb">
      <div className="flex items-center justify-around h-14">
        <button
          onClick={() => setMobileTab('chat')}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-colors",
            mobileTab === 'chat' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Chat</span>
        </button>
        <button
          onClick={() => setMobileTab('docs')}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-colors",
            mobileTab === 'docs' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Docs</span>
        </button>
        <button
          onClick={() => setMobileTab('editor')}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-colors",
            mobileTab === 'editor' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Edit3 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Editor</span>
        </button>
      </div>
    </div>
  );

  // Mobile content renderer
  const renderMobileContent = () => {
    switch (mobileTab) {
      case 'chat':
        return (
          <ChatPanel
            messages={messages}
            users={usersWithColors}
            currentUser={currentUser}
            onSendMessage={onSendMessage}
            onTyping={onTyping}
          />
        );
      case 'docs':
        return (
          <div className="flex flex-col h-full">
            <DocumentList
              documents={room.documents}
              activeDocumentId={activeDocumentId}
              onSelect={(id) => {
                setActiveDocumentId(id);
                setMobileTab('editor');
              }}
              onCreate={handleCreateDocument}
              onDelete={onDeleteDocument}
            />
          </div>
        );
      case 'editor':
        return activeDocument ? (
          <DocumentEditor
            key={activeDocument.id}
            content={activeDocument.content}
            users={usersWithColors}
            currentUser={currentUser}
            onContentChange={handleDocumentChange}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
            Select or create a document to start editing
          </div>
        );
    }
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col synapse-gradient">
        <PresenceBar
          roomId={room.id}
          users={usersWithColors}
          currentUser={currentUser}
          isConnected={isConnected}
          onLeave={onLeave}
        />

        <div className="flex-1 overflow-hidden pb-14">
          {renderMobileContent()}
        </div>

        <MobileNav />

        {/* New Document Dialog */}
        <Dialog open={showNewDocDialog} onOpenChange={setShowNewDocDialog}>
          <DialogContent className="w-[90%] max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="doc-title">Document Title</Label>
                <Input
                  id="doc-title"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Enter document title"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      confirmCreateDocument();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter className="flex-row gap-2">
              <Button variant="outline" onClick={() => setShowNewDocDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={confirmCreateDocument} className="flex-1">
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-screen flex flex-col synapse-gradient">
      <PresenceBar
        roomId={room.id}
        users={usersWithColors}
        currentUser={currentUser}
        isConnected={isConnected}
        onLeave={onLeave}
        showChat={showChat}
        onToggleChat={() => setShowChat(!showChat)}
        showDocuments={showDocuments}
        onToggleDocuments={() => setShowDocuments(!showDocuments)}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        {/* Chat Panel - Left */}
        {showChat && (
          <>
            <ResizablePanel
              defaultSize={25}
              minSize={15}
              maxSize={40}
              className="transition-all duration-200"
            >
              <ChatPanel
                messages={messages}
                users={usersWithColors}
                currentUser={currentUser}
                onSendMessage={onSendMessage}
                onTyping={onTyping}
              />
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-border hover:bg-primary/50 transition-colors" />
          </>
        )}

        {/* Document List & Video Panel - Sidebar */}
        {showDocuments && (
          <>
            <ResizablePanel
              defaultSize={15}
              minSize={10}
              maxSize={30}
              className="transition-all duration-200"
            >
              <DocumentList
                documents={room.documents}
                activeDocumentId={activeDocumentId}
                onSelect={setActiveDocumentId}
                onCreate={handleCreateDocument}
                onDelete={onDeleteDocument}
              />
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-border hover:bg-primary/50 transition-colors" />
          </>
        )}

        {/* Document Editor - Right */}
        <ResizablePanel
          defaultSize={showChat && showDocuments ? 60 : showChat || showDocuments ? 75 : 100}
          minSize={30}
          className="transition-all duration-200"
        >
          {activeDocument ? (
            <DocumentEditor
              key={activeDocument.id} // Force re-render on doc switch
              content={activeDocument.content}
              users={usersWithColors}
              currentUser={currentUser}
              onContentChange={handleDocumentChange}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select or create a document to start editing
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* New Document Dialog */}
      <Dialog open={showNewDocDialog} onOpenChange={setShowNewDocDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="doc-title">Document Title</Label>
              <Input
                id="doc-title"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Enter document title"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmCreateDocument();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDocDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmCreateDocument}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getUserColor(username: string): string {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
