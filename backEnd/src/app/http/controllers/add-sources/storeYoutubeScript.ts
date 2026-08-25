import { google } from "googleapis";
import { Request, Response, NextFunction } from "express";

import { generateUniqueFileName } from "@/util/generateFileName";
import { generateTitle } from "../notes/helpers/TitleGeneration";
import { DocRepository } from "../notes/repository/DocRepository";
import { Document } from "@langchain/core/documents";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { formatDocumentsAsString } from "langchain/util/document";
import agenda from "@/app/bootstrap/agenda/agenda";
import { LLM } from "@/app/llm/LLM";
import { chargeCredits, CREDIT_COST } from "@/app/services/creditService";


import { getSubtitles, getVideoDetails } from 'youtube-caption-extractor';


async function fetchYoutubeDocs(url: string): Promise<Document[]> {
  try {
    // 1. Extract Video ID (Handles standard, shorts, and mobile URLs)
    const videoIdMatch = url.match(/(?:v=|\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : "";

    if (!videoId) {
      throw new Error("Invalid YouTube URL. Could not extract Video ID.");
    }

    console.log(`🎥 Fetching transcript for ID: ${videoId}`);

 
    const subtitles = await getSubtitles({ 
      videoID: videoId, 
      lang: 'en' 
    });

    if (!subtitles || subtitles.length === 0) {
      throw new Error("No subtitles found. Captions might be disabled on this video.");
    }

    // 3. Combine text segments into a single string
    const fullText = subtitles.map(sub => sub.text).join(' ');

    // 4. Return as LangChain Document array
    return [
      new Document({ 
        pageContent: fullText, 
        metadata: { 
          source: url, 
          source_type: 'youtube', 
          videoId 
        } 
      })
    ];

  } catch (error) {
    console.error("❌ Caption Extractor Error:", error);
    throw new Error(`Failed to fetch transcript: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// --- Main Controller ---
export async function storeYoutubeScript(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, noteId, youtubeLink } = req.body;

    if (!youtubeLink) {
        return res.status(400).json({ message: "YouTube link is required" });
    }
    await chargeCredits(userId, CREDIT_COST.source);

    const llm = LLM.getInstance();
 
    let docs: Document[];
    try {
        docs = await fetchYoutubeDocs(youtubeLink);


        console.log('youtube data    : ',docs)
    } catch (err) {
        console.error("Transcript fetch failed:", err);
        return res.status(400).json({ message: "Could not retrieve transcript. Ensure captions are enabled on this video." });
    }
    // --- REPLACEMENT END ---



    // Generate title using the docs
    const title = await generateTitle(llm, docs);

    // Create doc entry in DB
    const fileName = `${generateUniqueFileName()}.txt`;
    const docRepo = DocRepository.getInstance();
    
    const newDoc = await docRepo.createDoc({ 
        fileName, 
        fileData: Buffer.from(formatDocumentsAsString(docs), "utf8"),
        userId, 
        noteId, 
        title, 
        source_type: 'youtube' 
    });
    
    // Schedule Embedding
    await agenda.now('docEmbedding', {
        noteId, 
        userId,
        docId: newDoc._id
    });

    console.log("YouTube transcript saved to MongoDB");
    res.status(200).json({ message: "Document saved successfully" });

  } catch (err) {
    next(err);
  }
}
