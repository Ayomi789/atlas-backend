// import { Router, Request, Response } from "express";

// import { stripe, handleWebhookEvent } from "../services/billing.service";
// import { env } from "../config/env";

// const router = Router();

// router.post(
//   "/stripe",
//   expressRawBody,
//   async (req: Request, res: Response) => {
//     const sig = req.headers["stripe-signature"] as string;
//     try {
//       const event = stripe.webhooks.constructEvent(
//         req.body as Buffer,
//         sig,
//         env.STRIPE_WEBHOOK_SECRET
//       );
//       await handleWebhookEvent(event);
//       res.json({ received: true });
//     } catch (error) {
//       console.error("Stripe webhook error:", error);
//       res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : "unknown"}`);
//     }
//   }
// );

// // Captures the raw body before any JSON parsing.
// import express from "express";
// function expressRawBody(
//   req: Request,
//   _res: Response,
//   next: () => void
// ) {
//   express.raw({ type: "application/json" })(req, _res, next);
// }

// export default router;



// import express, { Router, Request, Response } from "express";

// import { paddle, handlePaddleEvent } from "../services/billing.service";
// import { env } from "../config/env";

// const router = Router();

// router.post(
//   "/paddle",
//   express.raw({ type: "application/json" }),
//   async (req: Request, res: Response) => {
//     const signature = req.headers["paddle-signature"] as string;
//     try {
//       const event = paddle.webhooks.constructEvent(
//         req.body as Buffer,
//         signature,
//         env.PADDLE_WEBHOOK_SECRET
//       );
//       await handlePaddleEvent(event as unknown as { eventType: string; data: any });
//       res.json({ received: true });
//     } catch (error) {
//       console.error("Paddle webhook error:", error);
//       res.status(400).send("Webhook error");
//     }
//   }
// );

// export default router;

import express, { Router, Request, Response } from "express";
import { paddle, handlePaddleEvent } from "../services/billing.service";
import { env } from "../config/env";

const router = Router();

router.post(
  "/paddle",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const signature = req.headers["paddle-signature"] as string;
    try {
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : String(req.body);

      // Verifies signature AND returns the parsed event (throws if invalid)
      const event = await paddle.webhooks.unmarshal(
        rawBody,
        env.PADDLE_WEBHOOK_SECRET,
        signature
      );

      await handlePaddleEvent(event as unknown as {
        eventType: string;
        data: any;
      });

      res.json({ received: true });
    } catch (error) {
      console.error("Paddle webhook error:", error);
      res.status(400).send("Webhook error");
    }
  }
);

export default router;