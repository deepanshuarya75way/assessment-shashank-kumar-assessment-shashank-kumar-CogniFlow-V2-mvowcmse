import Message from "../../models/Message.js";
import Room from "../../models/Room.js";

const fetchMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const historyRecord = (room.clearedHistory || []).find(
      (h) => h.user.toString() === req.user._id.toString()
    );

    const query = { 
      room: roomId,
      deletedFor: { $ne: req.user._id }
    };
    if (historyRecord) {
      query.createdAt = { $gt: historyRecord.timestamp };
    }

    const messages = await Message.find(query)
      .populate("sender", "username profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error while fetching messages." });
  }
};

export default fetchMessages;
