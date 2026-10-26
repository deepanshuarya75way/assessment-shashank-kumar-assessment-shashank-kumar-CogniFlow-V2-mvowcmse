import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
];

export const callGeminiWithFallback = async ({ systemInstruction, contents, generationConfig }) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const modelOptions = { model: modelName };
      if (systemInstruction) {
        modelOptions.systemInstruction = systemInstruction;
      }
      if (generationConfig) {
        modelOptions.generationConfig = generationConfig;
      }

      const model = genAI.getGenerativeModel(modelOptions);
      const result = await model.generateContent(contents);
      return result;
    } catch (err) {
      lastError = err;
      console.warn(`[callGeminiWithFallback] Model ${modelName} failed (${err.status || err.message}). Trying fallback...`);
      if (err.status === 429 || err.status === 404 || err.status === 503) {
        continue;
      }
      continue;
    }
  }

  throw lastError || new Error("All Gemini model candidates failed");
};

export const generateAIResponse = async (prompt, history = [], fileUrl = null) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return "AI is not configured. Please add GEMINI_API_KEY to your .env file.";
    }

    let fullContext = "System: You are CogniBot, a helpful, intelligent AI assistant in the CogniFlow chat app. CRITICAL INSTRUCTION: You MUST wrap your final user-facing response inside <response> tags. Example: <response>Hello there!</response>. You can write whatever thoughts or reasoning you want before the tags, but ONLY the content inside <response> will be shown to the user.\n\nHere is the recent conversation history for context:\n\n";
    
    history.forEach(msg => {
      fullContext += `${msg.content}\n`;
    });

    fullContext += `\nNow, respond to the latest prompt: ${prompt}`;
    
    const parts = [fullContext];

    if (fileUrl) {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        const buf = Buffer.from(arrayBuffer);
        const headerMime = response.headers.get('content-type') || '';
        
        let mimeType = headerMime;
        // Accurate detection for PDFs and images (Cloudinary raw files often return application/octet-stream)
        if (buf.length >= 4 && buf.slice(0, 4).toString() === '%PDF') {
          mimeType = 'application/pdf';
        } else if (fileUrl.toLowerCase().includes('.pdf') || (headerMime && headerMime.includes('pdf'))) {
          mimeType = 'application/pdf';
        } else if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
          mimeType = 'image/jpeg';
        } else if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
          mimeType = 'image/png';
        } else if (buf.length >= 4 && buf.slice(0, 4).toString() === 'RIFF') {
          mimeType = 'image/webp';
        } else if (!mimeType || mimeType.includes('octet-stream')) {
          mimeType = fileUrl.toLowerCase().includes('.pdf') ? 'application/pdf' : 'image/jpeg';
        }
        
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      } catch (e) {
        console.error("Error fetching file for AI:", e);
        parts.push("\n[System Note: The user attached a file, but it could not be downloaded for analysis.]");
      }
    }

    const result = await callGeminiWithFallback({
      systemInstruction: "You are CogniBot, a helpful, intelligent AI assistant in the CogniFlow chat app. NEVER output your internal thoughts, reasoning, or scratchpad notes. ONLY output the final conversational reply directly to the user.",
      contents: parts,
    });
    const text = result.response.text();

    let match = text.match(/<response>([\s\S]*?)(?:<\/response>|$)/i);
    if (match && match[1]) {
      let responseText = match[1].trim();
      responseText = responseText.replace(/^`+|`+$/g, '').trim();
      return responseText;
    }

    return text.replace(/<\/?response>/gi, '').trim();
  } catch (error) {
    console.error("AI Error:", error);
    return "I'm sorry, I encountered an error while trying to process your request.";
  }
};
