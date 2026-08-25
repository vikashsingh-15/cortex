import { Request, Response, NextFunction } from "express";
import { LLM } from "@/app/llm/LLM";
import { formatDocumentsAsString } from "langchain/util/document";
import { generateUniqueFileName } from "@/util/generateFileName";
import { getDocChunk } from "@/util/getDocChunk";
import { loadWeb } from "../notes/loaders/loaders";
import { generateTitle } from "../notes/helpers/TitleGeneration";
import { DocRepository } from "../notes/repository/DocRepository";
import agenda from "@/app/bootstrap/agenda/agenda";
import { chargeCredits, CREDIT_COST } from "@/app/services/creditService";

export async function storeWeblinkData(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, noteId, webLink } = req.body;
    await chargeCredits(userId, CREDIT_COST.source);
    const llm = LLM.getInstance();
    const docSplit = await loadWeb(webLink);
    const documentText = formatDocumentsAsString(docSplit);
    const title = await generateTitle(llm, getDocChunk(docSplit));
    const fileName = `${generateUniqueFileName()}.txt`;
    const docRepo = DocRepository.getInstance();
    const newDoc = await docRepo.createDoc({
      fileName,
      fileData: Buffer.from(documentText, "utf8"),
      userId,
      noteId,
      title,
    });

    await agenda.now("docEmbedding", { noteId, userId, docId: newDoc._id });
    return res.status(200).json({ message: "Document saved successfully" });
  } catch (error) {
    next(error);
  }
}
