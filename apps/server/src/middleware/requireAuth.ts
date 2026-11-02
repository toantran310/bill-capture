import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

export interface AuthPayload {
  userId: string;
  role: "user" | "admin";
  username: string;
  sessionVersion?: number;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.token as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not set");
    const payload = jwt.verify(token, secret) as AuthPayload;

    // One small read per request: locked users and revoked sessions
    // are rejected immediately instead of when the JWT expires.
    const user = await User.findById(payload.userId).select(
      "isActive role sessionVersion"
    );
    if (
      !user ||
      !user.isActive ||
      (payload.sessionVersion ?? 0) !== (user.sessionVersion ?? 0)
    ) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.auth = { ...payload, role: user.role };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}