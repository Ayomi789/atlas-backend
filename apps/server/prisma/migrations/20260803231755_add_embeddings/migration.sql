-- Enable pgvector (no-op on databases where it already exists)
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "DocumentChunk"
ADD COLUMN "embedding" vector(3072);