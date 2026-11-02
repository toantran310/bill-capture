import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "../models/user.model";

async function seedAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  const username = (process.env.ADMIN_USERNAME ?? "admin").toLowerCase();
  const displayName = process.env.ADMIN_DISPLAY_NAME ?? "Administrator";
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD env is not set");

  await mongoose.connect(uri);

  const existing = await User.findOne({ username });
  if (existing) {
    console.log(`Admin user "${username}" already exists.`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ username, displayName, passwordHash, role: "admin", isActive: true });
  console.log(`Admin user "${username}" created successfully.`);
  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
