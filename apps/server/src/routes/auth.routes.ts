import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/user.model";
import { requireAuth } from "../middleware/requireAuth";
import mongoose from "mongoose";

const router = Router();

const PASSWORD_SESSION_DAYS = 7;
const LINK_SESSION_DAYS = 30; // one-tap users shouldn't need the link daily

function toPublicUser(user: IUser) {
  return {
    id: user._id,
    username: user.username,
    displayName: user.displayName,
    company: user.company,
    role: user.role,
  };
}

function issueSession(req: Request, res: Response, user: IUser, days: number) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  const token = jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      username: user.username,
      sessionVersion: user.sessionVersion ?? 0,
    },
    secret,
    { expiresIn: days * 24 * 60 * 60 }
  );
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: req.secure, // true only when the browser really used https
    maxAge: days * 24 * 60 * 60 * 1000,
  });
}

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
    issueSession(req, res, user, PASSWORD_SESSION_DAYS);
    res.json(toPublicUser(user));
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
    res.json(toPublicUser(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---- Login by link: /l/:userId, role "user" only, enabled per user ----

async function findLinkUser(userId: unknown): Promise<IUser | null> {
  if (typeof userId !== "string" || !mongoose.isValidObjectId(userId)) return null;
  const user = await User.findById(userId);
  if (!user || !user.isActive || user.role !== "user" || !user.loginLinkEnabled) {
    return null;
  }
  return user;
}

// Shows the welcome page data only; does NOT log in.
router.post("/link-preview", async (req: Request, res: Response) => {
  try {
    const user = await findLinkUser(req.body?.userId);
    if (!user) {
      res.status(404).json({ error: "Link không hợp lệ hoặc đã bị tắt" });
      return;
    }
    res.json({ displayName: user.displayName, company: user.company });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/link-login", async (req: Request, res: Response) => {
  try {
    const user = await findLinkUser(req.body?.userId);
    if (!user) {
      res.status(401).json({ error: "Link không hợp lệ hoặc đã bị tắt" });
      return;
    }
    issueSession(req, res, user, LINK_SESSION_DAYS);
    res.json(toPublicUser(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;