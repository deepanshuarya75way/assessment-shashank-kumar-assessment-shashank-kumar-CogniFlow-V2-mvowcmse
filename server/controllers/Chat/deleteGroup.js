import Room from "../../models/Room.js";
import Message from "../../models/Message.js";

const deleteGroup = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({ message: "Please provide a valid room ID." });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (!room.isGroupChat) {
      return res.status(400).json({ message: "This endpoint is only for deleting group chats." });
    }

    // Verify Admin
    if (room.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the group admin can delete the group." });
    }

    // Delete all messages associated with this room
    await Message.deleteMany({ room: roomId });

    // Delete the room
    await Room.findByIdAndDelete(roomId);

    res.status(200).json({ message: "Group and all associated messages successfully deleted." });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ message: "Server error while deleting group." });
  }
};

export default deleteGroup;
