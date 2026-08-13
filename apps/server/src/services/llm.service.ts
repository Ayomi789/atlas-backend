import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

export async function generateAnswer(prompt: string) {
  const response = await ai.models.generateContent({
   model: env.GEMINI_CHAT_MODEL,
    contents: prompt,
  });

  return response.text ?? "";
}