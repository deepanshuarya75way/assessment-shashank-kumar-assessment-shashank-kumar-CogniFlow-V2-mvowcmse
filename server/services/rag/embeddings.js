import { GoogleGenerativeAI } from "@google/generative-ai";
import RAG_CONFIG from "./config.js";

const getGenAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in environment");
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

/**
 * L2 normalize vector for consistent cosine comparisons
 */
export const l2Normalize = (vector) => {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) return vector;
  return vector.map((val) => val / norm);
};

/**
 * Helper to retry async functions with exponential backoff
 */
const retryWithBackoff = async (fn, retries = 3, delayMs = 1000) => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const isRetryable =
        err.status === 429 ||
        err.status >= 500 ||
        err.message?.includes("429") ||
        err.message?.includes("RESOURCE_EXHAUSTED") ||
        err.message?.includes("fetch failed");

      if (attempt >= retries || !isRetryable) {
        throw err;
      }
      const backoff = delayMs * Math.pow(2, attempt - 1);
      console.warn(`[RAG Embeddings] Retryable error (${err.message}). Retrying in ${backoff}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
};

/**
 * Embed multiple document texts in batches
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export const embedDocuments = async (texts = []) => {
  if (!texts || texts.length === 0) return [];

  const model = getGenAI().getGenerativeModel({ model: RAG_CONFIG.EMBEDDING_MODEL });
  const allEmbeddings = [];
  const batchSize = RAG_CONFIG.EMBED_BATCH_SIZE;

  for (let i = 0; i < texts.length; i += batchSize) {
    const chunkBatch = texts.slice(i, i + batchSize);

    const batchVectors = await retryWithBackoff(async () => {
      const response = await model.batchEmbedContents({
        requests: chunkBatch.map((text) => ({
          content: { parts: [{ text }] },
          taskType: "RETRIEVAL_DOCUMENT",
          outputDimensionality: RAG_CONFIG.EMBEDDING_DIMENSIONS,
        })),
      });

      if (!response || !response.embeddings) {
        throw new Error("Invalid response from Gemini batchEmbedContents");
      }

      return response.embeddings.map((emb, idx) => {
        const values = emb.values;
        if (!values || values.length !== RAG_CONFIG.EMBEDDING_DIMENSIONS) {
          throw new Error(
            `Embedding dimension mismatch at chunk ${i + idx}: expected ${RAG_CONFIG.EMBEDDING_DIMENSIONS}, received ${values ? values.length : 0}`
          );
        }
        return l2Normalize(values);
      });
    });

    allEmbeddings.push(...batchVectors);
  }

  return allEmbeddings;
};

/**
 * Embed a single search query
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export const embedQuery = async (text) => {
  if (!text || !text.trim()) {
    throw new Error("Cannot embed empty query");
  }

  const model = getGenAI().getGenerativeModel({ model: RAG_CONFIG.EMBEDDING_MODEL });

  return await retryWithBackoff(async () => {
    const response = await model.embedContent({
      content: { parts: [{ text: text.trim() }] },
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: RAG_CONFIG.EMBEDDING_DIMENSIONS,
    });

    if (!response || !response.embedding || !response.embedding.values) {
      throw new Error("Invalid response from Gemini embedContent for query");
    }

    const values = response.embedding.values;
    if (values.length !== RAG_CONFIG.EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Query embedding dimension mismatch: expected ${RAG_CONFIG.EMBEDDING_DIMENSIONS}, received ${values.length}`
      );
    }

    return l2Normalize(values);
  });
};

export default {
  embedDocuments,
  embedQuery,
  l2Normalize,
};
