import express from 'express'
import { Express, NextFunction, Response, Request } from "express";
import { NoteRepository } from './repository/NoteRepository';
import mongoose from 'mongoose';

export async function getAllNotes(req: Request, res: Response, next: NextFunction) {
    try {

       const query=req.query

       const search=query?.search  as string
       const page=parseInt(query?.page as string) || 1
       const userId = query?.userId as string

       if (!userId || !mongoose.isValidObjectId(userId)) {
           return res.status(400).send({ message: "A valid user ID is required." });
       }

       const noteRepo=NoteRepository.getInstance()
       const notes=await noteRepo.getAllNotes({search:search,page:page,limit:10,userId})
       return res.status(200).send(notes)
    } catch (error) {

        next(error)

    }

}


