import { Request, Response } from "express";

// import { createWorkspace } from "../services/workspace.service";
import { createWorkspaceSchema, updateWorkspaceSchema } from "../validators/workspace.validator";
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
} from "../services/workspace.service";




export async function create(req: Request, res: Response) {
  try {
    const data = createWorkspaceSchema.parse(req.body);

    const workspace = await createWorkspace(
      req.user.id,
      data
    );

    return res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      data: workspace,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    });
  }
}



export async function getAll(req: Request, res: Response) {
  try {
    const workspaces = await getUserWorkspaces(req.user.id);

    return res.status(200).json({
      success: true,
      data: workspaces,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    });
  }
}



export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const workspace = await getWorkspaceById(
      id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Workspace not found",
    });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const data = updateWorkspaceSchema.parse(req.body);
    const { id } = req.params as { id: string };
    const workspace = await updateWorkspace(id, req.user.id, data);

    return res.status(200).json({
      success: true,
      message: "Workspace updated successfully",
      data: workspace,
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
    const { id } = req.params as { id: string };
    await deleteWorkspace(id, req.user.id);

    return res.status(200).json({
      success: true,
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    const status = error instanceof Error && error.message.includes("owner")
      ? 403
      : 404;
    return res.status(status).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    });
  }
}