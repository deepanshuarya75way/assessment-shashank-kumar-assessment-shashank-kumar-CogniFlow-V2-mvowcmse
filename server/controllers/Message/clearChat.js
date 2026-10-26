import Room from "../../models/Room.js";

const clearChat = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if user already cleared the chat previously and update the timestamp
    const historyIndex = room.clearedHistory.findIndex(
      (h) => h.user.toString() === req.user._id.toString()
    );

    if (historyIndex > -1) {
      room.clearedHistory[historyIndex].timestamp = Date.now();
    } else {
      room.clearedHistory.push({
        user: req.user._id,
        timestamp: Date.now(),
      });
    }

    await room.save();

    res.status(200).json({ message: "Chat cleared successfully", roomId });
  } catch (error) {
    console.error("Error clearing chat:", error);
    res.status(500).json({ message: "Server error while clearing chat." });
  }
};

export default clearChat;
