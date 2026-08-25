import { Router } from "express";
import { createNote2 } from "../createNote";


 export function createBlankNoteRoutes(router: Router) {
  
   router.post("/blank/notes", createNote2);


   return router;
 }
 