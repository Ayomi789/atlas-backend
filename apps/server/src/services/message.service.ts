import prisma from "../config/db";
import { SendMessageInput } from "../validators/message.validator";
import { generateAIResponse } from "./ai.service";

export async function createUserMessage(
  userId: string,
  data: SendMessageInput
) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: data.conversationId,
      userId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Save user's message
  const userMessage = await prisma.message.create({
    data: {
      conversationId: data.conversationId,
      role: "user",
      content: data.content,
    },
  });

  // Generate AI response

    const history = await prisma.message.findMany({
      where: {
        conversationId: data.conversationId,
      },
      orderBy: {
        createdAt: "asc",
      },
  });

  const aiResponse = await generateAIResponse(
    history.map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    }))
  );

  // Save AI message
  const assistantMessage = await prisma.message.create({
    data: {
      conversationId: data.conversationId,
      role: "assistant",
      content: aiResponse,
    },
  });

  return {
    userMessage,
    assistantMessage,
  };
}