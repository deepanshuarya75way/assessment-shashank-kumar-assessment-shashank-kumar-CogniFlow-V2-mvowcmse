import crypto from "crypto";
import { fileTypeFromBuffer } from "file-type";
import Room from "../../models/Room.js";
import KnowledgeSource from "../../models/KnowledgeSource.js";
import { uploadToCloudinary } from "../../utils/cloudinaryHelper.js";
import { enqueueIngestion } from "../../services/rag/ingestQueue.js";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export const uploadSource = async (req, res) => {
  try {
    const { roomId } = req.body;
    const file = req.file;

    if (!roomId) {
      return res.status(400).json({ message: "roomId is required" });
    }

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Check room membership
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.members.some((m) => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "You are not a member of this room" });
    }

    const buffer = file.buffer || (file.path ? await import("fs/promises").then((f) => f.readFile(file.path)) : null);
    if (!buffer) {
      return res.status(400).json({ message: "File data could not be read" });
    }

    // Verify magic bytes
    let detectedType = await fileTypeFromBuffer(buffer);
    let mimeType = detectedType ? detectedType.mime : file.mimetype;

    // Fallback for text-based or special PDFs
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      if (file.originalname?.toLowerCase().endsWith(".pdf")) {
        mimeType = "application/pdf";
      } else {
        return res.status(400).json({
          message: `Unsupported file type (${mimeType}). Supported: PDF, PNG, JPG, WEBP`,
        });
      }
    }

    // Compute SHA-256 hash for deduplication
    const contentHash = crypto.createHash("sha256").update(buffer).digest("hex");

    const existing = await KnowledgeSource.findOne({
      room: roomId,
      contentHash,
    });

    if (existing) {
      if (existing.status === "failed") {
        existing.status = "pending";
        await existing.save();
        enqueueIngestion(existing._id, buffer);
      }
      return res.status(200).json({
        message: `File "${file.originalname}" is ready in knowledge base`,
        source: existing,
        alreadyExists: true,
      });
    }

    // Determine type
    const isPdf = mimeType === "application/pdf";
    const sourceType = isPdf ? "pdf" : "image";

    // Upload to Cloudinary
    let fileUrl = null;
    let filePublicId = null;

    if (file.path) {
      const uploadRes = await uploadToCloudinary(file.path, {
        resourceType: isPdf ? "raw" : "image",
        folder: "cogniflow_knowledge",
      });
      fileUrl = uploadRes.url;
      filePublicId = uploadRes.publicId;
    }

    // Create KnowledgeSource
    const source = await KnowledgeSource.create({
      owner: req.user._id,
      room: roomId,
      type: sourceType,
      title: file.originalname,
      originalName: file.originalname,
      mimeType,
      sizeBytes: buffer.length,
      fileUrl,
      filePublicId,
      contentHash,
      status: "pending",
      enabled: true,
    });

    // Enqueue ingestion in background
    enqueueIngestion(source._id, buffer);

    return res.status(202).json({
      message: "Knowledge source upload accepted and queued for processing",
      source,
    });
  } catch (error) {
    console.error("[uploadSource Error]", error);
    return res.status(500).json({ message: error.message || "Failed to upload knowledge source" });
  }
};

export default uploadSource;
