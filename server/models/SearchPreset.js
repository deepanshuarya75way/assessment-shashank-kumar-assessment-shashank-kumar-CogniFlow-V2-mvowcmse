import mongoose from "mongoose";

const searchPresetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    filters: {
      query: { type: String, default: "" },
      type: { type: String, default: "all" },
      roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        default: null,
      },
      from: { type: Date, default: null },
      to: { type: Date, default: null },
      sort: { type: String, default: "newest" },
    },
  },
  { timestamps: true }
);

searchPresetSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("SearchPreset", searchPresetSchema);