import { addSourceRoutes } from "@/app/http/controllers/add-sources/routes/addSourceRoute";
import { driveRoutes } from "@/app/http/controllers/drive/routes/driveRoutes";
import { sourceResultRoutes } from "@/app/http/controllers/manage-sources/routes/sourceResultRoutes";
import { chatRoutes } from "@/app/http/controllers/notes/chat/routes/chatRoutes";
import { briefingRoutes } from "@/app/http/controllers/notes/routes/briefingDocRoutes";
import { createBlankNoteRoutes } from "@/app/http/controllers/notes/routes/createBlankNoteRoutes";
import { createNoteRoute } from "@/app/http/controllers/notes/routes/createNoteRoutes";
import { faqRoutes } from "@/app/http/controllers/notes/routes/faqRoutes";
import { getAllNoteRoute } from "@/app/http/controllers/notes/routes/getAllNoteRoute";
import { getMindMapRoutes } from "@/app/http/controllers/notes/routes/mindMapRoutes";
import { studyguideRoutes } from "@/app/http/controllers/notes/routes/studyguideRoutes";
import { summaryRoutes } from "@/app/http/controllers/notes/routes/summaryRoutes";
import { updateNoteRoute } from "@/app/http/controllers/notes/routes/updateNoteRoute";
import { paymentRoutes } from "@/app/http/controllers/payment/routes/paymentRoutes";

import { Router, Express } from "express";



export function apiV1(app: Express, router: Router) {

  const driveRoute = driveRoutes(router)
  const createNote = createNoteRoute(router)

  const updateNote = updateNoteRoute(router)
  const getAllNote = getAllNoteRoute(router)
  const summaryRoute = summaryRoutes(router)
  const briefingDoc = briefingRoutes(router)
  const faqRoute = faqRoutes(router)
 const studyguide= studyguideRoutes(router)
 const mindmap=getMindMapRoutes(router)
 const addSourceRoute=addSourceRoutes(router)
 const addSourceResultRoute=sourceResultRoutes(router)

 const chat=chatRoutes(router)
 const paymentRoute=paymentRoutes(router)
const createBlankNote=createBlankNoteRoutes(router)
  app.use('/api/v1',createBlankNote,paymentRoute,chat, mindmap,studyguide,addSourceResultRoute,driveRoute, addSourceRoute,faqRoute, createNote, updateNote, getAllNote, summaryRoute, briefingDoc)
}