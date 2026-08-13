import axios from "axios";

import { env } from "../config/env";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function generateAIResponse(
  messages: ChatMessage[]
): Promise<string> {
  try {
    const response = await axios.post(
      `${env.OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: env.OPENROUTER_MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content:
              "You are Atlas, an intelligent AI assistant and knowledge hub. Be helpful, accurate, and concise.",
          },
          ...messages,
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  }catch (error: any) {
       console.error(
    "OpenRouter Error:",
    error.response?.data || error.message
  );

  return "Sorry, I couldn't generate a response right now.";
}
}