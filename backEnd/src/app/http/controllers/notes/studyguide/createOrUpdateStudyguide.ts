import express from 'express'
import { Express, NextFunction, Response, Request } from "express";
import { NoteRepository } from '../repository/NoteRepository';
import { generateSummary } from '@/pipelines/summary';
import { LLM } from '@/app/llm/LLM';
import { cwd } from 'process';
import path from 'path';
import { DocRepository } from '../repository/DocRepository';
import { loadDocumentFromBuffer } from '../loaders/loaders';
import { generateStudyguide } from '@/pipelines/study-guide';

export async function updateOrCreateStudyguide(_id: string, userId: string, noteId: string) {
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
        throw error;
    }

}


