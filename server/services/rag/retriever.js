import { GoogleGenerativeAI } from "@google/generative-ai";
import KnowledgeSource from "../../models/KnowledgeSource.js";
import RAG_CONFIG from "./config.js";
import { embedQuery } from "./embeddings.js";
import vectorStore from "./vectorStore.js";
import { CONDENSE_PROMPT } from "./prompts.js";
import { callGeminiWithFallback } from "../../utils/aiClient.js";

/**
 * Rewrites a conversational follow-up question into a standalone query
 */
export const condenseQuestion = async (question, history = []) => {
  if (!history || history.length === 0) {
    return question;
  }

  // Only take last N turns
  const recentHistory = history.slice(-RAG_CONFIG.HISTORY_TURNS_FOR_CONDENSE);
  if (recentHistory.length === 0) {
    return question;
  }

  try {
    if (!process.env.GEMINI_API_KEY) return question;

    const formattedHistory = recentHistory
      .map((msg) => `${msg.sender?.username || (msg.isAiResponse ? "CogniBot" : "User")}: ${msg.content}`)
      .join("\n");

    const prompt = `${CONDENSE_PROMPT}\n\nChat History:\n${formattedHistory}\n\nFollow-up question:\n${question}`;

    const result = await callGeminiWithFallback({ contents: prompt });
    const text = result.response.text().trim();
    return text || question;
  } catch (err) {
    console.warn("[RAG Retriever] Could not condense question, using raw text:", err.message);
    return question;
  }
};

/**
 * Checks similarity / near-duplicate between two text chunks
 */
const isNearDuplicate = (textA, textB) => {
  if (!textA || !textB) return false;
  if (textA === textB) return true;

  const minLen = Math.min(textA.length, textB.length);
  const maxLen = Math.max(textA.length, textB.length);

  // If one chunk is almost completely contained in another
  if (minLen / maxLen > 0.85) {
    if (textA.includes(textB) || textB.includes(textA)) return true;
  }

  return false;
};

/**
 * Core retrieval pipeline:
 * Condense -> Embed -> Vector Search -> Threshold Filter -> Deduplicate -> Populate Sources
 */
export const retrieve = async ({ roomId, question, history = [] }) => {
  if (!roomId || !question) {
    return { standaloneQuestion: question, chunks: [], topScore: 0 };
  }

  // 1. Condense follow-up question if history exists
  const standaloneQuestion = await condenseQuestion(question, history);

  // 2. Embed the question
  const queryVector = await embedQuery(standaloneQuestion);

  // 3. Search vector store
  const rawResults = await vectorStore.search({
    roomId,
    queryVector,
    limit: RAG_CONFIG.TOP_K * 2,
    numCandidates: RAG_CONFIG.NUM_CANDIDATES,
  });

  if (!rawResults || rawResults.length === 0) {
    return { standaloneQuestion, chunks: [], topScore: 0 };
  }

  const topScore = rawResults[0]?.score || 0;

  // 4. Filter by minimum score (or keep top results if all fell below)
  let qualifying = rawResults.filter((r) => r.score >= RAG_CONFIG.MIN_SCORE);
  if (qualifying.length === 0 && rawResults.length > 0) {
    qualifying = rawResults.slice(0, Math.min(rawResults.length, RAG_CONFIG.TOP_K));
  }

  // 5. Deduplicate overlapping chunks
  const deduplicated = [];
  for (const item of qualifying) {
    const isDup = deduplicated.some((existing) => isNearDuplicate(existing.text, item.text));
    if (!isDup) {
      deduplicated.push(item);
    }
    if (deduplicated.length >= RAG_CONFIG.TOP_K) break;
  }

  if (deduplicated.length === 0) {
    return { standaloneQuestion, chunks: [], topScore };
  }

  // 6. Populate source metadata
  const sourceIds = [...new Set(deduplicated.map((c) => String(c.source)))];
  const sources = await KnowledgeSource.find({ _id: { $in: sourceIds } })
    .select("title originalName type")
    .lean();

  const sourceMap = new Map();
  sources.forEach((s) => {
    sourceMap.set(String(s._id), s);
  });

  const enrichedChunks = deduplicated.map((c) => {
    const s = sourceMap.get(String(c.source));
    return {
      _id: c._id,
      text: c.text,
      page: c.page,
      source: c.source,
      origin: c.origin,
      score: c.score,
      sourceTitle: s ? s.title || s.originalName : "Document",
      sourceType: s?.type || "pdf",
    };
  });

  console.log(
    `[RAG Retriever] Found ${enrichedChunks.length} chunks (top score: ${topScore.toFixed(3)}) for "${standaloneQuestion}"`
  );

  return {
    standaloneQuestion,
    chunks: enrichedChunks,
    topScore,
  };
};

export default {
  retrieve,
  condenseQuestion,
};
