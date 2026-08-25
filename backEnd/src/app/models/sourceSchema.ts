import mongoose from "mongoose";

const sourceSchema = new mongoose.Schema({
  title: { type: String },
  total_source: { type: Number },
  content: { type: String },
  audioData: { type: Buffer, select: false },
  audioMimeType: { type: String, select: false },
  source_type:{ type: String },
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: "Note", required: true },

  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export const Source = mongoose.model("Source", sourceSchema)

