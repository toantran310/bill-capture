import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  displayName: string;
  passwordHash: string;
  company: string;
  role: "user" | "admin";
  isActive: boolean;
  createdAt: Date;
  loginLinkEnabled: boolean;
  sessionVersion: number;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true },
    passwordHash: { type: String, required: true },
    company: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true },
    loginLinkEnabled: { type: Boolean, default: false },
    sessionVersion: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true, // adds `id` (string) next to `_id`
      versionKey: false,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.passwordHash;
        delete ret.sessionVersion;
        return ret;
      },
    },
  }

);

export const User = mongoose.model<IUser>("User", userSchema);
