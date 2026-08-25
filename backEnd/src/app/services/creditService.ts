import { UserRepository } from "@/app/http/controllers/auth/repository/userRepository";

export const CREDIT_COST = {
  source: 1,
  chatQuestion: 0.1,
  generatedOutput: 1,
} as const;

export async function chargeCredits(userId: string, credits: number) {
  if (!userId) throw new Error("A user ID is required to charge credits.");
  await UserRepository.getInstance().reduceCredits(userId, credits);
}
