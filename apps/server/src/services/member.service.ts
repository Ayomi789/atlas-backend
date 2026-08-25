import prisma from "../config/db";
import { InviteMemberInput, UpdateMemberRoleInput } from "../validators/member.validator";
import { createNotification } from "./notification.service";
import { checkSeatLimit, syncSeats } from "./billing.service";

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

async function assertMembershipAdmin(workspaceId: string, userId: string) {
  const membership = await assertMembership(workspaceId, userId);
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new Error("Only workspace owners and admins can do this");
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
  await assertMembershipAdmin(workspaceId, requesterId);
  await checkSeatLimit(workspaceId);

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

  // Bill for the new seat (no-op on the free plan). Membership stays even if
  // the billing sync fails — we just log it rather than block the invite.
  await syncSeats(workspaceId).catch((e) =>
    console.error("Seat sync failed after invite:", e.message)
  );

  return member;
}

export async function updateMemberRole(
  workspaceId: string,
  requesterId: string,
  memberId: string,
  data: UpdateMemberRoleInput
) {
  await assertMembershipAdmin(workspaceId, requesterId);

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
  const requester = await assertMembership(workspaceId, requesterId);

  const member = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
  });

  if (!member) {
    throw new Error("Member not found");
  }

  // Anyone may remove themselves (leave); otherwise owner/admin only.
  const isSelf = member.userId === requesterId;
  if (!isSelf && requester.role !== "owner" && requester.role !== "admin") {
    throw new Error("Only workspace owners and admins can remove members");
  }

  await prisma.workspaceMember.delete({ where: { id: memberId } });

  // Free up the seat on the subscription (no-op on the free plan).
  await syncSeats(workspaceId).catch((e) =>
    console.error("Seat sync failed after removal:", e.message)
  );

  return { message: "Member removed successfully" };
}