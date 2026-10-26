import Room from "../../models/Room.js";

export const updateRagSettings = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { mode } = req.body;

    const validModes = ["off", "strict", "hybrid"];
    if (!validModes.includes(mode)) {
      return res.status(400).json({
        message: `Invalid mode. Must be one of: ${validModes.join(", ")}`,
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.members.some((m) => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Not authorized in this room" });
    }

    room.ragSettings = room.ragSettings || {};
    room.ragSettings.mode = mode;
    await room.save();

    if (global.io) {
      global.io.to(String(room._id)).emit("room:rag-mode", {
        roomId: room._id,
        mode,
      });
    }

    return res.status(200).json({
      message: `RAG mode updated to ${mode}`,
      ragSettings: room.ragSettings,
    });
  } catch (error) {
    console.error("[updateRagSettings Error]", error);
    return res.status(500).json({ message: "Failed to update RAG settings" });
  }
};

export default updateRagSettings;
