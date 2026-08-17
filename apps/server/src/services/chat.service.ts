import prisma from "../config/db";
import { askQuestion } from "./rag.service";
import { assertWorkspaceAccess } from "./search.service";
import { createNotification } from "./notification.service";

export async function chatWithWorkspace(
  userId: string,
  workspaceId: string,
  question: string,
  conversationId?: string
) {
  await assertWorkspaceAccess(workspaceId, userId);

  // 1. Find or create conversation
  let conversation;

  if (conversationId) {
    conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }
  } else {
    conversation = await prisma.conversation.create({
      data: {
        userId,
        workspaceId,
        title: question.slice(0, 50),
      },
    });
  }

  // 2. Save user message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: question,
    },
  });

  // 3. Run RAG
  const result = await askQuestion(workspaceId,
     question,
     conversation.id);

  // 4. Save assistant message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "assistant",
      content: result.answer,
    },
  });

  // 5. Log activity
  await createNotification(
    userId,
    workspaceId,
    "chat_question",
    `Asked: "${question.slice(0, 60)}${question.length > 60 ? "…" : ""}"`,
    true
  );

  // 6. Return everything the frontend needs
  return {
    conversationId: conversation.id,
    answer: result.answer,
    sources: result.sources,
  };
}