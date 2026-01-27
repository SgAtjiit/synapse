import { useState, useCallback, useEffect } from 'react';
import { RoomJoin } from '@/components/RoomJoin';
import { Workspace } from '@/components/Workspace';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();
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
    createDocument,
    deleteDocument,
    setTyping,
    // Video call methods
    getSocket,
    joinVideoCall,
    leaveVideoCall,
    sendVideoSignal,
  } = useSocket();

  // Set default username from auth user
  useEffect(() => {
    if (user?.displayName && !currentUser) {
      setCurrentUser(user.displayName);
    }
  }, [user, currentUser]);

  const handleJoin = useCallback((roomId: string, username: string) => {
    setCurrentUser(username);
    joinRoom(roomId, username, user?.uid);
  }, [joinRoom, user?.uid]);

  const handleLeave = useCallback(() => {
    leaveRoom();
    setCurrentUser('');
  }, [leaveRoom]);

  if (!room) {
    return (
      <RoomJoin
        onJoin={handleJoin}
        isConnected={isConnected}
        defaultUsername={user?.displayName || ''}
        userEmail={user?.email || ''}
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
      onCreateDocument={createDocument}
      onDeleteDocument={deleteDocument}
      onTyping={setTyping}
      onLeave={handleLeave}
      socket={getSocket()}
      onJoinVideo={joinVideoCall}
      onLeaveVideo={leaveVideoCall}
      onSendVideoSignal={sendVideoSignal}
    />
  );
};

export default Index;
