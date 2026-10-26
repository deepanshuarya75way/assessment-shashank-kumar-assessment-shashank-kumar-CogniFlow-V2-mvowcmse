import Message from "../../models/Message.js";
import Room from "../../models/Room.js";
import { learnFromMessage as learnService } from "../../services/rag/index.js";

export const learnFromMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { question, answer } = req.body;

    const message = await Message.findById(messageId).populate("room");
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const roomId = message.room._id || message.room;
    const room = await Room.findById(roomId);

    if (!room || !room.members.some((m) => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Not authorized in this room" });
    }

    if (message.answerMode !== "general") {
      return res.status(400).json({ message: "Can only learn from general knowledge answers" });
    }

    if (message.learned) {
      return res.status(409).json({ message: "This answer has already been added to the knowledge base" });
    }

    const result = await learnService({
      messageId,
      question: question || message.replyToQuestion,
      answer: answer || message.content,
      userId: req.user._id,
    });

    return res.status(200).json({
      message: "Answer successfully added to chat knowledge base!",
      source: result.source,
      updatedMessage: result.message,
    });
  } catch (error) {
    console.error("[learnFromMessage Error]", error);
    return res.status(500).json({ message: error.message || "Failed to learn from answer" });
  }
};

export default learnFromMessage;
