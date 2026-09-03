
import { Payment } from "@/app/models/PaymentSchema";
import { User } from "@/app/models/userSchema";
import { Request, Response, NextFunction } from "express";
import { UserRepository } from "../auth/repository/userRepository";


export async function getUserCreditAndPaymentMethod(req: Request, res: Response,next:NextFunction) {

  try {
    const { userId } = req.query;
    const userRepo = UserRepository.getInstance();

    const result = await userRepo.getUserCreditAndPaymentType({ _id: userId as string })
    return res.status(200).send({ result })

  } catch (error: any) {
  
   next(error)
  }
}
