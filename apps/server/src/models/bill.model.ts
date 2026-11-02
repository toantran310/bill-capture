import mongoose, { Schema, Document } from "mongoose";

export interface IBill extends Document {
  userId: mongoose.Types.ObjectId;
  path: string;
  originalName: string;
  mimeType: string;
  size: number;
  capturedAt: Date;
  dayKey: string;
}

const billSchema = new Schema<IBill>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  path: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  capturedAt: { type: Date, required: true },
  dayKey: { type: String, required: true },
});

billSchema.index({ userId: 1, dayKey: -1, capturedAt: -1 });

export const Bill = mongoose.model<IBill>("Bill", billSchema);
