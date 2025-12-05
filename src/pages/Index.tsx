import { useState, useCallback } from 'react';
import { RoomJoin } from '@/components/RoomJoin';
import { Workspace } from '@/components/Workspace';
import { useSocket } from '@/hooks/useSocket';

const Index = () => {
  const [currentUser, setCurrentUser] = useState<string>('');
  const {
    isConnected,
    room,
    messages,
    users,
    joinRoom,
    leaveRoom,
    sendMessage,
    updateDocument,
    setTyping,
  } = useSocket();

  const handleJoin = useCallback((roomId: string, username: string) => {
    setCurrentUser(username);
    joinRoom(roomId, username);
  }, [joinRoom]);

  const handleLeave = useCallback(() => {
    leaveRoom();
    setCurrentUser('');
  }, [leaveRoom]);

  if (!room) {
    return (
      <RoomJoin
        onJoin={handleJoin}
        isConnected={isConnected}
      />
    );
  }

  return (
    <Workspace
      room={room}
      messages={messages}
      users={users}
      currentUser={currentUser}
      isConnected={isConnected}
      onSendMessage={sendMessage}
      onDocumentChange={updateDocument}
      onTyping={setTyping}
      onLeave={handleLeave}
    />
  );
};

export default Index;
