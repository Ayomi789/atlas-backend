import { Prisma } from "@prisma/client";
import prisma from "../config/db";
import { generateEmbedding } from "./embedding.service";

export async function assertWorkspaceAccess(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!membership) {
    throw new Error("Workspace not found");
  }
}

export async function semanticSearch(workspaceId: string, query: string, limit = 8) {
  const embedding = await generateEmbedding(query);
  const vector = `[${embedding.join(",")}]`;

  return prisma.$queryRaw<
    {
      id: string;
      content: string;
      documentId: string;
      documentName: string;
      chunkIndex: number;
      similarity: number;
    }[]
  >(Prisma.sql`
    SELECT
      dc.id,
      dc.content,
      dc."documentId",
      d.name AS "documentName",
      dc."chunkIndex",
      1 - (dc.embedding <=> ${vector}::vector) AS similarity
    FROM "DocumentChunk" dc
    INNER JOIN "Document" d ON d.id = dc."documentId"
    WHERE d."workspaceId" = ${workspaceId}
      AND dc.embedding IS NOT NULL
    ORDER BY dc.embedding <=> ${vector}::vector
    LIMIT ${limit}
  `);
}

export async function keywordSearch(workspaceId: string, query: string, limit = 8) {
  return prisma.$queryRaw<
    {
      id: string;
      content: string;
      documentId: string;
      documentName: string;
      chunkIndex: number;
      rank: number;
    }[]
  >(Prisma.sql`
    SELECT
      dc.id,
      dc.content,
      dc."documentId",
      d.name AS "documentName",
      dc."chunkIndex",
      ts_rank(to_tsvector('english', dc.content), plainto_tsquery('english', ${query})) AS rank
    FROM "DocumentChunk" dc
    INNER JOIN "Document" d ON d.id = dc."documentId"
    WHERE d."workspaceId" = ${workspaceId}
      AND to_tsvector('english', dc.content) @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT ${limit}
  `);
}