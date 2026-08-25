import { ChatHistory } from "@/app/models/chatHistorySchema";

type ConversationMessage = {
  role: "user" | "ai";
  userId: string;
  noteId: string;
  content: string;
};

export async function storeConversation(messages: ConversationMessage[]) {
  try {
    await ChatHistory.insertMany(messages);
    return { success: true, message: "Conversation stored successfully" };
  } catch (error) {
    console.error("Error storing conversation:", error);
    return { success: false, message: "Failed to store conversation" };
  }
}

export async function getConversationHistory(props: { userId: string; noteId: string }) {
  try {
    return await ChatHistory.find(props).sort({ createdAt: 1 }).lean();
  } catch (error) {
    console.error("Error reading conversation history:", error);
    return [];
  }
}
