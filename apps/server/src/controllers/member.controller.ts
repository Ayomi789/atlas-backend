import { Request, Response } from "express";

import {
  inviteMemberSchema,
  updateMemberRoleSchema,
} from "../validators/member.validator";
import {
  getWorkspaceMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
} from "../services/member.service";

export async function list(req: Request, res: Response) {
  try {
    const { workspaceId } = req.params;
    const members = await getWorkspaceMembers(workspaceId, req.user.id);

    return res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function invite(req: Request, res: Response) {
  try {
    const { workspaceId } = req.params;
    const data = inviteMemberSchema.parse(req.body);

    const member = await inviteMember(workspaceId, req.user.id, data);

    return res.status(201).json({
      success: true,
      message: "Member invited successfully",
      data: member,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function updateRole(req: Request, res: Response) {
  try {
    const { workspaceId, memberId } = req.params;
    const data = updateMemberRoleSchema.parse(req.body);

    const member = await updateMemberRole(workspaceId, req.user.id, memberId, data);

    return res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      data: member,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { workspaceId, memberId } = req.params;

    const result = await removeMember(workspaceId, req.user.id, memberId);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}
