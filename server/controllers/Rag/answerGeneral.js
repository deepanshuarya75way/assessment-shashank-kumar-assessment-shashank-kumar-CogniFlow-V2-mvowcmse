import Message from "../../models/Message.js";
import Room from "../../models/Room.js";
import { generateGeneralAnswer } from "../../services/rag/index.js";

export const answerGeneral = async (req, res) => {
  try {
    const { messageId } = req.params;

    const originalMessage = await Message.findById(messageId).populate("room");
    if (!originalMessage) {
      return res.status(404).json({ message: "Original message not found" });
    }

    const roomId = originalMessage.room._id || originalMessage.room;
    const room = await Room.findById(roomId);

    if (!room || !room.members.some((m) => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Not authorized in this room" });
    }

    if (originalMessage.answerMode !== "no_context") {
      return res.status(400).json({ message: "Can only trigger general answer on a no_context message" });
    }

    if (!originalMessage.actions?.includes("answer_general")) {
      return res.status(409).json({ message: "General answer has already been requested for this message" });
    }

    const question = originalMessage.replyToQuestion || "User question";

    if (global.io) {
      global.io.in(String(roomId)).emit("typing", roomId);
    }

    let generalAnswerText = "";
    try {
      // Get recent history for context
      const recentMessages = await Message.find({ room: roomId })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("sender", "username");

      const history = recentMessages.reverse().map((msg) => ({
        sender: msg.sender,
        content: msg.content,
        isAiResponse: msg.isAiResponse,
      }));

      generalAnswerText = await generateGeneralAnswer({ question, history });
    } finally {
      if (global.io) {
        global.io.in(String(roomId)).emit("stop typing", roomId);
      }
    }

    // 1. Create new general knowledge bot message
    const botMessage = await Message.create({
      sender: global.cogniBotId,
      room: roomId,
      content: generalAnswerText,
      messageType: "text",
      isAiResponse: true,
      answerMode: "general",
      replyToQuestion: question,
      actions: ["add_to_knowledge"],
      ragSources: [],
      deliveredTo: [req.user._id],
      readBy: [req.user._id],
    });

    const populatedBotMessage = await botMessage.populate([
      { path: "sender", select: "username profilePic" },
      { path: "room", select: "name isGroupChat members" },
    ]);

    // 2. Remove "answer_general" action from original message to prevent duplicate triggering
    originalMessage.actions = (originalMessage.actions || []).filter((a) => a !== "answer_general");
    await originalMessage.save();

    // 3. Update room lastMessage
    room.lastMessage = botMessage._id;
    await room.save();

    // 4. Emit socket events
    if (global.io) {
      global.io.in(String(roomId)).emit("message edited", originalMessage);
      global.io.in(String(roomId)).emit("message received", populatedBotMessage);
    }

    return res.status(201).json(populatedBotMessage);
  } catch (error) {
    console.error("[answerGeneral Error]", error);
    return res.status(500).json({ message: error.message || "Failed to generate general answer" });
  }
};

export default answerGeneral;
