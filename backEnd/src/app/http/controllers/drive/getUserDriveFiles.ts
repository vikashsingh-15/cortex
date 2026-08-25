
import express from 'express'

import { Express, NextFunction, Response, Request } from "express";

import { google } from "googleapis";

export async function getUserDriveFiles(req: Request, res: Response, next: NextFunction){


    
try {
    // get user + google token from your session/db
    const user = req.user as any;
   
    if (!user?.authData?.googleAccessToken) {
      return res.status(401).json({ message: "No Google access token found" });
    }

    const oauth2Client = new google.auth.OAuth2({
        client_secret:process.env.GOOGLE_CLIENT_SECRET as string,
        client_id:process.env.GOOGLE_CLIENT_ID as string
    
    });
    oauth2Client.setCredentials({
    
         access_token: user?.authData?.googleAccessToken,
      refresh_token: user?.authData?.googleRefreshToken,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const response = await drive.files.list({
      pageSize: 10,
      fields: "files(id, name, mimeType, webViewLink)",
    });

    res.json(response.data.files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch Drive files" });
  }
}