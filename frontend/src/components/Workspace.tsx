import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatPanel } from '@/components/ChatPanel';
import { DocumentEditor } from '@/components/DocumentEditor';
import { DocumentList } from '@/components/DocumentList';
import { PresenceBar } from '@/components/PresenceBar';
import { Message, Room, PresenceUser } from '@/types';
import { useToast } from '@/components/ui/use-toast';
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
  onAiFormat: (documentId: string, content: string) => void;
  onTyping: (isTyping: boolean) => void;
  onLeave: () => void;
}

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
  onAiFormat,
  onTyping,
  onLeave,
}: WorkspaceProps) {
  const [activeDocumentId, setActiveDocumentId] = useState<string>('');
  const [showChat, setShowChat] = useState(true);
  const [showDocuments, setShowDocuments] = useState(true);
  const [showNewDocDialog, setShowNewDocDialog] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('New Document');
  const { toast } = useToast();

  const prevMessagesLength = useRef(messages.length);
  const prevUsersLength = useRef(users.length);

  // Set initial active document
  useEffect(() => {
    if (room.documents.length > 0 && !activeDocumentId) {
      setActiveDocumentId(room.documents[0].id);
    } else if (room.documents.length > 0 && !room.documents.find(d => d.id === activeDocumentId)) {
      // If active document was deleted, switch to first available
      setActiveDocumentId(room.documents[0].id);
    }
  }, [room.documents, activeDocumentId]);

  // Toast for new messages
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      const newMessage = messages[messages.length - 1];
      // Don't show notification for own messages, AI messages, or undefined sender
      const isOwnMessage = newMessage.sender === currentUser;
      const isAiMessage = newMessage.isAi === true;
      const isUndefined = !newMessage.sender;

      if (!isOwnMessage && !isAiMessage && !isUndefined) {
        toast({
          title: `New message from ${newMessage.sender}`,
          description: newMessage.content.substring(0, 50) + (newMessage.content.length > 50 ? '...' : ''),
        });
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, currentUser, toast]);

  // Toast for user join/leave
  useEffect(() => {
    if (users.length > prevUsersLength.current) {
      // User joined (simplified check, ideally we'd find who)
      toast({
        title: "User Joined",
        description: "A new user has joined the room.",
      });
    } else if (users.length < prevUsersLength.current) {
      toast({
        title: "User Left",
        description: "A user has left the room.",
        variant: "destructive",
      });
    }
    prevUsersLength.current = users.length;
  }, [users, toast]);

  const activeDocument = room.documents.find(d => d.id === activeDocumentId);

  const handleDocumentChange = useCallback((content: string) => {
    if (activeDocumentId) {
      onDocumentChange(activeDocumentId, content);
    }
  }, [activeDocumentId, onDocumentChange]);

  const handleAiFormat = useCallback((content: string) => {
    if (activeDocumentId) {
      onAiFormat(activeDocumentId, content);
    }
  }, [activeDocumentId, onAiFormat]);

  const handleCreateDocument = () => {
    setShowNewDocDialog(true);
  };

  const confirmCreateDocument = () => {
    if (newDocTitle.trim()) {
      onCreateDocument(newDocTitle.trim());
      toast({
        title: "Document Created",
        description: `"${newDocTitle.trim()}" has been created.`,
      });
      setNewDocTitle('New Document');
      setShowNewDocDialog(false);
    }
  };

  // Add user colors
  const usersWithColors = users.map(user => ({
    ...user,
    color: user.color || getUserColor(user.username),
  }));

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

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel - Left */}
        {showChat && (
          <div className="w-[400px] min-w-[320px] max-w-[500px] flex-shrink-0 border-r border-border transition-all duration-300">
            <ChatPanel
              messages={messages}
              users={usersWithColors}
              currentUser={currentUser}
              onSendMessage={onSendMessage}
              onTyping={onTyping}
            />
          </div>
        )}

        {/* Document List - Sidebar */}
        {showDocuments && (
          <DocumentList
            documents={room.documents}
            activeDocumentId={activeDocumentId}
            onSelect={setActiveDocumentId}
            onCreate={handleCreateDocument}
            onDelete={onDeleteDocument}
          />
        )}

        {/* Document Editor - Right */}
        <div className="flex-1 min-w-0 transition-all duration-300">
          {activeDocument ? (
            <DocumentEditor
              key={activeDocument.id} // Force re-render on doc switch
              content={activeDocument.content}
              users={usersWithColors}
              currentUser={currentUser}
              onContentChange={handleDocumentChange}
              onAiFormat={handleAiFormat}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select or create a document to start editing
            </div>
          )}
        </div>
      </div>

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
