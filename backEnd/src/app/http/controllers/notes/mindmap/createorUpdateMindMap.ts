






import express from 'express'
import { Express, NextFunction, Response, Request } from "express";
import { DocRepository } from '../repository/DocRepository';
import { generateMindMap } from '@/pipelines/mind-map';
import { LLM } from '@/app/llm/LLM';
import { cwd } from 'process';
import path from 'path';
import { loadDocumentFromBuffer } from '../loaders/loaders';
import { generateStudyguide } from '@/pipelines/study-guide';

// export async function createorUpdateMindMap(req: Request, res: Response, next: NextFunction) {
//     try {

//         const { userId, noteId }: Record<string, any> = req.query
//         const llm = LLM.getInstance()
//         const docRepo = DocRepository.getInstance()
//         const doc = await docRepo.getSingleDoc({ userId, noteId })
//         if (!doc) throw new Error('No document found')

//         const studyGuide = doc?.studyGuide

//         if (!studyGuide) throw new Error('No data provided to generate the stuide guide')

//         const mindMap = await generateMindMap(llm, studyGuide)

//         const storedMindMap = await docRepo.updateMindMap({ userId, noteId, mindMap })


//         return res.status(200).send({ mindMap: storedMindMap })


//     } catch (error) {

//         next(error)

//     }

// }





export async function createorUpdateMindMap(_id: string, userId: string, noteId: string) {
    try {


        // const { userId, noteId }: Record<string, any> = req.body
        const llm = LLM.getInstance()


        const docRepo = DocRepository.getInstance()
        const doc = await docRepo.getSingleDoc2({ _id, userId, noteId })
        if (!doc) throw new Error('No document found')

        if (!doc.fileData) throw new Error("Source file not found in MongoDB")
        const splittingDocs = await loadDocumentFromBuffer(doc.fileData, doc.fileName || "source.txt")
        const studyguide = await generateStudyguide(llm, splittingDocs)

        await docRepo.updateStudyGuide2({ _id, userId, noteId, studyGuide: studyguide?.finalStudyGuide })

        // return res.status(200).send({ message: 'studyGuide generated successfully', studyGuide: studyguide?.finalStudyGuide })
        console.log('Finished generating study guide')

    } catch (error) {

        console.log(error)

    }

}


