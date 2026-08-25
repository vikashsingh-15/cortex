
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  image: { type: String, required: false },
  googleAccessToken: { type: String, required: false },
  googleRefreshToken: { type: String, required: false },
  googleId: { type: String, required: true },

  // payments
  stripeCustomerId: {
    type: String,
    unique: true,
    sparse: true,
  },
  stripePaymentMethodId: String,
  cardBrand: String,
  cardLast4: String,
  cardExpMonth: Number,
  cardExpYear: Number,
  paymentType: String,
  billingEmail: String,
  billingName: String,
  billingCountry: String,
  credits: { type: Number, default: 0 },


}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
