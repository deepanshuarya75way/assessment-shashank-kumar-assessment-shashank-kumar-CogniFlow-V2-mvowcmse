import crypto from "crypto";
import Room from "../../models/Room.js";
import KnowledgeSource from "../../models/KnowledgeSource.js";
import { enqueueIngestion } from "../../services/rag/ingestQueue.js";

export const uploadTextSource = async (req, res) => {
  try {
    const { roomId, title, text } = req.body;

    if (!roomId || !text || !text.trim()) {
      return res.status(400).json({ message: "roomId and text are required" });
    }

    const room = await Room.findById(roomId);
    if (!room || !room.members.some((m) => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Not authorized in this room" });
    }

    const cleanText = text.trim();
    if (cleanText.length < 20) {
      return res.status(400).json({ message: "Text must be at least 20 characters long" });
    }

    const contentHash = crypto.createHash("sha256").update(cleanText).digest("hex");

    const existing = await KnowledgeSource.findOne({ room: roomId, contentHash });
    if (existing) {
      return res.status(409).json({
        message: "This text note has already been added to the knowledge base",
        source: existing,
      });
    }

    const sourceTitle = (title || cleanText.slice(0, 40) || "Text Note").trim();
    const buffer = Buffer.from(cleanText, "utf-8");

    const source = await KnowledgeSource.create({
      owner: req.user._id,
      room: roomId,
      type: "text",
      title: sourceTitle,
      originalName: "Note.txt",
      mimeType: "text/plain",
      sizeBytes: buffer.length,
      contentHash,
      status: "pending",
      enabled: true,
    });

    enqueueIngestion(source._id, buffer);

    return res.status(202).json({
      message: "Text knowledge source accepted and queued for processing",
      source,
    });
  } catch (error) {
    console.error("[uploadTextSource Error]", error);
    return res.status(500).json({ message: "Failed to upload text knowledge source" });
  }
};

export default uploadTextSource;
