import { GoogleGenerativeAI } from "@google/generative-ai";

const getGenAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not found in environment");
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

// Utility function to strip markdown code blocks from JSON responses
export const cleanJsonResponse = (text) => {
  if (!text) return text;
  
  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  let cleaned = text.replace(/^```json\n?/gi, '').replace(/^```\n?/gi, '').replace(/\n?```$/gi, '');
  
  // Also handle cases where the response might have other markdown
  cleaned = cleaned.trim();
  
  return cleaned;
};

export const generateText = async (prompt) => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    return text;
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    throw error;
  }
};

export const generateTextWithFiles = async (prompt, files = []) => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const contents = [];
    contents.push({ text: prompt });

    for (const file of files) {
      if (file.mimetype.startsWith("image/")) {
        contents.push({
          inlineData: {
            mimeType: file.mimetype,
            data: file.buffer.toString("base64")
          }
        });
      } else if (file.mimetype === "application/pdf") {
        contents.push({
          inlineData: {
            mimeType: file.mimetype,
            data: file.buffer.toString("base64")
          }
        });
      }
    }

    const result = await model.generateContent(contents);
    const text = await result.response.text();
    return text;
  } catch (error) {
    console.error("Gemini API Error with files:", error.message);
    throw error;
  }
};
