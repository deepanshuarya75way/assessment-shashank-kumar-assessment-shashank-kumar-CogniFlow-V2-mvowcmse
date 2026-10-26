import Message from "../../models/Message.js";
import Room from "../../models/Room.js";
import User from "../../models/User.js";
import { generateAIResponse } from "../../utils/aiClient.js";
import { answerWithRag } from "../../services/rag/index.js";
import { generateDocumentQuiz } from "../../services/rag/quizGenerator.js";

const sendMessage = async (req, res) => {
  try {
    const { content, roomId, messageType, fileUrl, filePublicId, fileName, ragMode } = req.body;

    if (!roomId || (!content && !fileUrl)) {
      return res.status(400).json({
        message: "Message must have content or file",
      });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room Not Found!" });
    }

    if (!room.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const message = await Message.create({
      sender: req.user._id,
      room: roomId,
      content,
      messageType,
      fileUrl,
      filePublicId,
      fileName: fileName || (fileUrl ? decodeURIComponent(fileUrl.split("/").pop().split("?")[0]) : ""),
      deliveredTo: [req.user._id],
      readBy: [req.user._id],
    });

    const populatedMessage = await message.populate([
      { path: "sender", select: "username profilePic" },
      { path: "room", select: "name isGroupChat members" },
    ]);

    // Update unread count for other members
    room.members.forEach((memberId) => {
      if (memberId.toString() !== req.user._id.toString()) {
        const currentCount = room.unreadCounts.get(memberId.toString()) || 0;
        room.unreadCounts.set(memberId.toString(), currentCount + 1);
      }
    });

    room.lastMessage = message._id;
    await room.save();

    res.status(201).json(populatedMessage);

    // --- AI & RAG INTEGRATION ---
    let botId = global.cogniBotId;
    if (!botId) {
      const bot = await User.findOne({
        $or: [{ username: "CogniBot" }, { email: "cognibot@cogniflow.ai" }],
      });
      if (bot) {
        botId = bot._id.toString();
        global.cogniBotId = botId;
      }
    }

    const isDirectAI = !room.isGroupChat && botId && room.members.some((m) => m.toString() === botId.toString());
    const isMentionedAI = Boolean(content && /@cogni\b/i.test(content));

    if ((isDirectAI || isMentionedAI) && botId && req.user._id.toString() !== botId.toString()) {
      (async () => {
        try {
          let prompt = content || "";
          if (isMentionedAI) {
            prompt = prompt.replace(/@cogni/gi, "").trim();
          }

          if (!prompt && fileUrl) {
            prompt = "Please analyze and explain the main points of this attached document.";
          }

          // Fetch recent chat history for context
          const recentMessages = await Message.find({ room: roomId })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("sender", "username");

          const history = recentMessages.reverse().map((msg) => ({
            role: (msg.sender?._id?.toString() === botId || msg.sender?.toString() === botId) ? "model" : "user",
            content: `[${msg.sender?.username || "User"}]: ${msg.content}`,
          }));

          if (global.io) {
            global.io.in(roomId).emit("typing", roomId);
          }

          let aiResponseText = "";
          let answerMode = "plain";
          let ragSources = [];
          let replyToQuestion = null;
          let actions = [];

          // Check for Document Quiz request
          const isQuizRequest = /\b(quiz|mcq|test me on|quiz me)\b/i.test(prompt) || prompt.trim().startsWith("/quiz");
          if (isQuizRequest) {
            try {
              const quizResult = await generateDocumentQuiz({
                roomId,
                userId: req.user._id,
                topic: prompt.replace(/\/quiz|quiz me|quiz|test me/gi, "").trim(),
              });

              if (quizResult.status === "success") {
                // Quiz message created and broadcasted via socket
                return;
              } else if (quizResult.status === "no_documents") {
                aiResponseText = quizResult.message;
                answerMode = "plain";
              }
            } catch (quizErr) {
              console.warn("[sendMessage] Quiz generation error:", quizErr.message);
            }
          }

          // Try RAG first if knowledge sources exist for this room
          let ragResult = null;
          if (!aiResponseText && prompt) {
            try {
              ragResult = await answerWithRag({
                room,
                userMessage: prompt,
                history,
                modeOverride: ragMode || "grounded",
              });
            } catch (ragErr) {
              console.warn("[sendMessage] RAG execution error, falling back to standard AI:", ragErr.message);
            }
          }

          if (ragResult && ragResult.answerMode === "grounded") {
            aiResponseText = ragResult.content;
            answerMode = ragResult.answerMode;
            ragSources = ragResult.ragSources || [];
            replyToQuestion = ragResult.replyToQuestion || null;
            actions = ragResult.actions || [];
          } else {
            // Standard multimodal AI response (with direct PDF/image inspection)
            aiResponseText = await generateAIResponse(prompt, history, fileUrl);
            answerMode = "plain";
          }

          const aiMessage = await Message.create({
            sender: botId,
            room: roomId,
            content: aiResponseText || "I'm here to help! Ask me anything.",
            messageType: "text",
            fileUrl: "",
            filePublicId: "",
            isAiResponse: true,
            answerMode,
            ragSources,
            replyToQuestion,
            actions,
          });

          const populatedAIMessage = await aiMessage.populate([
            { path: "sender", select: "username profilePic" },
            { path: "room", select: "name isGroupChat members" },
          ]);

          room.lastMessage = aiMessage._id;

          room.members.forEach((memberId) => {
            if (memberId.toString() !== botId.toString()) {
              const currentCount = room.unreadCounts.get(memberId.toString()) || 0;
              room.unreadCounts.set(memberId.toString(), currentCount + 1);
            }
          });

          await room.save();

          if (global.io) {
            global.io.in(roomId.toString()).emit("message received", populatedAIMessage);
            room.members.forEach((memberId) => {
              global.io.in(memberId.toString()).emit("message received", populatedAIMessage);
            });
          }
        } catch (aiError) {
          console.error("Error generating AI response:", aiError);
        } finally {
          if (global.io) {
            global.io.in(roomId).emit("stop typing", roomId);
          }
        }
      })();
    }
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error while sending message." });
  }
};

export default sendMessage;
