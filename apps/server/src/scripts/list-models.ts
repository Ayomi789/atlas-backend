import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

async function main() {
  const models = await ai.models.list();

  for await (const model of models) {
    console.log(model.name);
  }
}

main();