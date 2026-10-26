import RAG_CONFIG from "./config.js";

export const NO_ANSWER_SENTINEL = RAG_CONFIG.NO_ANSWER_SENTINEL;

/**
 * Format retrieved chunks into a numbered context block for the LLM
 */
export const formatContext = (chunks = []) => {
  if (!chunks || chunks.length === 0) return "";

  return chunks
    .map((chunk, index) => {
      const num = index + 1;
      const title = chunk.sourceTitle || chunk.title || "Document";
      const pageInfo = chunk.page ? `, page ${chunk.page}` : "";
      return `[${num}] (${title}${pageInfo})\n${chunk.text}`;
    })
    .join("\n\n");
};

/**
 * Build grounded system prompt containing context block and strict instructions
 */
export const buildGroundedPrompt = (chunks = []) => {
  const contextBlock = formatContext(chunks);

  return `You are CogniBot, an intelligent and helpful AI assistant in CogniFlow. Answer the user's question, prompt, or request thoroughly and accurately using the CONTEXT block below from their uploaded documents.

Guidelines:
- Reference and explain information from the CONTEXT. You can summarize, answer questions, extract details, or synthesize.
- Cite the sources you used with bracket numbers like [1], [2] matching the numbered context items.
- If the CONTEXT does not contain any relevant information at all to answer the question, only then reply with exactly: ${NO_ANSWER_SENTINEL}
- Format your response with clear, clean Markdown (bullet points, bold text, headings).

CONTEXT:
<<<
${contextBlock}
>>>`;
};

/**
 * Prompt to condense follow-up questions using conversation history
 */
export const CONDENSE_PROMPT = `Given the chat history and a follow-up message, rewrite the follow-up as a single standalone question that can be understood without the history. If it is already standalone, return it unchanged. Return ONLY the rewritten question with no explanations or preamble.`;

/**
 * Prompt for general knowledge fallback answers
 */
export const GENERAL_ANSWER_SYSTEM_PROMPT = `You are CogniBot, a helpful, intelligent AI assistant in CogniFlow. Note: the user's documents did not contain this answer; answer accurately from general knowledge and explicitly note when you are unsure.`;

export default {
  NO_ANSWER_SENTINEL,
  formatContext,
  buildGroundedPrompt,
  CONDENSE_PROMPT,
  GENERAL_ANSWER_SYSTEM_PROMPT,
};
