import prisma from "../config/db";
import { CreateWorkspaceInput, UpdateWorkspaceInput } from "../validators/workspace.validator";
import { createNotification } from "./notification.service";


export async function createWorkspace(
  userId: string,
  data: CreateWorkspaceInput
) {
  const workspace = await prisma.workspace.create({
    data: {
      name: data.name,
      description: data.description,

      members: {
        create: {
          userId,
          role: "owner",
        },
      },
    },
    include: {
      members: true,
    },
  });

  return workspace;
}


export async function getUserWorkspaces(userId: string) {
  return prisma.workspace.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}


export async function getWorkspaceById(
  workspaceId: string,
  userId: string
) {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return workspace;
}

export async function updateWorkspace(
  workspaceId: string,
  userId: string,
  data: UpdateWorkspaceInput
) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    throw new Error("You don't have permission to update this workspace");
  }

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    },
  });

  await createNotification(
    userId,
    workspaceId,
    "workspace_updated",
    "Workspace settings were updated",
    true
  );

  return updated;
}