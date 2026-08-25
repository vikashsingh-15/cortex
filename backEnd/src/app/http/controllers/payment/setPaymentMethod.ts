
import { User } from "@/app/models/userSchema";
import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";


 const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);


export async function createCheckoutSession (req:Request, res:Response) {
  try {
   
    const {email,userId}=req.body
    const customer = await stripe.customers.create({
      email: email, 
    });

    const session = await stripe.checkout.sessions.create({
      mode: "setup", // <— this is the key
      customer: customer.id,
      payment_method_types: ["card", "link", "us_bank_account"],
      success_url: `${process.env.APP_URL}/api/v1/retrieve-session?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_ORIGIN}/failed_redirect`,
    });

    res.json({ url: session.url });
  } catch (err:any) {
    console.error("Error creating setup session:", err);
    res.status(500).json({ error: err.message });
  }
}




export async function retrieveSession(req: Request, res: Response) {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: "Missing session_id in query." });
    }

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id as string);

    // Support both Checkout (payment_intent) and SetupIntent flows
    const setupIntentId = session.setup_intent as string | null;
    const paymentIntentId = session.payment_intent as string | null;
    const customerId = session.customer as string | null;

    let paymentMethodId: string | null = null;

    if (setupIntentId) {
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      paymentMethodId = setupIntent.payment_method as string | null;
    } else if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      paymentMethodId = paymentIntent.payment_method as string | null;
    } else {
      return res.status(400).json({ error: "No payment or setup intent found in session." });
    }

    if (!paymentMethodId) {
      return res.status(400).json({ error: "No payment method found." });
    }

    // Retrieve the payment method
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Extract billing email (support all payment types)
    const billingDetails = paymentMethod.billing_details || {};
    const userEmail = billingDetails.email;

    if (!userEmail) {
      return res.status(400).json({ error: "No billing email found for payment method." });
    }

    // Update user document
    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail },
      {
        stripeCustomerId: customerId,
        stripePaymentMethodId: paymentMethod.id,
        paymentType: paymentMethod.type,
        cardBrand: paymentMethod.card?.brand || null,
        cardLast4: paymentMethod.card?.last4 || null,
        cardExpMonth: paymentMethod.card?.exp_month || null,
        cardExpYear: paymentMethod.card?.exp_year || null,
        billingEmail: billingDetails.email || null,
        billingName: billingDetails.name || null,
        billingCountry: billingDetails.address?.country || null,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found for this billing email." });
    }

    return res.status(200).json({
      message: "Payment method retrieved and user updated successfully.",
      user: updatedUser,
      paymentMethod,
    });
  } catch (error: any) {
    console.error("❌ Stripe session retrieval error:", error);
    return res.status(500).json({
      error: "An error occurred while retrieving the session.",
      details: error.message,
    });
  }
}
