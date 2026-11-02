import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();
const isProduction = process.env.NODE_ENV === "production";

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user || !user.isActive) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const secret = process.env.JWT_SECRET ?? "dev-secret";
    const token = jwt.sign({ userId: user._id.toString(), role: user.role, username: user.username }, secret, { expiresIn: "7d" });
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      company: user.company,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (_req, res: Response) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.auth!.userId).select("-passwordHash");
    if (!user || !user.isActive) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.json({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      company: user.company,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
