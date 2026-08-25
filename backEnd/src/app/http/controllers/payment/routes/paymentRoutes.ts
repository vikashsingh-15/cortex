import { Router } from "express";
import { chargeCustomer } from "../chargeCustomerController";
import { createCheckoutSession, retrieveSession } from "../setPaymentMethod";
import { getUserCreditAndPaymentMethod } from "../getUserCreditAndPaymentType";



export function paymentRoutes(router: Router) {



    // Create a Stripe Checkout session for saving payment methods
    router.post("/create-setup-session", createCheckoutSession);
    router.get("/retrieve-session", retrieveSession);
    router.post("/charge-customer", chargeCustomer);
    router.get("/user-credits", getUserCreditAndPaymentMethod);



    return router
}