import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { Document } from "@langchain/core/documents";
import {
  // BaseMessage,
  SystemMessage,
  HumanMessage,
} from "@langchain/core/messages";
import { formatDocumentsAsString } from "langchain/util/document";
import { ExaSearchResults } from "@langchain/exa";
import Exa from "exa-js";
import { docSummaryTool, libraryTool, searchTool, vectorDBTool } from "./agent-tools";
import { Express, NextFunction, Response, Request } from "express";
import { REACT_AGENT_SYSTEM_PROMPT } from "./agent-system-prompt";
import { LLM } from "@/app/llm/LLM";
import { getConversationHistory, storeConversation } from "./chat-history";
import { chargeCredits, CREDIT_COST } from "@/app/services/creditService";


export async function chatOverDocs(req: Request, res: Response, next: NextFunction) {
  try {

    const { query,userId,noteId } = req.body 
    if (!query || !userId || !noteId) {
      return res.status(400).send({ message: "query, userId, and noteId are required" });
    }

    await chargeCredits(userId, CREDIT_COST.chatQuestion);
   


    console.log('USER REQUEST HERE+++++')

    const llm = LLM.getInstance()

    const tools = [libraryTool, vectorDBTool, searchTool, docSummaryTool]

    const modifyMessages = (messages: string[]) => {
      return [
        new SystemMessage(REACT_AGENT_SYSTEM_PROMPT),

        ...messages,
        new SystemMessage(`
        TOOL PARAMS

        some tools needs these params, If you want to use a tool that needs those, dont hasitate to use .
     
      - userId:${userId}
      - noteId:${noteId}
      `
        ),
      ];
    };

    const appWithMessagesModifier = createReactAgent({
      llm,
      tools,
      messageModifier: modifyMessages as any,
    });



    await storeConversation([{ role: 'user',userId,noteId, content: query as string }])

    const chatHistory = await getConversationHistory({userId,noteId})


    const agentOutput = await appWithMessagesModifier.invoke({
      messages: [...chatHistory],
    }, {
      recursionLimit: 30,
    });

    const aiResponse= agentOutput.messages[agentOutput.messages.length - 1].content as string

    await storeConversation([{ role: 'ai',userId,noteId, content:aiResponse  }])


   


    return res.status(200).send({ message: {content:aiResponse,userId,noteId,role:'ai'} })

  } catch (error) {
    next(error)
  }
}
