
import { Payment } from "@/app/models/PaymentSchema";
import { User } from "@/app/models/userSchema";
import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { UserRepository } from "../auth/repository/userRepository";
import mongoose from "mongoose";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const userRepo = UserRepository.getInstance();

export async function chargeCustomer(req: Request, res: Response) {

  try {
    const { email, amount } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ error: "Email and amount are required." });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res
        .status(400)
        .json({ error: "Amount must be a number greater than 0." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!user.stripeCustomerId || !user.stripePaymentMethodId) {
      return res
        .status(400)
        .json({ error: "User does not have a saved payment method." });
    }

    const amountInCents = Math.round(parsedAmount * 100);

    // ✅ Process payment via Stripe first (external)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      customer: user.stripeCustomerId,
      payment_method: user.stripePaymentMethodId,
      confirm: true,
      off_session: true,
    });

    // 💰 Compute credits
    const baseCredits = parsedAmount * 10; // 1$ = 10 credits
    const bonusCredits = parsedAmount >= 20 ? 50 : 0;
    const totalCredits = baseCredits + bonusCredits;

    // ✅ Run both DB operations atomically
    const [paymentRecord, updatedUser] = await Promise.all([
      Payment.create(
        [
          {
            userId: user._id,
            email: user.email,
            stripePaymentIntentId: paymentIntent.id,
            stripeCustomerId: user.stripeCustomerId,
            stripePaymentMethodId: user.stripePaymentMethodId,
            amount: parsedAmount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            paymentType: user.paymentType,
            cardBrand: user.cardBrand,
            cardLast4: user.cardLast4,
            billingName: user.billingName,
            billingEmail: user.billingEmail,
            billingCountry: user.billingCountry,
          },
        ],
      ),
      userRepo.addCredits(user._id.toString(), totalCredits),
    ]);

 
    return res.status(200).json({
      message: "Payment successful and credits added.",
      paymentIntent,
      paymentRecord: paymentRecord[0],
      addedCredits: totalCredits,
      newBalance: updatedUser.credits,
    });
  } catch (error: any) {
    console.error("❌ Charge error:", error);
    

    return res.status(500).json({
      error: "Payment succeeded, but credit update failed. Transaction rolled back.",
      details: error.message,
    });
  }
}