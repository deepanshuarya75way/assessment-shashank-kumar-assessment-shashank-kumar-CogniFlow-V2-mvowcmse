import KnowledgeSource from "../../models/KnowledgeSource.js";
import Room from "../../models/Room.js";
import vectorStore from "../../services/rag/vectorStore.js";
import { emitKnowledgeStatus } from "../../services/rag/ingestQueue.js";

export const toggleSource = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ message: "enabled boolean is required" });
    }

    const source = await KnowledgeSource.findById(id);
    if (!source) {
      return res.status(404).json({ message: "Knowledge source not found" });
    }

    const room = await Room.findById(source.room);
    if (!room || !room.members.some((m) => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Not authorized in this room" });
    }

    source.enabled = enabled;
    await source.save();

    await vectorStore.setEnabledBySource(source._id, enabled);

    emitKnowledgeStatus(source.room, {
      sourceId: source._id,
      roomId: source.room,
      enabled: source.enabled,
      status: source.status,
    });

    return res.status(200).json({
      message: `Source ${enabled ? "enabled" : "disabled"} successfully`,
      source,
    });
  } catch (error) {
    console.error("[toggleSource Error]", error);
    return res.status(500).json({ message: "Failed to toggle source" });
  }
};

export default toggleSource;
