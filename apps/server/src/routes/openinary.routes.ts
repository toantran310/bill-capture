import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { signUpload } from "../lib/upload-token";

const router = Router();

router.post("/sign", requireAuth, requireRole("user"), async (req: Request, res: Response) => {
  const apiKey = process.env.OPENINARY_API_KEY;
  const baseUrl = process.env.OPENINARY_API_URL;
  if (!apiKey || !baseUrl) {
    res.status(500).json({ error: "Openinary is not configured" });
    return;
  }

  const userId = req.auth!.userId;
  const vnDate = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const dayKey = vnDate.toISOString().slice(0, 10);
  const folder = `bills/${req.auth?.username}-${userId}/${dayKey}`;

  try {
    const signed = await signUpload(baseUrl, apiKey, { expiresIn: 300, folder });
    res.json(signed);
  } catch (err) {
    console.error("Openinary sign failed:", (err as Error).message);
    res.status(502).json({ error: "Could not sign upload" });
  }
});

export default router;
