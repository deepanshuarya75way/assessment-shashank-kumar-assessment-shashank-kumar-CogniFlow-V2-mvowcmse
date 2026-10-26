import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "quiz"],
      default: "text",
    },

    fileUrl: {
      type: String,
    },
    filePublicId: {
      type: String,
    },
    fileName: {
      type: String,
    },
    isAiResponse: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    deliveredTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    quizData: {
      title: { type: String, default: "Document Knowledge Quiz" },
      questions: [
        {
          id: Number,
          question: String,
          options: [String],
          correctAnswerIndex: Number,
          explanation: String,
          sourceTitle: String,
          sourcePage: Number,
        },
      ],
      totalQuestions: Number,
    },
    answerMode: {
      type: String,
      enum: ["grounded", "no_context", "general", "plain"],
      default: "plain",
    },
    ragSources: [
      {
        chunk: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "KnowledgeChunk",
        },
        source: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "KnowledgeSource",
        },
        title: String,
        page: Number,
        score: Number,
        snippet: String,
      },
    ],
    replyToQuestion: {
      type: String,
      default: null,
    },
    actions: {
      type: [String],
      default: [],
    },
    learned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
