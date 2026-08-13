import prisma from "../config/db";

export async function searchSimilarChunks(
  embedding: number[],
  limit = 5
) {
  const vector = `[${embedding.join(",")}]`;

  const results = await prisma.$queryRawUnsafe<
    {
      id: string;
      content: string;
      similarity: number;
      documentId: string;
    }[]
  >(
    `
    SELECT
      id,
      content,
      "documentId",
      1 - (embedding <=> $1::vector) AS similarity
    FROM "DocumentChunk"
    ORDER BY embedding <=> $1::vector
    LIMIT $2
    `,
    vector,
    limit
  );

  return results;
}