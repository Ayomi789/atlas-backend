
import { Request, Response } from "express";
import { chatWithWorkspace } from "../services/chat.service";

export async function chat(req: Request, res: Response) {
  try {
    const {
      workspaceId,
      question,
      conversationId,
    } = req.body;

    const result = await chatWithWorkspace(
      req.user.id,
      workspaceId,
      question,
      conversationId
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate answer",
    });
  }
}