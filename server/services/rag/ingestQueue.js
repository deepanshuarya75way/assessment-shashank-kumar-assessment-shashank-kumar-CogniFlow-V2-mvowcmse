import PQueue from "p-queue";
import KnowledgeSource from "../../models/KnowledgeSource.js";
import RAG_CONFIG from "./config.js";
import { extractPages } from "./extract.js";
import { chunkPages } from "./chunker.js";
import { embedDocuments } from "./embeddings.js";
import vectorStore from "./vectorStore.js";

const queue = new PQueue({ concurrency: RAG_CONFIG.INGEST_CONCURRENCY });

/**
 * Emit socket event to room members about knowledge status
 */
export const emitKnowledgeStatus = (roomId, payload) => {
  if (global.io && roomId) {
    global.io.to(String(roomId)).emit("knowledge:status", payload);
  }
};

/**
 * Clean up stalled ingestion jobs on server startup
 */
export const resetStalledIngestions = async () => {
  try {
    const stalled = await KnowledgeSource.updateMany(
      { status: "processing" },
      { $set: { status: "failed", error: "Interrupted by server restart" } }
    );
    if (stalled.modifiedCount > 0) {
      console.log(`[RAG Ingestion] Reset ${stalled.modifiedCount} stalled sources to failed status.`);
    }
  } catch (err) {
    console.warn("[RAG Ingestion] Could not reset stalled ingestions:", err.message);
  }
};

/**
 * Process a single KnowledgeSource ingestion
 */
const processSource = async (sourceId, bufferOverride = null) => {
  const source = await KnowledgeSource.findById(sourceId);
  if (!source) {
    console.warn(`[RAG Ingestion] Source ${sourceId} not found`);
    return;
  }

  try {
    source.status = "processing";
    source.error = null;
    await source.save();

    emitKnowledgeStatus(source.room, {
      sourceId: source._id,
      roomId: source.room,
      status: "processing",
      chunkCount: 0,
      error: null,
    });

    let buffer = bufferOverride;

    if (!buffer) {
      if (source.fileUrl) {
        const response = await fetch(source.fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to download file from storage (${response.statusText})`);
        }
        const arrayBuf = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
      } else {
        throw new Error("No file or content available to process");
      }
    }

    // Step 1: Extract text
    const pages = await extractPages({
      buffer,
      mimeType: source.mimeType,
    });

    // Step 2: Chunk text
    const chunks = chunkPages(pages);

    if (chunks.length === 0) {
      throw new Error("Document generated 0 readable chunks");
    }

    // Step 3: Check room chunk cap
    const currentRoomChunks = await vectorStore.countByRoom(source.room);
    if (currentRoomChunks + chunks.length > RAG_CONFIG.MAX_CHUNKS_PER_ROOM) {
      throw new Error(
        `Room limit exceeded: Cannot add ${chunks.length} chunks. Maximum allowed per room is ${RAG_CONFIG.MAX_CHUNKS_PER_ROOM} (currently ${currentRoomChunks}).`
      );
    }

    // Step 4: Embed chunks
    const chunkTexts = chunks.map((c) => c.text);
    const embeddings = await embedDocuments(chunkTexts);

    // Step 5: Construct chunk documents
    const chunkDocs = chunks.map((c, i) => ({
      source: source._id,
      room: source.room,
      owner: source.owner,
      text: c.text,
      page: c.page,
      chunkIndex: c.chunkIndex,
      origin: source.type === "ai_answer" ? "learned" : "upload",
      enabled: source.enabled !== false,
      embedding: embeddings[i],
      embeddingModel: RAG_CONFIG.EMBEDDING_MODEL,
    }));

    // Step 6: Insert into vector store
    await vectorStore.upsertChunks(chunkDocs);

    // Step 7: Update source status
    source.status = "ready";
    source.pageCount = pages.length;
    source.chunkCount = chunkDocs.length;
    source.error = null;
    await source.save();

    emitKnowledgeStatus(source.room, {
      sourceId: source._id,
      roomId: source.room,
      status: "ready",
      chunkCount: source.chunkCount,
      pageCount: source.pageCount,
      error: null,
    });

    console.log(`[RAG Ingestion] Successfully ingested source "${source.title}" (${chunkDocs.length} chunks)`);
  } catch (err) {
    console.error(`[RAG Ingestion Error] Source ${sourceId}:`, err);

    try {
      source.status = "failed";
      source.error = err.message || "Failed to process document";
      await source.save();

      // Clean up partial chunks if any were inserted
      await vectorStore.deleteBySource(source._id);

      emitKnowledgeStatus(source.room, {
        sourceId: source._id,
        roomId: source.room,
        status: "failed",
        chunkCount: 0,
        error: source.error,
      });
    } catch (saveErr) {
      console.error("[RAG Ingestion] Failed to record error state:", saveErr);
    }
  }
};

/**
 * Enqueue a KnowledgeSource for background ingestion
 */
export const enqueueIngestion = (sourceId, bufferOverride = null) => {
  return queue.add(() => processSource(sourceId, bufferOverride));
};

export default {
  enqueueIngestion,
  resetStalledIngestions,
  emitKnowledgeStatus,
};
