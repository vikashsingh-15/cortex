import { NextFunction, Request, Response } from "express";
import { google } from "googleapis";
import { User } from "@/app/models/userSchema";

export async function getDriveAccessToken(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as any)?.authData?._id;
    if (!userId) {
      return res.status(401).json({ message: "Sign in again to use Google Drive." });
    }

    const user = await User.findById(userId).select("googleAccessToken googleRefreshToken");
    if (!user?.googleRefreshToken) {
      return res.status(401).json({ message: "Reconnect Google Drive to continue." });
    }

    const oauth2Client = new google.auth.OAuth2({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    });
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    const { token: accessToken } = await oauth2Client.getAccessToken();
    if (!accessToken) return res.status(401).json({ message: "Reconnect Google Drive to continue." });

    return res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
}
