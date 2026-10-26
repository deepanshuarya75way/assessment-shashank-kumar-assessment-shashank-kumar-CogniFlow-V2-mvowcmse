import Room from "../../models/Room.js";

const fetchUserRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user._id })
      .populate("members", "-password")
      .populate("admin", "-password")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username profilePic" },
      })
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Server error while fetching rooms." });
  }
};

export default fetchUserRooms;