import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "ai"], required: true },
    content: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    noteId: { type: mongoose.Schema.Types.ObjectId, ref: "Note", required: true },
  },
  { timestamps: true },
);

export const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);
