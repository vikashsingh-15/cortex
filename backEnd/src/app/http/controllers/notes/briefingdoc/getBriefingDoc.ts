


import express from 'express'
import { Express, NextFunction, Response, Request } from "express";
import { DocRepository } from '../repository/DocRepository';
import { updateOrCreateBriefingDoc } from './updateOrCreateBriefingDoc';

// export async function getBriefingDoc(req: Request, res: Response, next: NextFunction) {
//     try {

//     const {userId,noteId}:Record<string,any>=req.query
//     const docRepo=DocRepository.getInstance()
//     const doc=await docRepo.getSingleDoc({userId,noteId})
// if(!doc) throw new Error('No document found')

 
//     return res.status(200).send({briefingDoc:doc?.briefingDoc})
  

//     } catch (error) {

//         next(error)

//     }

// }



export async function getBriefingDoc(req: Request, res: Response, next: NextFunction) {
    try {

        const { userId, noteId,docIds }= req.body as  {userId:string,noteId:string,docIds:string[]} 

        if (!userId || !noteId || !Array.isArray(docIds) || docIds.length === 0) {
            return res.status(400).send({ message: "userId, noteId, and at least one source are required" });
        }

    
        const docRepo = DocRepository.getInstance()
        const docWithoutBriefingDoc=[] as any

        for(const docId of docIds){
            const doc = await docRepo.getSingleDoc2({_id:docId, userId, noteId })

            if (!doc) {
                throw new Error("Selected source was not found in this note.");
            }

            if(!doc?.briefingDoc){
                docWithoutBriefingDoc.push({
                    noteId:doc?.noteId,
                    userId:doc?.userId,
                    docId:doc?._id
                })
            }
        }

        // summary generation

        for (const docW of docWithoutBriefingDoc){
           await updateOrCreateBriefingDoc(docW?.docId,docW?.userId,docW?.noteId)
        }


        return res.status(200).send({ status:'ready_to_generate_source'})


    } catch (error) {

        next(error)

    }

}



