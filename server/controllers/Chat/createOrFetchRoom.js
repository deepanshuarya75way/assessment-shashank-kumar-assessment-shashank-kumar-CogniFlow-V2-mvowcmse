import Room from "../../models/Room.js";

const createOrFetchRoom = async (req, res) => {
  try {
    const { isGroupChat, name, members = [], profilePic = "" } = req.body;
    const currentUserId = req.user._id.toString();

    const updatedMembers = [
      ...new Set([...members.map((id) => id.toString()), currentUserId]),
    ];

    if (!isGroupChat) {
      if (updatedMembers.length !== 2) {
        return res.status(400).json({
          message: "1-on-1 chats require exactly 2 members.",
        });
      }

      const existingRoom = await Room.findOne({
        isGroupChat: false,
        members: { $all: updatedMembers, $size: 2 },
      }).populate("members", "-password");

      if (existingRoom) {
        return res.status(200).json(existingRoom);
      }
    }

    if (isGroupChat) {
      if (!name || updatedMembers.length < 3) {
        return res.status(400).json({
          message: "Group chat requires name and at least 3 members",
        });
      }
    }

    const roomData = {
      isGroupChat,
      members: updatedMembers,
      ...(isGroupChat && { name, admin: currentUserId, profilePic }),
    };

    const room = await Room.create(roomData);

    const populatedRoom = await Room.findById(room._id)
      .populate("members", "-password")
      .populate("admin", "-password");

    res.status(201).json(populatedRoom);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ message: "Server error while creating room." });
  }
};

export default createOrFetchRoom;
