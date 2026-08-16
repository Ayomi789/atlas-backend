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
  const allChunks = await searchSimilarChunks(
    embedding,
    workspaceId
  );

  // Only treat chunks as real matches if they clear a minimum similarity bar —
  // otherwise a plain greeting or off-topic message ends up "grounded" in
  // whatever happened to be nearest, even if nothing is actually relevant.
  const SIMILARITY_THRESHOLD = 0.6;
  const chunks = allChunks.filter((c) => c.similarity >= SIMILARITY_THRESHOLD);

  const context = chunks
    .map((chunk) => chunk.content)
    .join("\n\n");

  const prompt = `
  You are Atlas, an AI Knowledge Hub.

  You are having an ongoing conversation with the user.

  Use the conversation history to understand follow-up questions.

  If the user's message is a greeting, thanks, or casual small talk rather than
  a question about their documents, respond briefly and naturally — do not
  mention documents, context, or citations at all.

  Otherwise, answer ONLY using the provided context.

  If the context is empty or the answer cannot be found in it, reply exactly:

  "I couldn't find that information in the uploaded documents."

  Conversation History:
  ${history}

  Relevant Context:
  ${context || "(no relevant context was found for this message)"}

  Current Question:
  ${question}
  `;

  const answer = await generateAnswer(prompt);

  return {
    answer,
    sources: chunks,
  };
}