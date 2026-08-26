import { Request, Response } from "express";

import {
  createInvite,
  listInvites,
  acceptInvite,
  cancelInvite,
  resendInvite,
} from "../services/invite.service";

export async function invite(req: Request, res: Response) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const { email, role } = req.body as { email: string; role: string };
    const invite = await createInvite(workspaceId, req.user.id, email, role ?? "member");
    return res.status(201).json({ success: true, data: invite });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create invite",
    });
  }
}

export async function list(req: Request, res: Response) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const invites = await listInvites(workspaceId, req.user.id);
    return res.status(200).json({ success: true, data: invites });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to list invites",
    });
  }
}

export async function accept(req: Request, res: Response) {
  try {
    const token = req.params.token as string;
    const member = await acceptInvite(token, req.user.id);
    return res.status(200).json({ success: true, data: member });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to accept invite",
    });
  }
}

export async function cancel(req: Request, res: Response) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const inviteId = req.params.inviteId as string;
    const result = await cancelInvite(workspaceId, req.user.id, inviteId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to cancel invite",
    });
  }
}

export async function resend(req: Request, res: Response) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const inviteId = req.params.inviteId as string;
    const result = await resendInvite(workspaceId, req.user.id, inviteId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to resend invite",
    });
  }
}
