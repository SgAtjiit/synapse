export interface User {
  id: string;
  username: string;
  color: string;
}

export interface Message {
  _id?: string;
  id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  isAI?: boolean;
  isStreaming?: boolean;
  timestamp: Date;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  lastModified?: Date;
}

export interface Room {
  _id?: string;
  id: string;
  name: string;
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PresenceUser {
  id: string;
  username: string;
  color: string;
  isTyping?: boolean;
  cursorPosition?: number;
}

export interface SocketEvents {
  // Client to Server
  'join-room': (data: { roomId: string; username: string }) => void;
  'leave-room': (data: { roomId: string }) => void;
  'send-message': (data: { roomId: string; content: string }) => void;
  'document-change': (data: { roomId: string; documentId: string; content: string }) => void;
  'create-document': (data: { roomId: string; title: string }) => void;
  'delete-document': (data: { roomId: string; documentId: string }) => void;
  'ai-format-document': (data: { roomId: string; documentId: string; content: string }) => void;
  'typing-start': (data: { roomId: string }) => void;
  'typing-stop': (data: { roomId: string }) => void;

  // Server to Client
  'room-joined': (data: { room: Room; messages: Message[]; users: PresenceUser[] }) => void;
  'user-joined': (data: { user: PresenceUser }) => void;
  'user-left': (data: { userId: string }) => void;
  'new-message': (data: Message) => void;
  'ai-stream': (data: { messageId: string; token: string }) => void;
  'ai-stream-end': (data: { messageId: string }) => void;
  'document-updated': (data: { documentId: string; content: string; userId: string }) => void;
  'document-created': (data: Document) => void;
  'document-deleted': (data: { documentId: string }) => void;
  'user-typing': (data: { userId: string; isTyping: boolean }) => void;
  'presence-update': (data: { users: PresenceUser[] }) => void;
}
