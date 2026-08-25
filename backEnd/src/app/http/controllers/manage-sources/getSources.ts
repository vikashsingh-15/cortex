import express from 'express'
import { Express, NextFunction, Response, Request } from "express";
import { SourceRepository } from '../notes/repository/SourceRepository';

export async function getSourceResults(req: Request, res: Response, next: NextFunction) {
    try {

        const query = req.query
        const userId = query?.userId as string
        const noteId = query?.noteId as string
        if (!userId || !noteId) {
            return res.status(400).json({ message: "  userId or noteId are required" });
        }

        const sourceRepo = SourceRepository.getInstance()

        const sources = await sourceRepo.getAllSources({ userId, noteId })
        return res.status(200).send({sources})

    } catch (error) {

        next(error)

    }

}


