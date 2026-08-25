import mongoose from "mongoose";

const docSchema = new mongoose.Schema({
  title: { type: String },
  // description: { type: String },
  fileName: { type: String },
  fileData: { type: Buffer, select: false },
  summary: { type: String },
  studyGuide: { type: String },
  briefingDoc: { type: String },
  faq: { type: String },
  mindMap: { type: String }, 
  source_type: { type: String }, 
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: "Note", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export const Doc = mongoose.model("Doc", docSchema)
