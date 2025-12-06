import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, Room, PresenceUser, Document } from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

interface UseSocketReturn {
  isConnected: boolean;
  room: Room | null;
  messages: Message[];
  users: PresenceUser[];
  joinRoom: (roomId: string, username: string, firebaseUid?: string) => void;
  leaveRoom: () => void;
  sendMessage: (content: string) => void;
  updateDocument: (documentId: string, content: string) => void;
  createDocument: (title: string) => void;
  deleteDocument: (documentId: string) => void;
  setTyping: (isTyping: boolean) => void;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const currentRoomRef = useRef<string | null>(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('room-joined', (data: { room: Room; messages: Message[]; users: PresenceUser[] }) => {
      console.log('Room joined:', data);
      setRoom(data.room);
      setMessages(data.messages);
      setUsers(data.users);
    });

    socket.on('user-joined', (data: { user: PresenceUser }) => {
      console.log('User joined:', data.user);
      setUsers(prev => [...prev.filter(u => u.id !== data.user.id), data.user]);
    });

    socket.on('user-left', (data: { userId: string }) => {
      console.log('User left:', data.userId);
      setUsers(prev => prev.filter(u => u.id !== data.userId));
    });

    socket.on('new-message', (message: Message) => {
      console.log('New message:', message);
      setMessages(prev => {
        const exists = prev.find(m => m.id === message.id);
        if (exists) {
          return prev.map(m => m.id === message.id ? message : m);
        }
        return [...prev, message];
      });
    });

    socket.on('ai-stream', (data: { messageId: string; token: string }) => {
      setMessages(prev => prev.map(m => {
        if (m.id === data.messageId) {
          return { ...m, content: m.content + data.token };
        }
        return m;
      }));
    });

    socket.on('ai-stream-end', (data: { messageId: string }) => {
      setMessages(prev => prev.map(m => {
        if (m.id === data.messageId) {
          return { ...m, isStreaming: false };
        }
        return m;
      }));
    });

    socket.on('document-updated', (data: { documentId: string; content: string; userId: string }) => {
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          documents: prev.documents.map(d => d.id === data.documentId ? { ...d, content: data.content } : d)
        };
      });
    });

    socket.on('document-created', (doc: Document) => {
      setRoom(prev => prev ? { ...prev, documents: [...prev.documents, doc] } : null);
    });

    socket.on('document-deleted', (data: { documentId: string }) => {
      setRoom(prev => prev ? { ...prev, documents: prev.documents.filter(d => d.id !== data.documentId) } : null);
    });

    socket.on('user-typing', (data: { userId: string; isTyping: boolean }) => {
      setUsers(prev => prev.map(u =>
        u.id === data.userId ? { ...u, isTyping: data.isTyping } : u
      ));
    });

    socket.on('presence-update', (data: { users: PresenceUser[] }) => {
      setUsers(data.users);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = useCallback((roomId: string, username: string, firebaseUid?: string) => {
    if (socketRef.current) {
      currentRoomRef.current = roomId;
      socketRef.current.emit('join-room', { roomId, username, firebaseUid });
    }
  }, []);

  const leaveRoom = useCallback(() => {
    if (socketRef.current && currentRoomRef.current) {
      socketRef.current.emit('leave-room', { roomId: currentRoomRef.current });
      currentRoomRef.current = null;
      setRoom(null);
      setMessages([]);
      setUsers([]);
    }
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (socketRef.current && currentRoomRef.current) {
      socketRef.current.emit('send-message', {
        roomId: currentRoomRef.current,
        content
      });
    }
  }, []);

  const updateDocument = useCallback((documentId: string, content: string) => {
    if (socketRef.current && currentRoomRef.current) {
      socketRef.current.emit('document-change', {
        roomId: currentRoomRef.current,
        documentId,
        content
      });
    }
  }, []);

  const createDocument = useCallback((title: string) => {
    if (socketRef.current && currentRoomRef.current) {
      socketRef.current.emit('create-document', { roomId: currentRoomRef.current, title });
    }
  }, []);

  const deleteDocument = useCallback((documentId: string) => {
    if (socketRef.current && currentRoomRef.current) {
      socketRef.current.emit('delete-document', { roomId: currentRoomRef.current, documentId });
    }
  }, []);

  const setTyping = useCallback((isTyping: boolean) => {
    if (socketRef.current && currentRoomRef.current) {
      socketRef.current.emit(isTyping ? 'typing-start' : 'typing-stop', {
        roomId: currentRoomRef.current
      });
    }
  }, []);

  return {
    isConnected,
    room,
    messages,
    users,
    joinRoom,
    leaveRoom,
    sendMessage,
    updateDocument,
    createDocument,
    deleteDocument,
    setTyping,
  };
}
