import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    default: function() {
      return `Room ${this.id}`;
    },
  },
  documentContent: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Create or update document content
roomSchema.statics.findOrCreate = async function(roomId) {
  let room = await this.findOne({ id: roomId });
  if (!room) {
    room = await this.create({ id: roomId });
  }
  return room;
};

// Update document content
roomSchema.methods.updateDocument = async function(content) {
  this.documentContent = content;
  await this.save();
  return this;
};

const Room = mongoose.model('Room', roomSchema);

export default Room;
