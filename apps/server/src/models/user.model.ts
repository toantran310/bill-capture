import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  displayName: string;
  passwordHash: string;
  company: string;
  role: "user" | "admin";
  isActive: boolean;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true },
    passwordHash: { type: String, required: true },
    company: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const User = mongoose.model<IUser>("User", userSchema);
