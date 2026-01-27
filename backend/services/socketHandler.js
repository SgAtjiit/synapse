import Room from '../models/Room.js';
import Message from '../models/Message.js';
import UserHistory from '../models/UserHistory.js';
// import { streamGeminiResponse } from './gemini.js';
import { streamGroqResponse } from './groq.js';
import { generateId, getUserColor } from '../utils/helpers.js';

// Store connected users by room
const roomUsers = new Map(); // roomId -> Map(socketId -> user)

// Store video call participants by room
const videoUsers = new Map(); // roomId -> Set(socketId)

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    let currentRoom = null;
    let currentUser = null;
    let currentFirebaseUid = null;

    // Join Room
    socket.on('join-room', async ({ roomId, username, firebaseUid }) => {
      try {
        console.log(`${username} joining room ${roomId}`);

        // Leave previous room if any
        if (currentRoom) {
          socket.leave(currentRoom);
          const users = roomUsers.get(currentRoom);
          if (users) {
            users.delete(socket.id);
            io.to(currentRoom).emit('user-left', { userId: socket.id });
          }
        }

        // Join new room
        socket.join(roomId);
        currentRoom = roomId;
        currentFirebaseUid = firebaseUid;

        // Create user object
        currentUser = {
          id: socket.id,
          username,
          color: getUserColor(username),
          isTyping: false,
        };

        // Add to room users
        if (!roomUsers.has(roomId)) {
          roomUsers.set(roomId, new Map());
        }
        roomUsers.get(roomId).set(socket.id, currentUser);

        // Get or create room
        const room = await Room.findOrCreate(roomId);

        // Get chat history
        const messages = await Message.getByRoom(roomId);

        // Get all users in room
        const users = Array.from(roomUsers.get(roomId).values());

        // Record user history if firebase uid provided
        if (firebaseUid) {
          try {
            await UserHistory.recordVisit({
              firebaseUid,
              roomId,
              roomName: room.name || `Room ${roomId}`,
              username,
            });
          } catch (historyError) {
            console.error('Error recording history:', historyError);
          }
        }

        // Send room data to joining user
        socket.emit('room-joined', {
          room: room.toObject(),
          messages,
          users,
        });

        // Notify others
        socket.to(roomId).emit('user-joined', { user: currentUser });

        console.log(`${username} joined room ${roomId}, ${users.length} users now`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Send Message
    socket.on('send-message', async ({ roomId, content }) => {
      if (!currentUser || !currentRoom) return;

      try {
        const isAICommand = content.trim().toLowerCase().startsWith('/ai ');

        // Create user message
        const messageData = {
          id: generateId(),
          roomId,
          userId: socket.id,
          username: currentUser.username,
          content,
          isAI: false,
          timestamp: new Date(),
        };

        // Save and broadcast user message
        const savedMessage = await Message.createMessage(messageData);
        io.to(roomId).emit('new-message', savedMessage);

        // Increment message count in user history
        if (currentFirebaseUid) {
          try {
            await UserHistory.incrementMessageCount(currentFirebaseUid, roomId);
          } catch (historyError) {
            console.error('Error incrementing message count:', historyError);
          }
        }

        // Handle AI command
        if (isAICommand) {
          const prompt = content.slice(4).trim(); // Remove '/ai '

          if (!prompt) {
            return;
          }

          // Get current document content for context
          const room = await Room.findOne({ id: roomId });
          // Use the first document content as context for now, or empty
          const documentContext = room?.documents?.[0]?.content || '';

          // Create AI response placeholder
          const aiMessageId = generateId();
          const aiMessageData = {
            id: aiMessageId,
            roomId,
            userId: 'ai',
            username: 'Synapse AI',
            content: '',
            isAI: true,
            isStreaming: true,
            timestamp: new Date(),
          };

          // Send placeholder to all clients
          io.to(roomId).emit('new-message', aiMessageData);

          // Stream AI response
          let fullResponse = '';

          try {
            for await (const token of streamGroqResponse(prompt, documentContext)) {
              fullResponse += token;
              io.to(roomId).emit('ai-stream', { messageId: aiMessageId, token });
            }
          } catch (error) {
            console.error('AI streaming error:', error);
            fullResponse += '\n\n[Error streaming response]';
          }

          // End streaming
          io.to(roomId).emit('ai-stream-end', { messageId: aiMessageId });

          // Save final AI message to database
          await Message.createMessage({
            id: aiMessageId,
            roomId,
            userId: 'ai',
            username: 'Synapse AI',
            content: fullResponse,
            isAI: true,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Document Change
    socket.on('document-change', async ({ roomId, documentId, content }) => {
      if (!currentUser || !currentRoom) return;

      try {
        // Update in database
        const room = await Room.findOne({ id: roomId });
        if (room) {
          await room.updateDocument(documentId, content);
        }

        // Broadcast to others (not sender)
        socket.to(roomId).emit('document-updated', {
          documentId,
          content,
          userId: socket.id,
        });
      } catch (error) {
        console.error('Error updating document:', error);
      }
    });

    // Create Document
    socket.on('create-document', async ({ roomId, title }) => {
      if (!currentUser || !currentRoom) return;

      try {
        const room = await Room.findOne({ id: roomId });
        if (room) {
          const newDoc = {
            id: generateId(),
            title: title || 'Untitled Document',
            content: '',
            lastModified: new Date(),
          };
          await room.createDocument(newDoc);

          io.to(roomId).emit('document-created', newDoc);
        }
      } catch (error) {
        console.error('Error creating document:', error);
      }
    });

    // Delete Document
    socket.on('delete-document', async ({ roomId, documentId }) => {
      if (!currentUser || !currentRoom) return;

      try {
        const room = await Room.findOne({ id: roomId });
        if (room) {
          await room.deleteDocument(documentId);
          io.to(roomId).emit('document-deleted', { documentId });
        }
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    });

    // AI Format Document
    socket.on('ai-format-document', async ({ roomId, documentId, content }) => {
      if (!currentUser || !currentRoom) return;

      try {
        const { formatDocumentWithAI } = await import('./gemini.js');
        const formattedContent = await formatDocumentWithAI(content);

        // Update in database
        const room = await Room.findOne({ id: roomId });
        if (room) {
          await room.updateDocument(documentId, formattedContent);
        }

        // Broadcast update
        io.to(roomId).emit('document-updated', {
          documentId,
          content: formattedContent,
          userId: 'ai',
        });
      } catch (error) {
        console.error('Error formatting document:', error);
        socket.emit('error', { message: 'Failed to format document' });
      }
    });

    // Typing indicators
    socket.on('typing-start', ({ roomId }) => {
      if (!currentUser || !currentRoom) return;

      const users = roomUsers.get(roomId);
      if (users && users.has(socket.id)) {
        users.get(socket.id).isTyping = true;
        socket.to(roomId).emit('user-typing', { userId: socket.id, isTyping: true });
      }
    });

    // ============ VIDEO CALL SIGNALING ============

    // Join video call
    socket.on('video-join', ({ roomId }) => {
      if (!currentUser || !currentRoom) return;

      console.log(`${currentUser.username} joining video call in room ${roomId}`);

      // Initialize video users set for this room if needed
      if (!videoUsers.has(roomId)) {
        videoUsers.set(roomId, new Set());
      }

      const roomVideoUsers = videoUsers.get(roomId);

      // Get existing video users to send to the new joiner
      const existingUsers = Array.from(roomVideoUsers).filter(id => id !== socket.id);

      // Notify new user about existing video users
      socket.emit('video-users', {
        users: existingUsers.map(id => {
          const user = roomUsers.get(roomId)?.get(id);
          return { id, username: user?.username || 'Unknown' };
        })
      });

      // Add new user to video call
      roomVideoUsers.add(socket.id);

      // Notify others that a new user joined video
      socket.to(roomId).emit('video-user-joined', {
        userId: socket.id,
        username: currentUser.username
      });
    });

    // Relay WebRTC signaling data
    socket.on('video-signal', ({ targetId, signal }) => {
      if (!currentUser) return;

      console.log(`Relaying signal from ${currentUser.username} (${socket.id}) to ${targetId}`);

      // Send signal to specific peer
      io.to(targetId).emit('video-signal', {
        callerId: socket.id,
        callerName: currentUser.username,
        signal
      });
    });

    // Leave video call
    socket.on('video-leave', ({ roomId }) => {
      if (!currentRoom) return;

      console.log(`User leaving video call in room ${roomId}`);

      const roomVideoUsers = videoUsers.get(roomId);
      if (roomVideoUsers) {
        roomVideoUsers.delete(socket.id);

        // Clean up empty video rooms
        if (roomVideoUsers.size === 0) {
          videoUsers.delete(roomId);
        }
      }

      // Notify others
      socket.to(roomId).emit('video-user-left', { userId: socket.id });
    });

    // Get current video users in room
    socket.on('video-get-users', ({ roomId }) => {
      const roomVideoUsers = videoUsers.get(roomId);
      if (roomVideoUsers) {
        const users = Array.from(roomVideoUsers).map(id => {
          const user = roomUsers.get(roomId)?.get(id);
          return { id, username: user?.username || 'Unknown' };
        });
        socket.emit('video-users', { users });
      } else {
        socket.emit('video-users', { users: [] });
      }
    });

    socket.on('typing-stop', ({ roomId }) => {
      if (!currentUser || !currentRoom) return;

      const users = roomUsers.get(roomId);
      if (users && users.has(socket.id)) {
        users.get(socket.id).isTyping = false;
        socket.to(roomId).emit('user-typing', { userId: socket.id, isTyping: false });
      }
    });

    // Leave Room
    socket.on('leave-room', ({ roomId }) => {
      if (currentRoom === roomId) {
        socket.leave(roomId);

        const users = roomUsers.get(roomId);
        if (users) {
          users.delete(socket.id);
          io.to(roomId).emit('user-left', { userId: socket.id });

          // Clean up empty rooms
          if (users.size === 0) {
            roomUsers.delete(roomId);
          }
        }

        currentRoom = null;
        currentUser = null;
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      if (currentRoom) {
        const users = roomUsers.get(currentRoom);
        if (users) {
          users.delete(socket.id);
          io.to(currentRoom).emit('user-left', { userId: socket.id });

          if (users.size === 0) {
            roomUsers.delete(currentRoom);
          }
        }

        // Clean up video call on disconnect
        const roomVideoUsers = videoUsers.get(currentRoom);
        if (roomVideoUsers && roomVideoUsers.has(socket.id)) {
          roomVideoUsers.delete(socket.id);
          io.to(currentRoom).emit('video-user-left', { userId: socket.id });

          if (roomVideoUsers.size === 0) {
            videoUsers.delete(currentRoom);
          }
        }
      }
    });
  });
}
