import express from 'express'
import { Express, NextFunction, Response, Request } from "express";
import { NoteRepository } from './repository/NoteRepository';
import { Note } from '@/app/models/noteSchema';

export async function getsingleNote(req: Request, res: Response, next: NextFunction) {
    try {

        const noteId = req.params?.id as string
        if (!noteId)
            return res.status(422).send({ message: "provide the noteId" })
        const noteRepo = NoteRepository.getInstance()
        const note = await noteRepo.getSingleNote(noteId)



        return res.status(200).send({ note })
    } catch (error) {

        next(error)

    }

}

export async function getNoteImage(req: Request, res: Response, next: NextFunction) {
    try {
        const note = await Note.findById(req.params.id).select("+imageData +imageMimeType");
        if (!note?.imageData) return res.status(404).send({ message: "Notebook image not found." });

        res.setHeader("Content-Type", note.imageMimeType || "image/png");
        return res.send(note.imageData);
    } catch (error) {
        next(error);
    }
}


