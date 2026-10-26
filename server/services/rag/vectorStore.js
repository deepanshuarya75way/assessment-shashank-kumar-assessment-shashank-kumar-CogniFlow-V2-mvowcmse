import mongoose from "mongoose";
import KnowledgeChunk from "../../models/KnowledgeChunk.js";
import RAG_CONFIG from "./config.js";

/**
 * Calculates dot product / cosine similarity between two normalized vectors
 */
export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }
  return dot;
};

/**
 * Atlas Vector Search implementation
 */
export const atlasVectorStore = {
  async upsertChunks(chunkDocs) {
    if (!chunkDocs || chunkDocs.length === 0) return [];
    return await KnowledgeChunk.insertMany(chunkDocs);
  },

  async search({ roomId, queryVector, limit = RAG_CONFIG.TOP_K, numCandidates = RAG_CONFIG.NUM_CANDIDATES }) {
    if (!roomId) throw new Error("roomId is required for vector search");

    const roomObjectId =
      typeof roomId === "string" ? new mongoose.Types.ObjectId(roomId) : roomId;

    const pipeline = [
      {
        $vectorSearch: {
          index: RAG_CONFIG.RAG_VECTOR_INDEX,
          path: "embedding",
          queryVector,
          numCandidates: Math.max(numCandidates, limit * 10),
          limit,
          filter: {
            room: { $eq: roomObjectId },
            enabled: { $eq: true },
          },
        },
      },
      {
        $project: {
          text: 1,
          page: 1,
          source: 1,
          origin: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ];

    return await KnowledgeChunk.aggregate(pipeline);
  },

  async deleteBySource(sourceId) {
    return await KnowledgeChunk.deleteMany({ source: sourceId });
  },

  async setEnabledBySource(sourceId, enabled) {
    return await KnowledgeChunk.updateMany({ source: sourceId }, { $set: { enabled } });
  },

  async countByRoom(roomId) {
    return await KnowledgeChunk.countDocuments({ room: roomId });
  },
};

/**
 * In-memory fallback implementation
 */
export const memoryVectorStore = {
  async upsertChunks(chunkDocs) {
    if (!chunkDocs || chunkDocs.length === 0) return [];
    return await KnowledgeChunk.insertMany(chunkDocs);
  },

  async search({ roomId, queryVector, limit = RAG_CONFIG.TOP_K }) {
    if (!roomId) throw new Error("roomId is required for vector search");

    const chunks = await KnowledgeChunk.find({ room: roomId, enabled: true })
      .select("text page source origin embedding")
      .lean();

    if (!chunks || chunks.length === 0) return [];

    const scored = chunks.map((chunk) => {
      const score = cosineSimilarity(queryVector, chunk.embedding);
      return {
        _id: chunk._id,
        text: chunk.text,
        page: chunk.page,
        source: chunk.source,
        origin: chunk.origin,
        score,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  },

  async deleteBySource(sourceId) {
    return await KnowledgeChunk.deleteMany({ source: sourceId });
  },

  async setEnabledBySource(sourceId, enabled) {
    return await KnowledgeChunk.updateMany({ source: sourceId }, { $set: { enabled } });
  },

  async countByRoom(roomId) {
    return await KnowledgeChunk.countDocuments({ room: roomId });
  },
};

/**
 * Hybrid Vector Store with automatic fallback
 */
export const vectorStore = {
  async upsertChunks(chunkDocs) {
    return await atlasVectorStore.upsertChunks(chunkDocs);
  },

  async search(params) {
    if (RAG_CONFIG.RAG_VECTOR_BACKEND === "memory") {
      return await memoryVectorStore.search(params);
    }

    try {
      const results = await atlasVectorStore.search(params);
      if (results && results.length > 0) {
        return results;
      }
      // If Atlas returned 0 results (e.g. Atlas Search vector index not yet configured or syncing in Atlas cluster),
      // fall back to memory cosine search
      return await memoryVectorStore.search(params);
    } catch (err) {
      console.warn(
        `[RAG vectorStore] Atlas Vector Search failed (${err.message}). Falling back to memory cosine search.`
      );
      return await memoryVectorStore.search(params);
    }
  },

  async deleteBySource(sourceId) {
    return await atlasVectorStore.deleteBySource(sourceId);
  },

  async setEnabledBySource(sourceId, enabled) {
    return await atlasVectorStore.setEnabledBySource(sourceId, enabled);
  },

  async countByRoom(roomId) {
    return await atlasVectorStore.countByRoom(roomId);
  },
};

export default vectorStore;
