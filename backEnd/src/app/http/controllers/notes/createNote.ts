import express from 'express'
import { Express, NextFunction, Response, Request } from "express";
import { NoteRepository } from './repository/NoteRepository';
import { generateTitle } from './helpers/TitleGeneration';
import { generatePrompt } from './helpers/promptGenerator';
import { generateImage } from './helpers/generateImage';
import { LLM } from '@/app/llm/LLM';
import { loadDocumentFromBuffer } from './loaders/loaders';
import { DocRepository } from './repository/DocRepository';
import { getDocChunk } from '@/util/getDocChunk';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import zodToJsonSchema from 'zod-to-json-schema';
import z from 'zod';
import { ChatFireworks } from '@langchain/community/chat_models/fireworks';
import { chargeCredits, CREDIT_COST } from "@/app/services/creditService";
export async function createNote(req: Request, res: Response, next: NextFunction) {
    try {

        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }

        const userId = req.body?.userId;
        await chargeCredits(userId, CREDIT_COST.source);


        const randomName = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const fileName=req.file.originalname

        const llm = LLM.getInstance()


        const docSplit = await loadDocumentFromBuffer(req.file.buffer, fileName)


        const firstChunk=getDocChunk(docSplit)
        const title = await generateTitle(llm, firstChunk)

        const generateImagePrompt = await generatePrompt(llm, title)


        const image = ""
        const noteRepo = NoteRepository.getInstance()
        const docRepo=DocRepository.getInstance()
        const newNote = await noteRepo.createNote({ title, image, userId },
             {
            generateImagePrompt, uploadsDir: "", randomName
        }
        ) 

        const newDoc=await docRepo.createDoc({fileName, fileData: req.file.buffer, userId,noteId:newNote._id })




        return res.status(201).send({ message: "note created successfully",newNote })


    } catch (error) {

        next(error)

    }

}




export async function createNote2(req: Request, res: Response, next: NextFunction) {
    try {

     
        const userId = req.body?.userId;

   if (!userId) {
            return res.status(400).send("userId is required.");
        }

  
        const llm = LLM.getInstance()
        const noteRepo = NoteRepository.getInstance()
        // const docRepo=DocRepository.getInstance()

        const title='untitled notebook'
        const  emoji=await generateEmoji({llm,title})
        console.log('ai result  :  ',emoji)
        const newNote = await noteRepo.createNote2({ title: title, image: emoji, userId })

        // const newDoc=await docRepo.createDoc({fileName,userId,noteId:newNote._id })

        return res.status(201).send({ message: "note created successfully", newNote })


    } catch (error) {

        next(error)

    }

}






export async function generateEmoji(props: { llm: ChatFireworks, title: string }) {
    try {
        const { title, llm } = props

const mapPrompt = ChatPromptTemplate.fromMessages([
  [
    "user",
    `
You are a creative emoji designer.

Your task:
- Return a **single emoji** that best represents the following title.
- The emoji should clearly capture the main theme or emotion of the title.
- Do **not** include any explanation, text, or punctuation — only the emoji.

---
Title: {title}
---
Output:
`
  ]
])


        const prompt = await mapPrompt.invoke({
            title: title
        });
        const response = await llm.invoke(prompt, {
            response_format: {
                type: "json_object",
                schema: zodToJsonSchema(
                    z.object({
                        emoji: z.string().max(1, "Only one emoji allowed"),
                    })
                )
            }
        } as any);

        const result=response?.content
        const jsonParse=JSON.parse(result as string)
        return jsonParse?.emoji
    } catch (error) {
        console.log('e : ',(error as any)?.message)
        console.log('failed to emoji')

    }

}

