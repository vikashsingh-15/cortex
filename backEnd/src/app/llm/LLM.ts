import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
export class LLM {
  private static instance: ChatFireworks;

  // Private constructor to prevent direct instantiation
  private constructor() {}

  public static getInstance(): ChatFireworks {
    if (!LLM.instance) {
      if (!process.env.FIRE_WORKS_API_KEY) {
        throw new Error(
          "❌ FIRE_WORKS_API_KEY is not set in environment variables",
        );
      }

      LLM.instance = new ChatFireworks({
        // model: "accounts/fireworks/models/deepseek-v3p1",
        model: "accounts/fireworks/models/kimi-k2p6",
        temperature: 0.7,
        apiKey: process.env.FIRE_WORKS_API_KEY,
      });
    }
    return LLM.instance;
  }
}
