import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { NoteRepository } from "./repository/NoteRepository";

export async function deleteNote(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).send({ message: "A valid note ID is required." });
    }

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).send({ message: "A valid user ID is required." });
    }

    const noteRepo = NoteRepository.getInstance();
    const deletedNote = await noteRepo.deleteNote({ id, userId });

    if (!deletedNote) {
      return res.status(404).send({ message: "Notebook not found." });
    }

    return res.status(200).send({ message: "Notebook deleted successfully." });
  } catch (error) {
    next(error);
  }
}
