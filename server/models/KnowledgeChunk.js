import mongoose from "mongoose";

const knowledgeChunkSchema = new mongoose.Schema(
  {
    source: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KnowledgeSource",
      required: true,
      index: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    page: {
      type: Number,
      default: 1,
    },
    chunkIndex: {
      type: Number,
      default: 0,
    },
    origin: {
      type: String,
      enum: ["upload", "learned"],
      default: "upload",
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    embeddingModel: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const KnowledgeChunk = mongoose.model("KnowledgeChunk", knowledgeChunkSchema);
export default KnowledgeChunk;
