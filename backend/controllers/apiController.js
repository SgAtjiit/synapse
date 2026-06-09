import UserHistory from '../models/UserHistory.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';

// Get user's room history
export const getUserHistory = async (req, res) => {
    try {
        const { firebaseUid } = req.params;
        const history = await UserHistory.getByUser(firebaseUid);
        res.json({ success: true, history });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch history' });
    }
};

// Get room details with messages
export const getRoomDetails = async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await Room.findOne({ id: roomId });
        if (!room) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        const messages = await Message.getByRoom(roomId);

        res.json({
            success: true,
            room: room.toObject(),
            messages,
        });
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch room' });
    }
};
