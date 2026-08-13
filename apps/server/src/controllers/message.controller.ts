import { Request, Response } from "express";

import { createUserMessage } from "../services/message.service";
import { sendMessageSchema } from "../validators/message.validator";

export async function send(req: Request, res: Response) {
  try {
    const data = sendMessageSchema.parse(req.body);

    const message = await createUserMessage(req.user.id, data);

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    });
  }
}