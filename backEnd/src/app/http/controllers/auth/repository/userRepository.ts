import { InsufficientCreditsError } from "@/app/bootstrap/exceptions/creditError";
import { generateTokens, signAccessToken, signRefreshToken } from "@/app/helpers/jwt";
import { User } from "@/app/models/userSchema";

import { GoogleUserType } from "@/types/user-types";
import mongoose from "mongoose";




export class UserRepository {
  private static instance: UserRepository;


  // singleton design pattern
  public static getInstance(): UserRepository {
    if (!UserRepository.instance) {
      UserRepository.instance = new UserRepository();
    }
    return UserRepository.instance;
  }

async getUserCreditAndPaymentType(props:{_id:string}){
    const {_id}=props
    const user = await User.findOne({ _id }).select("credits paymentType");
    return user

}
  async createUser(userProps: GoogleUserType, token: { accessToken: string, refreshToken: string, }) {

    const { sub: id, name, picture, email } = userProps?._json

    const existingUser = await User.findOne({ email: email })


    if (!existingUser) {

      const user = new User({
        name: name,
        email: email,
        image: picture,
        googleAccessToken: token?.accessToken,
        googleRefreshToken: token?.refreshToken,
        googleId: id
      })

      const newUser = await user.save()

      const { accessToken, refreshToken } = await generateTokens(newUser?._id)

      return {
        authData: {
          ...newUser.toObject(), token: { accessToken, refreshToken }
        }
      }

    } else {
      const user = await User.findByIdAndUpdate(existingUser?._id,
        {
          googleAccessToken: token?.accessToken,
          googleRefreshToken: token?.refreshToken,
        }, { new: true, runValidators: true });
      const updateUser = user?.toObject()


      const { accessToken, refreshToken } = await generateTokens(existingUser?._id)

      return {
        authData: {
          ...updateUser, token: { accessToken, refreshToken }
        }
      }
    }








  }









  async addCredits(userId: string, credits: number) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }
    if (credits <= 0) {
      throw new Error("Credit amount must be positive");
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { credits: credits } },

      { new: true }
    );

    if (!user) throw new Error("User not found");
    return user;
  }


  async reduceCredits( userId: string, credits: number,
  ) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    if (credits <= 0) {
      throw new Error("Credit amount must be positive");
    }

    const user = await User.findById(userId)
    if (!user) throw new Error("User not found");

    if (user.credits < credits) {
      throw new InsufficientCreditsError()
    }
    // 💳 Deduct credits
    user.credits -= credits;

    await user.save();

    return user;
  }

}