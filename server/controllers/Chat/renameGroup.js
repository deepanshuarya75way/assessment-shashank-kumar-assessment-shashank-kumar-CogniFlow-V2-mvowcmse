import Room from "../../models/Room.js";

const renameGroup = async (req, res) => {
  try {
    const { roomId, roomName, profilePic } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: "Please provide room ID." });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (!room.isGroupChat) {
      return res.status(400).json({ message: "This is not a group chat." });
    }

    if (room.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the group admin can update group settings." });
    }

    const updateData = {};
    if (roomName) updateData.name = roomName;
    if (profilePic !== undefined) updateData.profilePic = profilePic;

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      updateData,
      { new: true }
    )
      .populate("members", "-password")
      .populate("admin", "-password");

    res.status(200).json(updatedRoom);
  } catch (error) {
    console.error("Error renaming group:", error);
    res.status(500).json({ message: "Server error while renaming group." });
  }
};

export default renameGroup;
