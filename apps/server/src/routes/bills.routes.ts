import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { Bill } from "../models/bill.model";

const router = Router();

// POST /api/bills — save a bill record after successful Openinary upload
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth!.userId;
    const { path, originalName, mimeType, size } = req.body as {
      path: string;
      originalName: string;
      mimeType: string;
      size: number;
    };

    if (!path || !originalName || !mimeType || size == null) {
      res.status(400).json({ error: "path, originalName, mimeType and size are required" });
      return;
    }

    // Security: path must start with bills/<username>-<userId>/
    if (!path.startsWith(`bills/${req.auth?.username}-${userId}/`)) {
      res.status(403).json({ error: "Forbidden: path does not belong to you" });
      return;
    }

    const now = new Date();
    const vnDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const dayKey = vnDate.toISOString().slice(0, 10);

    const bill = await Bill.create({
      userId,
      path,
      originalName,
      mimeType,
      size,
      capturedAt: now,
      dayKey,
    });
    res.status(201).json(bill);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/bills/mine — list user's bills grouped by dayKey
router.get("/mine", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth!.userId;
    const bills = await Bill.find({ userId }).sort({ dayKey: -1, capturedAt: -1 });

    // Group by dayKey
    const grouped: Record<string, typeof bills> = {};
    for (const bill of bills) {
      if (!grouped[bill.dayKey]) grouped[bill.dayKey] = [];
      grouped[bill.dayKey].push(bill);
    }

    const result = Object.entries(grouped).map(([dayKey, items]) => ({
      dayKey,
      bills: items,
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/bills/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth!.userId;
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      res.status(404).json({ error: "Bill not found" });
      return;
    }
    if (bill.userId.toString() !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Delete from Openinary first
    const apiUrl = process.env.OPENINARY_API_URL ?? "https://openinary.toantran.duckdns.org/api";
    const apiKey = process.env.OPENINARY_API_KEY ?? "";
    const delRes = await fetch(`${apiUrl}/storage/${encodeURIComponent(bill.path)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!delRes.ok && delRes.status !== 404) {
      const body = await delRes.text();
      console.error("Openinary delete failed:", delRes.status, body);
      res.status(502).json({ error: "Failed to delete file from storage" });
      return;
    }

    await bill.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
