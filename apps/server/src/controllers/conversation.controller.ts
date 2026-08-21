import { Request, Response } from "express";
import { createConversationSchema } from "../validators/conversation.validator";
import {
  createConversation,
  getUserConversations,
  getConversationById,
  deleteConversation,
  updateConversation,
} from "../services/conversation.service";


export async function create(req: Request, res: Response) {
  try {
    const data = createConversationSchema.parse(req.body);
    const { workspaceId } = req.body;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: "workspaceId is required",
      });
    }

    const conversation = await createConversation(req.user.id, data, workspaceId);

    return res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: conversation,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Something went wrong",
    });
  }
}



export async function list(req: Request, res: Response) {
  try {
    const { workspaceId } = req.query;

    if (typeof workspaceId !== "string") {
      return res.status(400).json({
        success: false,
        message: "workspaceId is required",
      });
    }

    const conversations = await getUserConversations(req.user.id, workspaceId);

    return res.status(200).json({
      success: true,
      data: conversations,
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



export async function getOne(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const conversation = await getConversationById(
      id,
      req.user.id
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: conversation,
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


export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    await deleteConversation(id, req.user.id);

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    });
  }
}


export async function update(req: Request, res: Response) {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const { id } = req.params as { id: string };

    const conversation = await updateConversation(
      id,
      req.user.id,
      title
    );

    return res.status(200).json({
      success: true,
      message: "Conversation updated successfully",
      data: conversation,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    });
  }
}