


import express from 'express'
import { Express, NextFunction, Response, Request } from "express";
import { DocRepository } from '../repository/DocRepository';
import { LLM } from '@/app/llm/LLM';
import { cwd } from 'process';
import { loadDocument } from '../loaders/loaders';
import { generateSummary } from '@/pipelines/summary';
import path from 'path';
import { updateOrCreateSummary } from './updateOrCreateSummary';
import { runWithConcurrency } from '@/app/utils/runWithConcurrency';

type PendingDocument = { docId: string; userId: string; noteId: string };

// export async function getDocSummary(req: Request, res: Response, next: NextFunction) {
//     try {

//         const { userId, noteId }: Record<string, any> = req.query
//         const docRepo = DocRepository.getInstance()
//         const doc = await docRepo.getSingleDoc({ userId, noteId })
//         if (!doc) throw new Error('No document found')


//         return res.status(200).send({ summary: doc?.summary })


//     } catch (error) {

//         next(error)

//     }

// }



export async function getDocSummary(req: Request, res: Response, next: NextFunction) {
    try {

        const { userId, noteId,docIds }= req.body as  {userId:string,noteId:string,docIds:string[]} 

    
        const docRepo = DocRepository.getInstance()
        const docWithoutSummary: PendingDocument[] = []

        for(const docId of docIds){
            const doc = await docRepo.getSingleDoc2({_id:docId, userId, noteId })

            if(doc && !doc.summary){
                docWithoutSummary.push({
                    noteId:doc.noteId.toString(),
                    userId:doc.userId.toString(),
                    docId:doc._id.toString()
                })
            }
        }

        // summary generation

        await runWithConcurrency(docWithoutSummary, (docW) =>
          updateOrCreateSummary(docW.docId, docW.userId, docW.noteId),
        );


        return res.status(200).send({ status:'ready_to_generate_source'})


    } catch (error) {

        next(error)

    }

}



