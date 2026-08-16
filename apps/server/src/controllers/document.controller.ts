import { Request, Response } from "express";
import { createDocumentSchema } from "../validators/document.validator";
import {
  createDocument,
  getWorkspaceDocuments,
  deleteDocument,
} from "../services/document.service";

import { uploadDocumentFile } from "../services/document.service";


export async function createDocumentController(req: Request, res: Response) {
  try {
    const data = createDocumentSchema.parse(req.body);

    const document = await createDocument(data, req.user.id);

    return res.status(201).json({
      success: true,
      message: "Document created successfully",
      data: document,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getWorkspaceDocumentsController(
  req: Request,
  res: Response
) {
  try {
    const { workspaceId } = req.params;

    const documents = await getWorkspaceDocuments(workspaceId, req.user.id);

    return res.json({
      success: true,
      data: documents,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}


export async function deleteDocumentController(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    const result = await deleteDocument(id, req.user.id);

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
}


export async function uploadDocumentController(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const document = await uploadDocumentFile(id, req.file, req.user.id);

    return res.json({
      success: true,
      message: "File uploaded successfully",
      data: document,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}