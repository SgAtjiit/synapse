import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  roomId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  isAI: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Get messages for a room
messageSchema.statics.getByRoom = async function(roomId, limit = 100) {
  return this.find({ roomId })
    .sort({ timestamp: 1 })
    .limit(limit)
    .lean();
};

// Create a new message
messageSchema.statics.createMessage = async function(data) {
  const message = await this.create({
    id: data.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    roomId: data.roomId,
    userId: data.userId,
    username: data.username,
    content: data.content,
    isAI: data.isAI || false,
    timestamp: data.timestamp || new Date(),
  });
  return message.toObject();
};

const Message = mongoose.model('Message', messageSchema);

export default Message;
