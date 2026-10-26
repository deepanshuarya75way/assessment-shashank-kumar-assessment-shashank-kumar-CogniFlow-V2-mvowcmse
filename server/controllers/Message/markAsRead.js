import Room from "../../models/Room.js";

const markAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room Not Found!" });
    }

    if (!room.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Reset unread count for current user
    room.unreadCounts.set(req.user._id.toString(), 0);
    await room.save();

    res.status(200).json({ message: "Marked as read successfully" });
  } catch (error) {
    console.error("Error marking room as read:", error);
    res.status(500).json({ message: "Server error while marking as read." });
  }
};

export default markAsRead;
