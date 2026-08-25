


import express from 'express'
import { Express, NextFunction, Response, Request } from "express";
import { DocRepository } from '../repository/DocRepository';
import { updateOrCreateFaq } from './createOrUpdateFaq';
import { runWithConcurrency } from '@/app/utils/runWithConcurrency';

type PendingDocument = { docId: string; userId: string; noteId: string };

// export async function getDocFaq(req: Request, res: Response, next: NextFunction) {
//     try {

//     const {userId,noteId}:Record<string,any>=req.query
//     const docRepo=DocRepository.getInstance()
//     const doc=await docRepo.getSingleDoc({userId,noteId})
// if(!doc) throw new Error('No document found')

 
//     return res.status(200).send({faq:doc?.faq})
  

//     } catch (error) {

//         next(error)

//     }

// }



export async function getDocFaq(req: Request, res: Response, next: NextFunction) {
    try {

        const { userId, noteId,docIds }= req.body as  {userId:string,noteId:string,docIds:string[]} 

    
        const docRepo = DocRepository.getInstance()
        const docWithoutFaq: PendingDocument[] = []

        for(const docId of docIds){
            const doc = await docRepo.getSingleDoc2({_id:docId, userId, noteId })

            if(doc && !doc.faq){
                docWithoutFaq.push({
                    noteId:doc.noteId.toString(),
                    userId:doc.userId.toString(),
                    docId:doc._id.toString()
                })
            }
        }

        // summary generation

        await runWithConcurrency(docWithoutFaq, (docW) =>
          updateOrCreateFaq(docW.docId, docW.userId, docW.noteId),
        );


        return res.status(200).send({ status:'ready_to_generate_source'})


    } catch (error) {

        next(error)

    }

}
