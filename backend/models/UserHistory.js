import mongoose from 'mongoose';

const userHistorySchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: true,
        index: true,
    },
    roomId: {
        type: String,
        required: true,
        index: true,
    },
    roomName: {
        type: String,
        default: function () {
            return `Room ${this.roomId}`;
        },
    },
    username: {
        type: String,
        required: true,
    },
    lastVisited: {
        type: Date,
        default: Date.now,
    },
    messageCount: {
        type: Number,
        default: 0,
    },
    firstVisited: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Compound index for efficient queries
userHistorySchema.index({ firebaseUid: 1, roomId: 1 }, { unique: true });

// Get user's room history
userHistorySchema.statics.getByUser = async function (firebaseUid, limit = 50) {
    return this.find({ firebaseUid })
        .sort({ lastVisited: -1 })
        .limit(limit)
        .lean();
};

// Record or update a room visit
userHistorySchema.statics.recordVisit = async function (data) {
    const { firebaseUid, roomId, roomName, username } = data;

    const existing = await this.findOne({ firebaseUid, roomId });

    if (existing) {
        existing.lastVisited = new Date();
        existing.roomName = roomName || existing.roomName;
        await existing.save();
        return existing;
    }

    return this.create({
        firebaseUid,
        roomId,
        roomName: roomName || `Room ${roomId}`,
        username,
        lastVisited: new Date(),
        firstVisited: new Date(),
    });
};

// Increment message count
userHistorySchema.statics.incrementMessageCount = async function (firebaseUid, roomId) {
    return this.findOneAndUpdate(
        { firebaseUid, roomId },
        { $inc: { messageCount: 1 }, lastVisited: new Date() },
        { new: true }
    );
};

const UserHistory = mongoose.model('UserHistory', userHistorySchema);

export default UserHistory;
