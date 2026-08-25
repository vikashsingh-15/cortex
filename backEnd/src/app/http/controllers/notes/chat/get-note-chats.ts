import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { Document } from "@langchain/core/documents";

import { Express, NextFunction, Response, Request } from "express";
import { getConversationHistory } from "./chat-history";


export async function getNoteChats(req: Request, res: Response, next: NextFunction) {
  try {

    const {userId,noteId}=req.query as {userId:string,noteId:string}
    if(!userId || !noteId)
      return res.status(200).send({message:"provide userId and noteId"})

    const chatHistory=await getConversationHistory({userId,noteId})



    return res.status(200).send({ chatHistory })

  } catch (error) {
    next(error)
  }
}
