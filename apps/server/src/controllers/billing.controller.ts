import { Request, Response } from "express";

import {
  getCheckoutParams,
  createPortalSession,
  getMonthlyUsage,
  getWorkspacePlan,
  changePlan as changePlanService,
  assertWorkspaceMember,
  PLAN_LIMITS,
} from "../services/billing.service";

export async function getSubscription(req: Request, res: Response) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const role = await assertWorkspaceMember(workspaceId, req.user.id);
    const [plan, usage] = await Promise.all([
      getWorkspacePlan(workspaceId),
      getMonthlyUsage(workspaceId),
    ]);
    return res.status(200).json({
      success: true,
      data: {
        plan,
        limits: PLAN_LIMITS[plan],
        usage,
        canManageBilling: role === "owner" || role === "admin",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function startCheckout(req: Request, res: Response) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const { plan } = req.body as { plan: "team" | "business" };
    if (plan !== "team" && plan !== "business") {
      return res.status(400).json({
        success: false,
        message: "plan must be 'team' or 'business'",
      });
    }

    const checkout = await getCheckoutParams(
      req.user.id,
      workspaceId,
      plan
    );
    return res.status(200).json({ success: true, data: checkout });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function startPortal(req: Request, res: Response) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const session = await createPortalSession(workspaceId, req.user.id);
    return res.status(200).json({ success: true, data: session });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function changePlan(req: Request, res: Response) {
  try {
    const workspaceId = req.params.workspaceId as string;
    const plan = req.body?.plan;

    if (plan !== "team" && plan !== "business") {
      return res.status(400).json({
        success: false,
        message: "plan must be 'team' or 'business'",
      });
    }

    await changePlanService(workspaceId, req.user.id, plan);
    return res.status(200).json({ success: true, message: "Plan updated" });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}