import Room from "../../models/Room.js";
import { generateDocumentQuiz } from "../../services/rag/quizGenerator.js";

export const generateQuizController = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { topic = "", numQuestions = 5 } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.members.some((m) => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Not authorized in this room" });
    }

    if (global.io) {
      global.io.in(String(roomId)).emit("typing", roomId);
    }

    let result;
    try {
      result = await generateDocumentQuiz({
        roomId,
        userId: req.user._id,
        topic,
        numQuestions: Math.min(Math.max(parseInt(numQuestions, 10) || 5, 1), 10),
      });
    } finally {
      if (global.io) {
        global.io.in(String(roomId)).emit("stop typing", roomId);
      }
    }

    if (result.status === "no_documents") {
      return res.status(400).json({ message: result.message });
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("[generateQuizController Error]", error);
    return res.status(500).json({
      message: error.message || "Failed to generate document quiz",
    });
  }
};

export default generateQuizController;
