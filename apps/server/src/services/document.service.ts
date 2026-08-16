import prisma from "../config/db";
import { CreateDocumentInput } from "../validators/document.validator";
import { supabase } from "../config/storage";
import { extractPdfText } from "./document-processing.service";
import { createNotification } from "./notification.service";
import { assertWorkspaceAccess } from "./search.service";

async function extractText(file: Express.Multer.File): Promise<string> {
  if (file.mimetype === "application/pdf") {
    return extractPdfText(file.buffer);
  }

  if (file.mimetype === "text/plain" || file.mimetype === "text/markdown") {
    return file.buffer.toString("utf-8");
  }

  // No extractor wired up yet for this type (e.g. .docx) — skip extraction
  // rather than incorrectly running it through the PDF parser.
  return "";
}
import { chunkText } from "../utils/chunk-text";
import { generateEmbedding } from "./embedding.service";
import { saveEmbedding } from "./vector.service";

export async function createDocument(data: CreateDocumentInput, uploadedById: string) {
  await assertWorkspaceAccess(data.workspaceId, uploadedById);

  const document = await prisma.document.create({
    data: {
      name: data.name,
      storageKey: data.storageKey,
      mimeType: data.mimeType,
      size: data.size,
      workspaceId: data.workspaceId,
      uploadedById,
    },
  });

  return document;
}

export async function getWorkspaceDocuments(workspaceId: string, userId: string) {
  await assertWorkspaceAccess(workspaceId, userId);
  return prisma.document.findMany({
    where: {
      workspaceId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      uploadedBy: {
        select: { id: true, name: true },
      },
      _count: {
        select: { chunks: true },
      },
    },
  });
}


export async function deleteDocument(documentId: string, requesterId: string) {
  const document = await prisma.document.findUnique({
    where: {
      id: documentId,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  await assertWorkspaceAccess(document.workspaceId, requesterId);

  await prisma.document.delete({
    where: {
      id: documentId,
    },
  });

  await createNotification(
    requesterId,
    document.workspaceId,
    "document_deleted",
    `"${document.name}" was deleted`,
    true
  );

  return {
    message: "Document deleted successfully",
  };
}

export async function uploadDocumentFile(
  documentId: string,
  file: Express.Multer.File,
  requesterId: string
) {
  // 1. Find the document
  const document = await prisma.document.findUnique({
    where: {
      id: documentId,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  await assertWorkspaceAccess(document.workspaceId, requesterId);

  try {
    // 2. Extract text
    const extractedText = await extractText(file);

    // 3. Split into chunks
    const chunks = chunkText(extractedText);

    // 4. Generate embeddings
    const chunkEmbeddings = await Promise.all(
      chunks.map(async (chunk) => ({
        content: chunk,
        embedding: await generateEmbedding(chunk),
      }))
    );

    console.log("Generated embeddings:", chunkEmbeddings.length);

    // 5. Upload PDF to Supabase Storage
    const { error } = await supabase.storage
      .from("documents")
      .upload(document.storageKey, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    // 6. Save everything in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Remove old chunks (for re-upload)
      await tx.documentChunk.deleteMany({
        where: {
          documentId: document.id,
        },
      });

      // Create new chunks
      const createdChunks = await Promise.all(
        chunkEmbeddings.map((chunk, index) =>
          tx.documentChunk.create({
            data: {
              content: chunk.content,
              chunkIndex: index,
              documentId: document.id,
            },
          })
        )
      );

      // Save vector embeddings
      await Promise.all(
        createdChunks.map((chunk, index) =>
          saveEmbedding(tx,chunk.id, chunkEmbeddings[index].embedding)
        )
      );
      console.log("Created chunks:", createdChunks.length);

      // Update document
      return tx.document.update({
        where: {
          id: document.id,
        },
        data: {
          status: "READY",
          size: file.size,
          extractedText,
        },
      });
    });

    if (document.uploadedById) {
      await createNotification(
        document.uploadedById,
        document.workspaceId,
        "document_ready",
        `"${document.name}" finished processing and is ready to search`
      );
    }

    return updated;
  } catch (err) {
    console.error(`Document processing failed for "${document.name}" (${document.id}):`, err);
    await prisma.document.update({
      where: { id: document.id },
      data: { status: "FAILED" },
    });

    if (document.uploadedById) {
      await createNotification(
        document.uploadedById,
        document.workspaceId,
        "document_failed",
        `"${document.name}" failed to process`
      );
    }

    throw err;
  }
}