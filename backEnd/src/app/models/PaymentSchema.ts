import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        email: {
            type: String,
            required: true,
        },

        stripePaymentIntentId: {
            type: String,
            required: true,
            unique: true,
        },

        stripeCustomerId: {
            type: String,
            required: true,
        },

        stripePaymentMethodId: {
            type: String,
            required: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        currency: {
            type: String,
            default: "usd",
        },

        status: {
            type: String,
            enum: [
                "succeeded",
                "processing",
                "requires_action",
                "requires_payment_method",
                "canceled",
                "failed",
            ],
            default: "processing",
        },

        paymentType: {
            type: String, // 'card', 'link', 'us_bank_account'
            required: false,
        },

        cardBrand: { type: String, default: null },
        cardLast4: { type: String, default: null },

        billingName: { type: String, default: null },
        billingEmail: { type: String, default: null },
        billingCountry: { type: String, default: null },
    },
    { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
