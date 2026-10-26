import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: function () {
        return this.isGroupChat;
      },
    },

    isGroupChat: {
      type: Boolean,
      default: false,
    },

    profilePic: {
      type: String,
      default: "",
    },

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.isGroupChat;
      },
    },

    members: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      validate: {
        validator: function (val) {
          return val.length >= 2;
        },
        message: "Room must have at least 2 members",
      },
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    documents: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        fileType: {
          type: String,
          enum: ["pdf", "image", "youtube"],
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    clearedHistory: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    ragSettings: {
      mode: {
        type: String,
        enum: ["off", "strict", "hybrid"],
        default: "strict",
      },
    },
  },
  { timestamps: true },
);

roomSchema.index({ members: 1 });

const Room = mongoose.model("Room", roomSchema);
export default Room;
