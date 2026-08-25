import express from 'express'
import { Express, NextFunction, Response, Request } from "express";
import { NoteRepository } from './repository/NoteRepository';
import { cwd } from 'process';
import path from 'path';
import { generateTitle } from './helpers/TitleGeneration';
import { generatePrompt } from './helpers/promptGenerator';
import { generateImage } from './helpers/generateImage';
import { LLM } from '@/app/llm/LLM';
import { loadDocument } from './loaders/loaders';
import { generateEmoji } from './createNote';

export async function updateNote(req: Request, res: Response, next: NextFunction) {
    try {

        const {id,title}=req.body

        if(!id || !title){
            throw new Error('Please provide the ID and Title')
        }
        
        const llm = LLM.getInstance()
        
         const  emoji=await generateEmoji({llm,title})
         
        const noteRepo=NoteRepository.getInstance()
        const updateNote=await noteRepo.updateNotes({id,title,image:emoji})
        return res.status(200).send({message:"note updated successfully",updateNote})
    } catch (error) {

        next(error)

    }

}


