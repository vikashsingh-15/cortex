import { google } from "googleapis";
import { Request, Response, NextFunction } from "express";
import { LLM } from "@/app/llm/LLM";
import { generateUniqueFileName } from "@/util/generateFileName";
import { generateTitle } from "../notes/helpers/TitleGeneration";
import { DocRepository } from "../notes/repository/DocRepository";
import { Document } from "@langchain/core/documents";
import agenda from "@/app/bootstrap/agenda/agenda";
import { chargeCredits, CREDIT_COST } from "@/app/services/creditService";

export async function storeTextData(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, noteId, text } = req.body;
    await chargeCredits(userId, CREDIT_COST.source);

    const llm = LLM.getInstance();

    // Generate title
    const title = await generateTitle(llm, [new Document({ pageContent: text })]);

    // Create doc entry in DB
    const fileName = `${generateUniqueFileName()}.txt`
    const docRepo = DocRepository.getInstance();
    const newDoc = await docRepo.createDoc({ fileName, fileData: Buffer.from(text, "utf8"), userId, noteId, title });

    await agenda.now('docEmbedding', { noteId, userId, docId: newDoc._id });
    res.status(200).json({ message: "Document saved successfully" });
  } catch (err) {
    next(err);
  }
}
