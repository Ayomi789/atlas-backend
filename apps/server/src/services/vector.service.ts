import { Prisma } from "@prisma/client";
import prisma from "../config/db";

export async function saveEmbedding(
  tx: Prisma.TransactionClient,
  documentChunkId: string,
  embedding: number[]
) {
  const vector = `[${embedding.join(",")}]`;

  await tx.$executeRaw`
    UPDATE "DocumentChunk"
    SET embedding = ${vector}::vector
    WHERE id = ${documentChunkId}
  `;
}

export async function searchSimilarChunks(
  embedding: number[],
  workspaceId: string,
  limit = 5
) {
  const vector = `[${embedding.join(",")}]`;

  const chunks = await prisma.$queryRaw<
    {
      id: string;
      content: string;
      documentId: string;
      similarity: number;
    }[]
  >(Prisma.sql`
    SELECT
      dc.id,
      dc.content,
      dc."documentId",
      1 - (dc.embedding <=> ${vector}::vector) AS similarity
    FROM "DocumentChunk" dc
    INNER JOIN "Document" d
      ON d.id = dc."documentId"
    WHERE
      d."workspaceId" = ${workspaceId}
      AND dc.embedding IS NOT NULL
    ORDER BY dc.embedding <=> ${vector}::vector
    LIMIT ${limit}
  `);

  return chunks;
}