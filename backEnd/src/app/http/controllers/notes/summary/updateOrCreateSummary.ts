import express from 'express'
import { Express, NextFunction, Response, Request } from "express";
import { NoteRepository } from '../repository/NoteRepository';
import { generateSummary } from '@/pipelines/summary';
import { LLM } from '@/app/llm/LLM';
import { cwd } from 'process';
import path from 'path';
import { DocRepository } from '../repository/DocRepository';
import { loadDocumentFromBuffer } from '../loaders/loaders';

export async function updateOrCreateSummary(_id:string,userId:string,noteId:string){ 
    try {


        // const { userId, noteId }: Record<string, any> = req.body
        const llm = LLM.getInstance()


        const docRepo = DocRepository.getInstance()
        const doc = await docRepo.getSingleDoc2({_id:_id,userId,noteId})
        if (!doc) throw new Error('No document found')

        if (!doc.fileData) throw new Error("Source file not found in MongoDB")
        const splittingDocs = await loadDocumentFromBuffer(doc.fileData, doc.fileName || "source.txt")
        const summary = await generateSummary(llm, splittingDocs)

        await docRepo.updateSummary2({docId:_id,userId,noteId,summary:summary?.finalSummary})


        console.log('finished generating summary')
        // return res.status(200).send({ message: 'summary generated successfully', summary: summary?.finalSummary })


    } catch (error) {
        throw error;
    }

}


