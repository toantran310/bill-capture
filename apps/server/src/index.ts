import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes";
import openinaryRoutes from "./routes/openinary.routes";
import billsRoutes from "./routes/bills.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();
const PORT = process.env.PORT ?? 9100;
const MONGODB_URI = process.env.MONGODB_URI ?? "";
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));
}

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Rate limit for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts, please try again later." },
});
// ... bên cạnh loginLimiter
const linkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: "Too many attempts, please try again later." },
});

app.use("/api/auth/login", loginLimiter);
app.use(["/api/auth/link-login", "/api/auth/link-preview"], linkLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/openinary", openinaryRoutes);
app.use("/api/bills", billsRoutes);
app.use("/api/admin", adminRoutes);


mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
