

import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import zodToJsonSchema from "zod-to-json-schema";
import z from "zod";
import { formatDocumentsAsString } from "langchain/util/document";
import { Document } from "@langchain/core/documents";
import { Runnable } from "@langchain/core/runnables";


const generate_title_promt = PromptTemplate.fromTemplate(`
You are a helpful assistant that generates concise and clear titles.
Based on the following document content, create a single title that
captures the main theme or subject of the document.

Document Content:
{document}

Title:
`);



export async function generateTitle<T extends Runnable>(llm:T,doc: Document<Record<string, any>>[]) {

    const docToString = formatDocumentsAsString(doc)
    const chain = generate_title_promt.pipe(llm)

    const chainResult = await chain.invoke({
        document: docToString
    }, {
        response_format: {
            type: "json_object",
            schema: zodToJsonSchema(
                z.object({
                    title: z.string().min(40).max(60)
                })
            )
        }
    } as any)
    const result = JSON.parse(chainResult?.content as string)
    const generateTitle=result?.title
    return generateTitle
}
