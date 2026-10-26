import Room from "../../models/Room.js";
import KnowledgeSource from "../../models/KnowledgeSource.js";

export const listSources = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.members.some((m) => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Not authorized to view sources in this room" });
    }

    const sources = await KnowledgeSource.find({ room: roomId })
      .populate("owner", "username profilePic")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      sources,
      count: sources.length,
      mode: room.ragSettings?.mode || "strict",
    });
  } catch (error) {
    console.error("[listSources Error]", error);
    return res.status(500).json({ message: "Failed to fetch knowledge sources" });
  }
};

export default listSources;
