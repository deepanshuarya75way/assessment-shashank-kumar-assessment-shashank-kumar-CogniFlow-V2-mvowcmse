import RAG_CONFIG from "./config.js";

/**
 * Splits text recursively using delimiter priority: \n\n -> \n -> . -> " " -> hard split
 */
export const splitTextRecursively = (
  text,
  maxSize = RAG_CONFIG.CHUNK_SIZE,
  overlap = RAG_CONFIG.CHUNK_OVERLAP
) => {
  if (!text || text.length <= maxSize) {
    return text ? [text.trim()] : [];
  }

  const delimiters = ["\n\n", "\n", ". ", "! ", "? ", "; ", " ", ""];

  const splitWithDelimiters = (str, delimIndex) => {
    if (str.length <= maxSize || delimIndex >= delimiters.length) {
      if (str.length <= maxSize) return [str];
      // Hard chunk fallback
      const hardChunks = [];
      let i = 0;
      while (i < str.length) {
        hardChunks.push(str.slice(i, i + maxSize));
        i += maxSize - overlap;
      }
      return hardChunks;
    }

    const delim = delimiters[delimIndex];
    const parts = delim === "" ? str.split("") : str.split(delim);
    const result = [];
    let currentChunk = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const separator = currentChunk.length > 0 ? delim : "";
      const potential = currentChunk + separator + part;

      if (potential.length <= maxSize) {
        currentChunk = potential;
      } else {
        if (currentChunk) {
          result.push(currentChunk.trim());
        }
        // If a single part is larger than maxSize, break it down with next delimiter
        if (part.length > maxSize) {
          const subChunks = splitWithDelimiters(part, delimIndex + 1);
          result.push(...subChunks);
          currentChunk = "";
        } else {
          // Add overlap from previous chunk if possible
          if (overlap > 0 && currentChunk.length > 0) {
            const overlapText = currentChunk.slice(-overlap);
            currentChunk = (overlapText + " " + part).trim();
          } else {
            currentChunk = part;
          }
        }
      }
    }

    if (currentChunk.trim()) {
      result.push(currentChunk.trim());
    }

    return result;
  };

  return splitWithDelimiters(text, 0).filter((c) => c && c.length > 0);
};

/**
 * Takes array of [{ page: number, text: string }] and produces [{ text, page, chunkIndex }]
 */
export const chunkPages = (pages = []) => {
  const chunks = [];
  let globalChunkIndex = 0;

  for (const pageObj of pages) {
    const pageNum = pageObj.page || 1;
    const cleanText = (pageObj.text || "")
      .replace(/\r\n/g, "\n")
      .replace(/\t/g, " ")
      .trim();

    if (!cleanText) continue;

    const rawSplits = splitTextRecursively(
      cleanText,
      RAG_CONFIG.CHUNK_SIZE,
      RAG_CONFIG.CHUNK_OVERLAP
    );

    const pageChunks = [];

    for (const split of rawSplits) {
      const trimmed = split.trim();
      if (!trimmed) continue;

      // If this trailing chunk is very small and we already have chunks for this page, merge it
      if (
        trimmed.length < RAG_CONFIG.MIN_CHUNK_CHARS &&
        pageChunks.length > 0
      ) {
        const lastIdx = pageChunks.length - 1;
        pageChunks[lastIdx].text = `${pageChunks[lastIdx].text}\n${trimmed}`.trim();
      } else {
        pageChunks.push({
          text: trimmed,
          page: pageNum,
        });
      }
    }

    for (const item of pageChunks) {
      chunks.push({
        text: item.text,
        page: item.page,
        chunkIndex: globalChunkIndex++,
      });
    }
  }

  return chunks;
};

export default chunkPages;
