import { Request, Response } from "express";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getWorkspaceActivity,
  dismissAllNotifications
} from "../services/notification.service";

export async function list(req: Request, res: Response) {
  try {
    const notifications = await getUserNotifications(req.user.id);

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function markRead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const notification = await markNotificationRead(id, req.user.id);

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function markAllRead(req: Request, res: Response) {
  try {
    const result = await markAllNotificationsRead(req.user.id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function listWorkspaceActivity(req: Request, res: Response) {
  try {
    const { workspaceId } = req.params;
    const activity = await getWorkspaceActivity(workspaceId, req.user.id);

    return res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function clearAll(req: Request, res: Response) {
  try {
    const result = await dismissAllNotifications(req.user.id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}