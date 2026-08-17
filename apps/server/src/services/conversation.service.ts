import prisma from "../config/db";
import { CreateConversationInput } from "../validators/conversation.validator";

export async function createConversation(
  userId: string,
  data: CreateConversationInput,
  workspaceId: string
) {
  return prisma.conversation.create({
    data: {
      title: data.title ?? "New Chat",
      userId,
      workspaceId,
    },
  });
}




export async function getUserConversations(userId: string, workspaceId: string) {
  return prisma.conversation.findMany({
    where: {
      userId,
      workspaceId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}


export async function getConversationById(
  conversationId: string,
  userId: string
) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}



export async function deleteConversation(
  conversationId: string,
  userId: string
) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  await prisma.conversation.delete({
    where: {
      id: conversationId,
    },
  });

  return conversation;
}


export async function updateConversation(
  conversationId: string,
  userId: string,
  title: string
) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      title,
    },
  });
}