import Room from "../../models/Room.js";

const addToGroup = async (req, res) => {
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

    if (room.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the group admin can add members." });
    }

    if (room.members.includes(userId)) {
      return res.status(400).json({ message: "User is already in the group." });
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { $push: { members: userId } },
      { new: true }
    )
      .populate("members", "-password")
      .populate("admin", "-password");

    res.status(200).json(updatedRoom);
  } catch (error) {
    console.error("Error adding to group:", error);
    res.status(500).json({ message: "Server error while adding to group." });
  }
};

export default addToGroup;
