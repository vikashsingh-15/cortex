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

    // The last agent message is not guaranteed to be the final answer. When a
    // tool is the final step (or the model returns multipart content), taking
    // messages[messages.length - 1] can persist/display only tool metadata.
    const answerMessage = [...agentOutput.messages]
      .reverse()
      .find((message: any) => {
        const type = typeof message?._getType === "function"
          ? message._getType()
          : message?.type;
        const content = message?.content;
        return type !== "tool" && content && (
          typeof content === "string" || Array.isArray(content)
        );
      }) as any;

    let aiResponse = normaliseMessageContent(answerMessage?.content);
    if (isMetadataOnly(aiResponse)) {
      console.warn("Chat agent returned metadata without an answer; generating a final response from its tool context.");
      aiResponse = await generateFallbackAnswer(llm, query, agentOutput.messages);
    }
    if (!aiResponse.trim()) {
      throw new Error("The model did not return a user-facing answer.");
    }

    await storeConversation([{ role: 'ai',userId,noteId, content:aiResponse  }])


   


    return res.status(200).send({ message: {content:aiResponse,userId,noteId,role:'ai'} })

  } catch (error) {
    next(error)
  }
}

function normaliseMessageContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((part: any) => typeof part === "string" ? part : part?.text || "")
    .filter(Boolean)
    .join("\n");
}

function isMetadataOnly(content: string): boolean {
  try {
    const parsed = JSON.parse(content.trim());
    return Boolean(
      parsed &&
      typeof parsed === "object" &&
      ("tools_called" in parsed || "library_used" in parsed) &&
      ("confidence" in parsed)
    );
  } catch {
    return false;
  }
}

async function generateFallbackAnswer(llm: ReturnType<typeof LLM.getInstance>, query: string, messages: unknown[]) {
  const toolContext = messages
    .filter((message: any) => typeof message?._getType === "function" && message._getType() === "tool")
    .map((message: any) => normaliseMessageContent(message.content))
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 24000);

  const response = await llm.invoke([
    new SystemMessage(`You answer questions about a user's uploaded documents. Write a useful, concise answer in Markdown. Never output JSON, source metadata, tool-call syntax, or an empty response. Use only the supplied document context. If the context is insufficient, say exactly what information is unavailable.`),
    new HumanMessage(`Question: ${query}\n\nDocument context collected by the retrieval tools:\n${toolContext || "No relevant document text was returned."}`),
  ]);

  return normaliseMessageContent(response.content);
}
