import { google } from "googleapis";
import { NextFunction, Request, Response } from "express";
import { DocRepository } from "../notes/repository/DocRepository";
import { loadDocumentFromBuffer } from "../notes/loaders/loaders";
import { generateTitle } from "../notes/helpers/TitleGeneration";
import { LLM } from "@/app/llm/LLM";
import { generateFileName } from "@/util/generateFileName";
import { getDocChunk } from "@/util/getDocChunk";
import agenda from "@/app/bootstrap/agenda/agenda";
import { getFileExtension } from "@/util/getFileExtension";
import { chargeCredits, CREDIT_COST } from "@/app/services/creditService";
import { User } from "@/app/models/userSchema";

type WorkspaceExport = { mimeType: string; extension: string };

const supportedFileExtensions = new Set([".pdf", ".txt", ".csv", ".md", ".markdown"]);

function getWorkspaceExport(mimeType: string): WorkspaceExport | undefined {
  if (mimeType === "application/vnd.google-apps.document") return { mimeType: "text/plain", extension: ".txt" };
  if (mimeType === "application/vnd.google-apps.spreadsheet") return { mimeType: "text/csv", extension: ".csv" };
  if (mimeType === "application/vnd.google-apps.presentation") return { mimeType: "text/plain", extension: ".txt" };
  return undefined;
}

export async function storeDriveFiles(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, noteId, fileId } = req.body as { userId: string; noteId: string; fileId: string };
    if (!userId || !noteId || !fileId) {
      return res.status(400).json({ message: "userId, noteId, and fileId are required." });
    }

    const sessionUserId = (req.user as any)?.authData?._id?.toString();
    if (!sessionUserId) {
      return res.status(401).json({ message: "Sign in again to use Google Drive." });
    }
    if (sessionUserId !== userId) {
      return res.status(403).json({ message: "You can only add Google Drive files to your own notebook." });
    }

    // The Passport session may contain an old token after Google reconnects.
    // Always retrieve the current credential pair from MongoDB before downloading.
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

    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const metadata = await drive.files.get({ fileId, fields: "id,name,mimeType" });
    const originalName = metadata.data.name || `${fileId}.txt`;
    const sourceMimeType = metadata.data.mimeType || "";
    const workspaceExport = sourceMimeType.startsWith("application/vnd.google-apps.")
      ? getWorkspaceExport(sourceMimeType)
      : undefined;

    if (sourceMimeType.startsWith("application/vnd.google-apps.") && !workspaceExport) {
      return res.status(422).json({ message: "This Google Drive file type is not supported yet." });
    }

    const originalExtension = originalName.includes(".")
      ? `.${originalName.split(".").pop()?.toLowerCase()}`
      : "";
    if (!workspaceExport && !supportedFileExtensions.has(originalExtension)) {
      return res.status(422).json({
        message: "Choose a Google Doc, Sheet, Slide, PDF, TXT, Markdown, or CSV file.",
      });
    }

    const downloadedFileName = workspaceExport
      ? `${originalName.replace(/\.[^.]+$/, "")}${workspaceExport.extension}`
      : originalName;
    const response = workspaceExport
      ? await drive.files.export({ fileId, mimeType: workspaceExport.mimeType }, { responseType: "stream" })
      : await drive.files.get({ fileId, alt: "media" }, { responseType: "stream" });

    const chunks: Buffer[] = [];
    for await (const chunk of response.data as any) {
      chunks.push(Buffer.from(chunk));
    }
    const fileData = Buffer.concat(chunks);
    if (!fileData.length) return res.status(422).json({ message: "Google Drive returned an empty file." });

    const fileName = generateFileName(downloadedFileName);
    const docSplit = await loadDocumentFromBuffer(fileData, fileName);
    const title = await generateTitle(LLM.getInstance(), getDocChunk(docSplit));

    await chargeCredits(userId, CREDIT_COST.source);
    const newDoc = await DocRepository.getInstance().createDoc({
      fileName,
      fileData,
      userId,
      noteId: noteId as any,
      title,
      source_type: getFileExtension(fileName),
    });

    await agenda.now("docEmbedding", { noteId, userId, docId: newDoc._id });
    return res.status(200).json({ message: "Google Drive file added successfully." });
  } catch (error: any) {
    const driveStatus = error?.response?.status;
    if (driveStatus === 403) {
      return res.status(403).json({
        message: "Cortex does not have permission to download this Drive file. Reconnect Google Drive and try again.",
      });
    }
    if (driveStatus === 404) {
      return res.status(404).json({ message: "That Google Drive file could not be found." });
    }
    next(error);
  }
}
