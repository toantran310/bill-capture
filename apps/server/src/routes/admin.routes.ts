import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { User } from "../models/user.model";
import { Bill } from "../models/bill.model";

const router = Router();
router.use(requireAuth, requireRole("admin"));

// GET /api/admin/users
router.get("/users", async (_req: Request, res: Response) => {
  try {
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/users
router.post("/users", async (req: Request, res: Response) => {
  try {
    const { username, displayName, company, password, role } = req.body as {
      username: string;
      displayName: string;
      company?: string;
      password: string;
      role?: "user" | "admin";
    };
    if (!username || !displayName || !password) {
      res.status(400).json({ error: "username, displayName and password are required" });
      return;
    }
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: "Username already exists" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: username.toLowerCase(),
      displayName,
      company: company ?? "",
      passwordHash,
      role: role ?? "user",
      isActive: true,
    });
    res.status(201).json({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      company: user.company,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/users/:id
router.patch("/users/:id", async (req: Request, res: Response) => {
  try {
    const { displayName, company, isActive, password } = req.body as {
      displayName?: string;
      company?: string;
      isActive?: boolean;
      password?: string;
    };
    const update: Record<string, unknown> = {};
    if (displayName !== undefined) update.displayName = displayName;
    if (company !== undefined) update.company = company;
    if (isActive !== undefined) update.isActive = isActive;
    if (password) update.passwordHash = await bcrypt.hash(password, 12);

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("-passwordHash");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/bills?userId=xxx
router.get("/bills", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query as { userId?: string };
    const query = userId ? { userId } : {};
    const bills = await Bill.find(query).populate("userId", "username displayName").sort({ dayKey: -1, capturedAt: -1 });

    // Group by userId then dayKey
    const grouped: Record<string, { user: unknown; days: Record<string, unknown[]> }> = {};
    for (const bill of bills) {
      const populated = bill.userId as unknown as { _id: { toString(): string }; username: string; displayName: string };
      const uid = populated._id.toString();
      if (!grouped[uid]) {
        grouped[uid] = { user: bill.userId, days: {} };
      }
      if (!grouped[uid].days[bill.dayKey]) grouped[uid].days[bill.dayKey] = [];
      grouped[uid].days[bill.dayKey].push(bill);
    }

    const result = Object.values(grouped).map(({ user, days }) => ({
      user,
      days: Object.entries(days).map(([dayKey, items]) => ({ dayKey, bills: items })),
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/bills/:id
router.delete("/bills/:id", async (_req: Request, res: Response) => {
  try {
    const bill = await Bill.findById(_req.params.id);
    if (!bill) {
      res.status(404).json({ error: "Bill not found" });
      return;
    }

    const apiUrl = process.env.OPENINARY_API_URL ?? "https://openinary.toantran.duckdns.org/api";
    const apiKey = process.env.OPENINARY_API_KEY ?? "";
    const delRes = await fetch(`${apiUrl}/storage/${encodeURIComponent(bill.path)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!delRes.ok && delRes.status !== 404) {
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
