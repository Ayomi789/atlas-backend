import prisma from "../config/db";

const RETENTION_DAYS = 90;
const PRUNE_PROBABILITY = 0.05;

async function pruneOldNotifications() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.notification.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
}

export async function createNotification(
  userId: string,
  workspaceId: string,
  type: string,
  message: string,
  read = false
) {
  const notification = await prisma.notification.create({
    data: { userId, workspaceId, type, message, read },
  });

  if (Math.random() < PRUNE_PROBABILITY) {
    void pruneOldNotifications();
  }

  return notification;
}

export async function getUserNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId, dismissed: false },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function dismissAllNotifications(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, dismissed: false },
    data: { dismissed: true },
  });

  return { message: "All notifications cleared" };
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return { message: "All notifications marked as read" };
}


export async function getWorkspaceActivity(workspaceId: string, requesterId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: requesterId,
        workspaceId,
      },
    },
  });

  if (!membership) {
    throw new Error("Workspace not found");
  }

  return prisma.notification.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}