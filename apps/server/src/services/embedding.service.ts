import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

export async function generateEmbedding(text: string) {
  const response = await ai.models.embedContent({
    model: env.GEMINI_EMBEDDING_MODEL,
    contents: text,
  });

  return response.embeddings?.[0]?.values ?? [];
}