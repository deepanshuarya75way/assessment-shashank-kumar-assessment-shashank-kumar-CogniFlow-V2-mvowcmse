import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import RAG_CONFIG from "./config.js";

export const ocrWithGemini = async (buffer, mimeType = "image/jpeg") => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured for OCR/Vision extraction");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const base64Data = buffer.toString("base64");

  const prompt = `Transcribe all text in this file exactly as written, preserving headings, lists, and tables (as Markdown tables). Then add a section 'Visual description:' describing any charts, diagrams, or key imagery. For multi-page documents prefix each page with '--- Page N ---'.`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    },
  ]);

  const text = result.response.text().trim();
  if (!text) {
    throw new Error("Gemini OCR returned empty text");
  }

  // Parse multi-page markers if present
  const pageRegex = /---\s*Page\s*(\d+)\s*---/gi;
  const matches = [...text.matchAll(pageRegex)];

  if (matches.length > 0) {
    const pages = [];
    for (let i = 0; i < matches.length; i++) {
      const pageNum = parseInt(matches[i][1], 10);
      const startIndex = matches[i].index + matches[i][0].length;
      const endIndex = i + 1 < matches.length ? matches[i + 1].index : text.length;
      const pageContent = text.substring(startIndex, endIndex).trim();
      if (pageContent) {
        pages.push({ page: pageNum, text: pageContent });
      }
    }
    return pages.length > 0 ? pages : [{ page: 1, text }];
  }

  return [{ page: 1, text }];
};

/**
 * Extract text from PDF buffer page by page
 */
export const extractPagesFromPdf = async (buffer) => {
  const uint8 = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data: uint8,
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  if (numPages > RAG_CONFIG.MAX_PAGES) {
    throw new Error(`Document exceeds maximum limit of ${RAG_CONFIG.MAX_PAGES} pages (has ${numPages} pages)`);
  }

  const pages = [];
  let totalChars = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageStrings = textContent.items.map((item) => item.str || "").filter(Boolean);
    const pageText = pageStrings.join(" ").replace(/\s+/g, " ").trim();

    pages.push({
      page: pageNum,
      text: pageText,
    });
    totalChars += pageText.length;
  }

  const avgCharsPerPage = numPages > 0 ? totalChars / numPages : 0;

  // If average text extracted is less than 50 chars per page, it's likely a scanned PDF
  if (avgCharsPerPage < 50) {
    try {
      console.log(`[RAG extract] PDF average chars/page (${avgCharsPerPage.toFixed(1)}) < 50; falling back to Gemini OCR.`);
      return await ocrWithGemini(buffer, "application/pdf");
    } catch (ocrErr) {
      console.warn("[RAG extract] Gemini OCR fallback failed, using raw pdf text:", ocrErr.message);
    }
  }

  return pages;
};

/**
 * Main extractor: converts buffer + mimeType into [{ page, text }]
 */
export const extractPages = async ({ buffer, mimeType }) => {
  if (!buffer || buffer.length === 0) {
    throw new Error("Cannot extract text from empty buffer");
  }

  let pages = [];

  if (mimeType === "application/pdf") {
    pages = await extractPagesFromPdf(buffer);
  } else if (mimeType && mimeType.startsWith("image/")) {
    pages = await ocrWithGemini(buffer, mimeType);
  } else if (mimeType && (mimeType.includes("text") || mimeType.includes("json"))) {
    const text = buffer.toString("utf-8").trim();
    pages = [{ page: 1, text }];
  } else {
    // Default try PDF or text
    try {
      pages = await extractPagesFromPdf(buffer);
    } catch {
      const text = buffer.toString("utf-8").trim();
      pages = [{ page: 1, text }];
    }
  }

  // Filter out completely empty pages
  const validPages = pages.filter((p) => p.text && p.text.trim().length > 0);
  const totalChars = validPages.reduce((acc, p) => acc + p.text.length, 0);

  if (totalChars < 20) {
    throw new Error("No readable text found in document (less than 20 characters)");
  }

  return validPages;
};

export default extractPages;
