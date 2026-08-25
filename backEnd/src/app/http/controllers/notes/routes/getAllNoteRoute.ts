import { Router } from "express"
import { getAllNotes } from "../getAllNotes"
import { VerifyExpressToken } from "@/app/helpers/jwt"
import { getNoteImage, getsingleNote } from "../getSingleNote";
import { getDocOverview } from "../getDocOverview";
import { deleteNote } from "../deleteNote";


function requireAuth(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  next();
}



export function getAllNoteRoute(router:Router){

router.get('/notes',getAllNotes)
router.get('/notes/:id/image',getNoteImage)
router.get('/notes/:id',getsingleNote)
router.delete('/notes/:id', deleteNote)


router.get('/notes/docs/overview',getDocOverview)




    return router
}
