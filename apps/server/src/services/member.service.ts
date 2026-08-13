import prisma from "../config/db";
import { InviteMemberInput, UpdateMemberRoleInput } from "../validators/member.validator";
import { createNotification } from "./notification.service";

async function assertMembership(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!membership) {
    throw new Error("Workspace not found");
  }

  return membership;
}

export async function getWorkspaceMembers(workspaceId: string, requesterId: string) {
  await assertMembership(workspaceId, requesterId);

  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
  });
}

export async function inviteMember(
  workspaceId: string,
  requesterId: string,
  data: InviteMemberInput
) {
  await assertMembership(workspaceId, requesterId);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error("User not found. They must register first.");
  }

  const existing = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId,
      },
    },
  });

  if (existing) {
    throw new Error("User is already a member");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });

  const member = await prisma.workspaceMember.create({
    data: {
      userId: user.id,
      workspaceId,
      role: data.role,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
  });

  await createNotification(
    user.id,
    workspaceId,
    "member_invitation",
    `${user.name} was added to the workspace as ${data.role}`
  );

  return member;
}

export async function updateMemberRole(
  workspaceId: string,
  requesterId: string,
  memberId: string,
  data: UpdateMemberRoleInput
) {
  await assertMembership(workspaceId, requesterId);

  const member = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
  });

  if (!member) {
    throw new Error("Member not found");
  }

  return prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role: data.role },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
  });
}

export async function removeMember(
  workspaceId: string,
  requesterId: string,
  memberId: string
) {
  await assertMembership(workspaceId, requesterId);

  const member = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
  });

  if (!member) {
    throw new Error("Member not found");
  }

  await prisma.workspaceMember.delete({ where: { id: memberId } });

  return { message: "Member removed successfully" };
}