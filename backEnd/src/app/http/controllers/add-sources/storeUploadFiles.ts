import { google } from "googleapis";
import { Request, Response, NextFunction } from "express";
import { LLM } from "@/app/llm/LLM";
import { formatDocumentsAsString } from "langchain/util/document";
import { generateFileName, generateUniqueFileName } from "@/util/generateFileName";
import { getDocChunk } from "@/util/getDocChunk";
import { loadDocumentFromBuffer } from "../notes/loaders/loaders";
import { generateTitle } from "../notes/helpers/TitleGeneration";
import { DocRepository } from "../notes/repository/DocRepository";
import agenda from "@/app/bootstrap/agenda/agenda";
import { chargeCredits, CREDIT_COST } from "@/app/services/creditService";

export async function storeUploadFiles(req: Request, res: Response, next: NextFunction) {
    try {

        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }

        const { userId, noteId } = req.body;
        await chargeCredits(userId, CREDIT_COST.source);


        const fileName = req.file.originalname

        const llm = LLM.getInstance()


        const docSplit = await loadDocumentFromBuffer(req.file.buffer, fileName)


        const firstChunk = getDocChunk(docSplit)
        const title = await generateTitle(llm, firstChunk)


        const docRepo = DocRepository.getInstance();
        const newDoc = await docRepo.createDoc({ fileName, fileData: req.file.buffer, userId, noteId, title });


        agenda.now('docEmbedding', {
                        noteId, userId, docId: newDoc._id,
                      })
        console.log('doc saved !!')
        return res.status(201).send({ message: "Document upload successfully" })


    } catch (error) {

        next(error)

    }

}

