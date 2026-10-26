import KnowledgeSource from "../../models/KnowledgeSource.js";
import Message from "../../models/Message.js";
import RAG_CONFIG from "./config.js";
import { retrieve } from "./retriever.js";
import {
  NO_ANSWER_SENTINEL,
  buildGroundedPrompt,
  GENERAL_ANSWER_SYSTEM_PROMPT,
} from "./prompts.js";
import { chunkPages } from "./chunker.js";
import { embedDocuments } from "./embeddings.js";
import vectorStore from "./vectorStore.js";
import { emitKnowledgeStatus } from "./ingestQueue.js";
import { callGeminiWithFallback } from "../../utils/aiClient.js";

/**
 * Generate answer from general knowledge using Gemini
 */
export const generateGeneralAnswer = async ({ question, history = [] }) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined");
  }

  let historyContext = "";
  if (history && history.length > 0) {
    const recent = history.slice(-RAG_CONFIG.HISTORY_TURNS_FOR_CONDENSE);
    historyContext =
      recent
        .map((m) => `${m.sender?.username || (m.isAiResponse ? "CogniBot" : "User")}: ${m.content}`)
        .join("\n") + "\n\n";
  }

  const prompt = `${historyContext}User question: ${question}`;
  const result = await callGeminiWithFallback({
    systemInstruction: GENERAL_ANSWER_SYSTEM_PROMPT,
    contents: prompt,
  });
  return result.response.text().trim();
};

/**
 * Handles outcomes when documents do not contain the answer
 */
const handleNoContext = async ({ mode, standaloneQuestion, history }) => {
  try {
    const generalText = await generateGeneralAnswer({
      question: standaloneQuestion,
      history,
    });

    return {
      content: generalText,
      answerMode: "general",
      ragSources: [],
      replyToQuestion: standaloneQuestion,
      actions: ["add_to_knowledge"],
    };
  } catch (err) {
    console.warn("[RAG] General fallback generation failed:", err.message);
  }

  return {
    content: "I couldn't find an answer to your question in the uploaded documents for this chat.",
    answerMode: "no_context",
    ragSources: [],
    replyToQuestion: standaloneQuestion,
    actions: ["answer_general"],
  };
};

/**
 * Main RAG orchestrator for incoming chat messages
 */
export const answerWithRag = async ({ room, userMessage, history = [], modeOverride = null }) => {
  if (!room || !userMessage) return null;

  const mode = modeOverride || room.ragSettings?.mode || "strict";
  if (mode === "off") {
    return null; // Bypass RAG, use normal CogniBot response
  }

  // Check if room has at least 1 ready knowledge source
  const readySourcesCount = await KnowledgeSource.countDocuments({
    room: room._id,
    status: "ready",
    enabled: true,
  });

  if (readySourcesCount === 0) {
    // No knowledge base uploaded for this room yet, use normal bot
    return null;
  }

  // 1. Retrieve relevant chunks
  const retrieved = await retrieve({
    roomId: room._id,
    question: userMessage,
    history,
  });

  if (!retrieved.chunks || retrieved.chunks.length === 0) {
    return await handleNoContext({
      mode,
      standaloneQuestion: retrieved.standaloneQuestion,
      history,
    });
  }

  // 2. Generate grounded answer
  try {
    const systemPrompt = buildGroundedPrompt(retrieved.chunks);
    const userPrompt = `Question: ${userMessage}`;
    const result = await callGeminiWithFallback({
      systemInstruction: systemPrompt,
      contents: userPrompt,
      generationConfig: {
        temperature: 0.2,
      },
    });
    const answerText = result.response.text().trim();

    // Check Gate 2: Model returned sentinel indicating lack of context
    if (answerText.includes(NO_ANSWER_SENTINEL)) {
      console.log(`[RAG] Model emitted sentinel ${NO_ANSWER_SENTINEL} for "${userMessage}"`);
      return await handleNoContext({
        mode,
        standaloneQuestion: retrieved.standaloneQuestion,
        history,
      });
    }

    // 3. Extract citation references [n]
    const citationRegex = /\[(\d+)\]/g;
    const matches = [...answerText.matchAll(citationRegex)];
    const citedIndices = new Set(matches.map((m) => parseInt(m[1], 10)));

    let citedChunks = retrieved.chunks.filter((_, idx) => citedIndices.has(idx + 1));
    // If no citations found in text, attach all retrieved chunks as reference
    if (citedChunks.length === 0) {
      citedChunks = retrieved.chunks;
    }

    const ragSources = citedChunks.map((chunk) => ({
      chunk: chunk._id,
      source: chunk.source,
      title: chunk.sourceTitle || "Document",
      page: chunk.page || 1,
      score: chunk.score || 0,
      snippet: (chunk.text || "").slice(0, 200),
    }));

    return {
      content: answerText,
      answerMode: "grounded",
      ragSources,
      replyToQuestion: retrieved.standaloneQuestion,
      actions: [],
    };
  } catch (err) {
    console.error("[RAG] Grounded generation error:", err);
    return await handleNoContext({
      mode,
      standaloneQuestion: retrieved.standaloneQuestion,
      history,
    });
  }
};

/**
 * Learn from an AI answer by saving it as a knowledge source
 */
export const learnFromMessage = async ({ messageId, question, answer, userId }) => {
  const message = await Message.findById(messageId).populate("room");
  if (!message) {
    throw new Error("Message not found");
  }

  if (message.learned) {
    throw new Error("This answer has already been added to the knowledge base");
  }

  const finalQuestion = (question || message.replyToQuestion || "").trim();
  const finalAnswer = (answer || message.content || "").trim();

  if (!finalQuestion || !finalAnswer) {
    throw new Error("Both question and answer are required to learn");
  }

  if (finalQuestion.length > 500) {
    throw new Error("Question cannot exceed 500 characters");
  }

  if (finalAnswer.length > 4000) {
    throw new Error("Answer cannot exceed 4,000 characters");
  }

  const title = `Learned: ${finalQuestion.slice(0, 50)}`;
  const learnedText = `Question: ${finalQuestion}\nAnswer: ${finalAnswer}`;

  // 1. Create KnowledgeSource
  const source = await KnowledgeSource.create({
    owner: userId,
    room: message.room._id || message.room,
    type: "ai_answer",
    title,
    originalName: "Learned Q&A",
    mimeType: "text/plain",
    sizeBytes: Buffer.byteLength(learnedText, "utf-8"),
    status: "processing",
    enabled: true,
  });

  // 2. Chunk text
  const pages = [{ page: 1, text: learnedText }];
  const chunks = chunkPages(pages);

  // 3. Embed chunks
  const chunkTexts = chunks.map((c) => c.text);
  const embeddings = await embedDocuments(chunkTexts);

  // 4. Upsert chunk docs
  const chunkDocs = chunks.map((c, i) => ({
    source: source._id,
    room: message.room._id || message.room,
    owner: userId,
    text: c.text,
    page: 1,
    chunkIndex: c.chunkIndex,
    origin: "learned",
    enabled: true,
    embedding: embeddings[i],
    embeddingModel: RAG_CONFIG.EMBEDDING_MODEL,
  }));

  await vectorStore.upsertChunks(chunkDocs);

  // 5. Update source to ready
  source.status = "ready";
  source.pageCount = 1;
  source.chunkCount = chunkDocs.length;
  await source.save();

  // 6. Update original message
  message.learned = true;
  message.actions = (message.actions || []).filter((a) => a !== "add_to_knowledge");
  await message.save();

  // 7. Emit socket updates
  emitKnowledgeStatus(message.room._id || message.room, {
    sourceId: source._id,
    roomId: message.room._id || message.room,
    status: "ready",
    chunkCount: source.chunkCount,
  });

  if (global.io) {
    global.io.to(String(message.room._id || message.room)).emit("message edited", message);
  }

  return { source, message };
};

export default {
  answerWithRag,
  generateGeneralAnswer,
  learnFromMessage,
};
