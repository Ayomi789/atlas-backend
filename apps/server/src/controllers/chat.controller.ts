import { Request, Response } from "express";
import { chatWithWorkspace } from "../services/chat.service";
import { checkQuestionLimit } from "../services/billing.service";

export async function chat(req: Request, res: Response) {
  try {
    const { workspaceId, question, conversationId } = req.body;

    if (!workspaceId || !question) {
      return res.status(400).json({
        success: false,
        message: "workspaceId and question are required",
      });
    }

    // Throws with an upgrade message when the workspace is over its
    // monthly question quota — surfaced to the user below.
    await checkQuestionLimit(workspaceId);

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
    const message =
      error instanceof Error ? error.message : "Failed to generate answer";

    // Plan-limit errors come from checkQuestionLimit and should be
    // shown to the user verbatim (402 = Payment Required).
    const isLimitError = message.includes("limit");
    if (isLimitError) {
      return res.status(402).json({
        success: false,
        message,
      });
    }

    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate answer",
    });
  }
}