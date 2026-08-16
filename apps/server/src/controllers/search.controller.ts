import { Request, Response } from "express";
import {
  assertWorkspaceAccess,
  semanticSearch,
  keywordSearch,
} from "../services/search.service";
import { createNotification } from "../services/notification.service";

export async function search(req: Request, res: Response) {
  try {
    const { workspaceId, query } = req.query;

    if (typeof workspaceId !== "string" || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "workspaceId and query are required",
      });
    }

    await assertWorkspaceAccess(workspaceId, req.user.id);

    const [semantic, keyword] = await Promise.all([
      semanticSearch(workspaceId, query),
      keywordSearch(workspaceId, query),
    ]);

    await createNotification(
      req.user.id,
      workspaceId,
      "search_query",
      `Searched: "${query.slice(0, 60)}${query.length > 60 ? "…" : ""}"`,
      true
    );

    return res.status(200).json({
      success: true,
      data: { semantic, keyword },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}