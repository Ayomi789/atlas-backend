import crypto from "crypto";
import prisma from "../config/db";
import { env } from "../config/env";
import { checkSeatLimit } from "./billing.service";
import { createNotification } from "./notification.service";
import { sendWorkspaceInviteEmail } from "./email.service";

async function assertMembershipAdmin(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) throw new Error("Workspace not found");
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new Error("Only workspace owners and admins can manage invites");
  }
  return membership;
}

export async function createInvite(
  workspaceId: string,
  requesterId: string,
  email: string,
  role: string
) {
  await assertMembershipAdmin(workspaceId, requesterId);

  const normalized = email.toLowerCase().trim();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Invalid email address");
  }

  // Already a member?
  const existingUser = await prisma.user.findUnique({
    where: { email: normalized },
  });
  if (existingUser) {
    const alreadyMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId: existingUser.id, workspaceId },
      },
    });
    if (alreadyMember) throw new Error("User is already a member");
  }

  // Existing pending invite for this workspace+email?
  const existingInvite = await prisma.workspaceInvite.findUnique({
    where: { workspaceId_email: { workspaceId, email: normalized } },
  });
  if (existingInvite && existingInvite.status === "pending" && existingInvite.expiresAt > new Date()) {
    throw new Error("An invite for this email is already pending");
  }
  // Clean up stale invite so the unique constraint doesn't block a new one.
  if (existingInvite) {
    await prisma.workspaceInvite.delete({ where: { id: existingInvite.id } });
  }

  // Seat cap: members + pending invites must be under the plan limit.
  await checkSeatLimit(workspaceId);

  // Token + 7-day expiry.
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const requester = await prisma.user.findUnique({ where: { id: requesterId } });
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });

  const invite = await prisma.workspaceInvite.create({
    data: {
      workspaceId,
      email: normalized,
      role,
      token,
      invitedById: requesterId,
      status: "pending",
      expiresAt,
    },
  });

  // Fire-and-forget email — invite persists even if email fails.
  sendWorkspaceInviteEmail({
    to: normalized,
    workspaceName: workspace?.name ?? "a workspace",
    invitedByName: requester?.name ?? "Someone",
    role,
    token,
  }).catch((e) => console.error("Failed to send invite email:", e.message));

  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expiresAt,
  };
}

export async function listInvites(workspaceId: string, requesterId: string) {
  await assertMembershipAdmin(workspaceId, requesterId);

  // Mark expired invites on read.
  await prisma.workspaceInvite.updateMany({
    where: {
      workspaceId,
      status: "pending",
      expiresAt: { lt: new Date() },
    },
    data: { status: "expired" },
  });

  return prisma.workspaceInvite.findMany({
    where: { workspaceId, status: "pending" },
    include: {
      invitedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function acceptInvite(token: string, userId: string) {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
  });
  if (!invite) throw new Error("Invalid or expired invite");

  if (invite.status !== "pending") {
    const msg =
      invite.status === "accepted"
        ? "Invite already accepted"
        : invite.status === "canceled"
          ? "Invite was canceled"
          : "Invite has expired";
    throw new Error(msg);
  }
  if (invite.expiresAt < new Date()) {
    await prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: "expired" },
    });
    throw new Error("Invite has expired");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new Error("This invite is for a different email address");
  }

  // Seat still available at accept time?
  await checkSeatLimit(invite.workspaceId);

  const existing = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId: invite.workspaceId },
    },
  });
  if (existing) {
    // Already a member — mark invite accepted and return.
    await prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    });
    throw new Error("You are already a member of this workspace");
  }

  const member = await prisma.workspaceMember.create({
    data: {
      userId,
      workspaceId: invite.workspaceId,
      role: invite.role,
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });

  await prisma.workspaceInvite.update({
    where: { id: invite.id },
    data: { status: "accepted" },
  });

  return member;
}

export async function cancelInvite(
  workspaceId: string,
  requesterId: string,
  inviteId: string
) {
  await assertMembershipAdmin(workspaceId, requesterId);

  const invite = await prisma.workspaceInvite.findFirst({
    where: { id: inviteId, workspaceId, status: "pending" },
  });
  if (!invite) throw new Error("Invite not found or already resolved");

  await prisma.workspaceInvite.update({
    where: { id: inviteId },
    data: { status: "canceled" },
  });

  return { message: "Invite canceled" };
}

export async function resendInvite(
  workspaceId: string,
  requesterId: string,
  inviteId: string
) {
  await assertMembershipAdmin(workspaceId, requesterId);

  const invite = await prisma.workspaceInvite.findFirst({
    where: { id: inviteId, workspaceId, status: "pending" },
  });
  if (!invite) throw new Error("Invite not found or already resolved");
  if (invite.expiresAt < new Date()) throw new Error("Invite has expired — create a new one");

  const requester = await prisma.user.findUnique({ where: { id: requesterId } });
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });

  await sendWorkspaceInviteEmail({
    to: invite.email,
    workspaceName: workspace?.name ?? "a workspace",
    invitedByName: requester?.name ?? "Someone",
    role: invite.role,
    token: invite.token,
  });

  return { message: "Invite resent" };
}
