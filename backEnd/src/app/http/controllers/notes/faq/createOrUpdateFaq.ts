import express from 'express'
import { Express, NextFunction, Response, Request } from "express";
import { LLM } from '@/app/llm/LLM';
import { cwd } from 'process';
import path from 'path';
import { DocRepository } from '../repository/DocRepository';
import { loadDocumentFromBuffer } from '../loaders/loaders';
import { generateFAQ } from '@/pipelines/generate-faq';

export async function updateOrCreateFaq(_id:string,userId:string,noteId:string){
    try {


        // const { userId, noteId }: Record<string, any> = req.body
        const llm = LLM.getInstance()


        const docRepo = DocRepository.getInstance()
        const doc = await docRepo.getSingleDoc2({_id, userId, noteId })
        if (!doc) throw new Error('No document found')

        if (!doc.fileData) throw new Error("Source file not found in MongoDB")
        const splittingDocs = await loadDocumentFromBuffer(doc.fileData, doc.fileName || "source.txt")
        const faq = await generateFAQ(llm, splittingDocs)

        await docRepo.updateFaq2({_id, userId, noteId, faq: faq?.finalFAQ })

        console.log('finished generating FAQ')
        // return res.status(200).send({ message: 'summary generated successfully', faq: faq?.finalFAQ })


    } catch (error) {
        throw error;
    }

}


