import Room from "../../models/Room.js";

const removeFromGroup = async (req, res) => {
  try {
    const { roomId, userId } = req.body;

    if (!roomId || !userId) {
      return res.status(400).json({ message: "Please provide room ID and user ID." });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (!room.isGroupChat) {
      return res.status(400).json({ message: "This is not a group chat." });
    }

    // Only allow removal if the requester is the admin, OR if the requester is removing themselves (leaving)
    if (room.admin.toString() !== req.user._id.toString() && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: "Only the group admin can remove members." });
    }

    if (!room.members.includes(userId)) {
      return res.status(400).json({ message: "User is not in the group." });
    }

    // Prevent removing the admin
    if (room.admin.toString() === userId) {
      return res.status(400).json({ message: "Admin cannot be removed. You must delete the group or transfer ownership." });
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { $pull: { members: userId } },
      { new: true }
    )
      .populate("members", "-password")
      .populate("admin", "-password");

    res.status(200).json(updatedRoom);
  } catch (error) {
    console.error("Error removing from group:", error);
    res.status(500).json({ message: "Server error while removing from group." });
  }
};

export default removeFromGroup;
