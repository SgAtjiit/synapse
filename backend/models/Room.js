import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, default: 'Untitled' },
  content: { type: String, default: '' },
  lastModified: { type: Date, default: Date.now }
});

const roomSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    default: function () {
      return `Room ${this.id}`;
    },
  },
  documents: {
    type: [documentSchema],
    default: [],
  },
}, {
  timestamps: true,
});

// Create or update document content
roomSchema.statics.findOrCreate = async function (roomId) {
  let room = await this.findOne({ id: roomId });
  if (!room) {
    // Create with a default document
    room = await this.create({
      id: roomId,
      documents: [{ id: 'default', title: 'Main Document', content: '' }]
    });
  } else if (!room.documents || room.documents.length === 0) {
    // Migration for existing rooms without documents array
    const oldContent = room.documentContent || '';
    room.documents = [{ id: 'default', title: 'Main Document', content: oldContent }];
    // Remove old field if possible, or just ignore it. Mongoose might keep it if strict is false.
    // We'll just set the new structure and save.
    await room.save();
  }
  return room;
};

// Create new document
roomSchema.methods.createDocument = async function (docData) {
  this.documents.push(docData);
  await this.save();
  return this;
};

// Update document content
roomSchema.methods.updateDocument = async function (documentId, content) {
  const doc = this.documents.find(d => d.id === documentId);
  if (doc) {
    doc.content = content;
    doc.lastModified = new Date();
    await this.save();
  }
  return this;
};

// Delete document
roomSchema.methods.deleteDocument = async function (documentId) {
  this.documents = this.documents.filter(d => d.id !== documentId);
  await this.save();
  return this;
};

const Room = mongoose.model('Room', roomSchema);

export default Room;
