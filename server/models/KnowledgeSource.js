import mongoose from "mongoose";

const knowledgeSourceSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    type: {
      type: String,
      enum: ["pdf", "image", "text", "ai_answer"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      trim: true,
    },
    mimeType: {
      type: String,
      trim: true,
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    filePublicId: {
      type: String,
      default: null,
    },
    contentHash: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "ready", "failed"],
      default: "pending",
      index: true,
    },
    error: {
      type: String,
      default: null,
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

knowledgeSourceSchema.index({ room: 1, contentHash: 1 });
knowledgeSourceSchema.index({ room: 1, createdAt: -1 });

const KnowledgeSource = mongoose.model("KnowledgeSource", knowledgeSourceSchema);
export default KnowledgeSource;
