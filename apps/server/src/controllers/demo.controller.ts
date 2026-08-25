import { Request, Response } from "express";

import prisma from "../config/db";
import { env } from "../config/env";
import { askQuestion } from "../services/rag.service";

export async function demoAsk(req: Request, res: Response) {
  try {
    const { question } = req.body as { question?: string };

    if (!env.DEMO_WORKSPACE_ID) {
      return res.status(503).json({
        success: false,
        message: "Demo is not configured yet",
      });
    }

    const trimmed = (question ?? "").trim();
    if (trimmed.length < 8 || trimmed.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Question must be between 8 and 200 characters",
      });
    }

    const result = await askQuestion(env.DEMO_WORKSPACE_ID, trimmed);

    const docIds = [...new Set(result.sources.map((s) => s.documentId))];
    const docs = await prisma.document.findMany({
      where: { id: { in: docIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(docs.map((d) => [d.id, d.name]));

    return res.status(200).json({
      success: true,
      data: {
        answer: result.answer,
        sources: result.sources.slice(0, 3).map((s) => ({
          documentName: nameById.get(s.documentId) || "Document",
          excerpt: s.content.slice(0, 220),
          similarity: s.similarity,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Demo question failed",
    });
  }
}