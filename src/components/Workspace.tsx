import { useState, useEffect, useCallback } from 'react';
import { ChatPanel } from '@/components/ChatPanel';
import { DocumentEditor } from '@/components/DocumentEditor';
import { PresenceBar } from '@/components/PresenceBar';
import { Message, Room, PresenceUser } from '@/types';

interface WorkspaceProps {
  room: Room;
  messages: Message[];
  users: PresenceUser[];
  currentUser: string;
  isConnected: boolean;
  onSendMessage: (content: string) => void;
  onDocumentChange: (content: string) => void;
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
  onTyping,
  onLeave,
}: WorkspaceProps) {
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
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel - Left */}
        <div className="w-[400px] min-w-[320px] max-w-[500px] flex-shrink-0">
          <ChatPanel
            messages={messages}
            users={usersWithColors}
            currentUser={currentUser}
            onSendMessage={onSendMessage}
            onTyping={onTyping}
          />
        </div>
        
        {/* Document Editor - Right */}
        <div className="flex-1 min-w-0">
          <DocumentEditor
            content={room.documentContent}
            users={usersWithColors}
            currentUser={currentUser}
            onContentChange={onDocumentChange}
          />
        </div>
      </div>
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
