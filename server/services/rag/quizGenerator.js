import KnowledgeSource from "../../models/KnowledgeSource.js";
import KnowledgeChunk from "../../models/KnowledgeChunk.js";
import Message from "../../models/Message.js";
import Room from "../../models/Room.js";
import { callGeminiWithFallback } from "../../utils/aiClient.js";

/**
 * Generates an interactive multiple-choice quiz based on room documents
 */
export const generateDocumentQuiz = async ({
  roomId,
  userId,
  topic = "",
  numQuestions = 5,
}) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined");
  }

  const room = await Room.findById(roomId);
  if (!room) {
    throw new Error("Room not found");
  }

  // 1. Fetch ready enabled sources for this room
  const sources = await KnowledgeSource.find({
    room: roomId,
    status: "ready",
    enabled: true,
  });

  if (!sources || sources.length === 0) {
    return {
      status: "no_documents",
      message: "Please upload at least one PDF or document to your Knowledge Base before taking a quiz.",
    };
  }

  // 2. Fetch sample chunks from the room documents
  const chunks = await KnowledgeChunk.find({
    room: roomId,
    enabled: true,
  })
    .populate("source", "title originalName")
    .limit(20)
    .lean();

  if (!chunks || chunks.length === 0) {
    return {
      status: "no_documents",
      message: "Your uploaded documents are still processing. Please try again in a moment.",
    };
  }

  // Format context for Gemini
  const documentContext = chunks
    .map(
      (c, idx) =>
        `[Document ${idx + 1}: "${c.source?.title || "Document"}", Page: ${c.page || 1}]\n${c.text}`
    )
    .join("\n\n---\n\n");

  const prompt = `You are CogniBot, an expert AI tutor. Generate an interactive multiple-choice quiz with ${numQuestions} questions based EXCLUSIVELY on the provided document excerpts.
${topic ? `Focus particularly on topic: "${topic}".` : "Cover key facts, concepts, and details from across the documents."}

Each question must have:
- A clear, concise question testing comprehension or factual recall.
- Exactly 4 plausible options (labeled conceptually A, B, C, D).
- "correctAnswerIndex": integer from 0 to 3 corresponding to the correct option.
- "explanation": a clear 1-2 sentence explanation of why this answer is correct.
- "sourceTitle": title of the source document where this fact was found.
- "sourcePage": page number where this fact was found (integer).

Output MUST strictly match this JSON schema:
{
  "title": "Concise quiz title summarizing the document subject",
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswerIndex": 0,
      "explanation": "Why this is correct citing the facts.",
      "sourceTitle": "Document Name",
      "sourcePage": 1
    }
  ]
}

DOCUMENT EXCERPTS:
${documentContext}`;

  let result = null;
  let lastErr = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      result = await callGeminiWithFallback({
        contents: prompt,
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      });
      if (result) break;
    } catch (err) {
      lastErr = err;
      console.warn(`[quizGenerator] Attempt ${attempt} failed (${err.message}). Retrying in ${attempt * 1.5}s...`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }

  if (!result) {
    throw lastErr || new Error("Failed to generate quiz due to AI model unavailability");
  }
  let parsedQuiz;
  try {
    const rawText = result.response.text().trim();
    parsedQuiz = JSON.parse(rawText);
  } catch (parseErr) {
    console.error("[generateDocumentQuiz] Failed to parse quiz JSON:", parseErr);
    throw new Error("Failed to format quiz from document content");
  }

  const questions = (parsedQuiz.questions || []).map((q, idx) => ({
    id: idx + 1,
    question: q.question,
    options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["True", "False", "Partially", "None"],
    correctAnswerIndex: typeof q.correctAnswerIndex === "number" && q.correctAnswerIndex >= 0 && q.correctAnswerIndex <= 3 ? q.correctAnswerIndex : 0,
    explanation: q.explanation || "Refer to the source document for details.",
    sourceTitle: q.sourceTitle || sources[0]?.title || "Uploaded Document",
    sourcePage: q.sourcePage || 1,
  }));

  const quizTitle = parsedQuiz.title || `${sources[0]?.title || "Document"} Mastery Quiz`;

  // 3. Save as Message in DB
  const botMessage = await Message.create({
    sender: global.cogniBotId,
    room: roomId,
    content: `🎯 **Interactive Quiz: ${quizTitle}**\nTest your knowledge on the uploaded documents! Select your answers below for real-time feedback and explanations.`,
    messageType: "quiz",
    isAiResponse: true,
    answerMode: "grounded",
    quizData: {
      title: quizTitle,
      questions,
      totalQuestions: questions.length,
    },
    ragSources: questions.map((q) => ({
      title: q.sourceTitle,
      page: q.sourcePage,
      score: 1.0,
      snippet: q.explanation,
    })),
    deliveredTo: userId ? [userId] : [],
    readBy: userId ? [userId] : [],
  });

  const populatedMessage = await botMessage.populate([
    { path: "sender", select: "username profilePic" },
    { path: "room", select: "name isGroupChat members" },
  ]);

  room.lastMessage = botMessage._id;
  await room.save();

  // 4. Emit via socket so all users in the chat room see the interactive quiz
  if (global.io) {
    if (room.isGroupChat) {
      global.io.in(String(roomId)).emit("message received", populatedMessage);
    } else {
      global.io.in(String(userId)).emit("message received", populatedMessage);
      global.io.in(String(global.cogniBotId)).emit("message received", populatedMessage);
    }
  }

  return {
    status: "success",
    message: populatedMessage,
  };
};

export default generateDocumentQuiz;
