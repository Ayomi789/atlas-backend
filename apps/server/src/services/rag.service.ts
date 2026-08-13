import { generateEmbedding } from "./embedding.service";
import { searchSimilarChunks } from "./vector.service";
import { generateAnswer } from "./llm.service";
import prisma from "../config/db";




async function getConversationHistory(
  conversationId: string
) {
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return messages
    .map(
      (message) =>
        `${message.role === "user" ? "User" : "Assistant"}:\n${message.content}`
    )
    .join("\n\n");
}

export async function askQuestion(
  workspaceId: string,
  question: string,
  conversationId?: string
) {

  const history = await getConversationHistory(conversationId);
  // Generate embedding for the user's question
  const embedding = await generateEmbedding(question);

  // Retrieve the most relevant chunks
  const chunks = await searchSimilarChunks(
    embedding,
    workspaceId
  );

  

  if (chunks.length === 0) {
    return {
      answer:
        "I couldn't find any relevant information in the uploaded documents.",
      sources: [],
    };
  }

  const context = chunks
    .map((chunk) => chunk.content)
    .join("\n\n");

  const prompt = `
  You are Atlas, an AI Knowledge Hub.

  You are having an ongoing conversation with the user.

  Use the conversation history to understand follow-up questions.

  Answer ONLY using the provided context.

  If the answer cannot be found in the context, reply exactly:

  "I couldn't find that information in the uploaded documents."

  Conversation History:
  ${history}

  Relevant Context:
  ${context}

  Current Question:
  ${question}
  `;

  const answer = await generateAnswer(prompt);

  return {
    answer,
    sources: chunks,
  };
}