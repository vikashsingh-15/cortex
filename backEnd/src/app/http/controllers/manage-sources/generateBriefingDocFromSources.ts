import express from 'express'
import { Express, NextFunction, Response, Request } from "express";
import { LLM } from '@/app/llm/LLM';
import { cwd } from 'process';
import path from 'path';
import { DocRepository } from '../notes/repository/DocRepository';
import { loadDocument } from '../notes/loaders/loaders';
import { SourceRepository } from '../notes/repository/SourceRepository';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatFireworks } from '@langchain/community/chat_models/fireworks';
import { generateTitle } from '../notes/helpers/TitleGeneration';
import { Document } from '@langchain/core/documents';
import { generatePodCastFromBriefingDoc } from './generatePodcast';
import { chargeCredits, CREDIT_COST } from "@/app/services/creditService";


export async function generateBriefingSources(req: Request, res: Response, next: NextFunction) {
    try {


        const { userId, noteId, docIds, type } = req.body as { userId: string, noteId: string, docIds: string[], type: 'audio' | 'briefing-doc' }

        if (!userId || !noteId) {
            return res.status(400).json({ message: "  userId or noteId are required" });
        }

        if (docIds.length === 0) {
            return res.status(400).json({ message: "select a source" });
        }

        if (type !== "audio" && type !== "briefing-doc") {
            return res.status(400).json({ message: "invalid output type" });
        }
        await chargeCredits(userId, CREDIT_COST.generatedOutput);

        const llm = LLM.getInstance()


        const sourceRepo = SourceRepository.getInstance()
        const docRepo = DocRepository.getInstance()

        const briefingdocs = [] as Array<{ title: string | null | undefined, briefingdoc: string | null | undefined }>

        for (const docId of docIds) {

            const doc = await docRepo.getSingleDoc2({ _id: docId, userId, noteId })
            // doc exist 
            if (doc) {

                if (!doc.briefingDoc?.trim()) {
                    throw new Error("A briefing document could not be generated for a selected source.");
                }

                briefingdocs.push({
                    title: doc?.title,
                    briefingdoc: doc?.briefingDoc
                })

            }

        }


        if (briefingdocs.length > 0) {

            if (briefingdocs.length === 1) {

                const title = await generateTitle(llm, [new Document({ pageContent: briefingdocs[0]?.briefingdoc as string })])



console.log('the type is  ::  ',type)

                if (type === 'audio') {

                    await generatePodCastFromBriefingDoc({ llm, context: briefingdocs[0]?.briefingdoc as string, userId, noteId, title, total_source: 1 })
                    return res.status(200).send({ message: "Finished generating audio" })


                }

                if (type === 'briefing-doc') {


                    // return doc briefingdoc
                    await sourceRepo.createSource({
                        userId, noteId,
                        title,
                        source_type: 'briefingdoc',
                        content: briefingdocs[0]?.briefingdoc as string,
                        total_source: 1
                    })

                    return res.status(200).send({ message: "finished creating briefingdoc" })


                }



                // finish

            } else {
                // pass that array to llm to create a single briefingdoc
                const countSource = briefingdocs.length
                const briefingdocToStr = formatbriefingdoc(briefingdocs)

                const llmFinalbriefingdoc = await mergebriefingdoc({ countSource, llm, briefingdocToStr }) as string

                const title = await generateTitle(llm, [new Document({ pageContent: briefingdocToStr as string })])



                if (type === 'audio') {

                    await generatePodCastFromBriefingDoc({ llm, context: llmFinalbriefingdoc as string, userId, noteId, title, total_source: countSource })
                    return res.status(200).send({ message: "Finished generating audio" })


                }

                if (type === 'briefing-doc') {

                    await sourceRepo.createSource({
                        userId, noteId,
                        title,
                        source_type: 'Briefing doc',
                        content: llmFinalbriefingdoc,
                        total_source: countSource
                    })
                    return res.status(200).send({ message: "finished creating briefingdoc" })
                }



            }


        }

        return res.status(422).json({ message: "No selected sources were available for generation." });

    } catch (error) {

        next(error)

    }

}
type briefingdocItem = {
    title?: string | null;
    briefingdoc?: string | null;
};


function formatbriefingdoc(briefingdoc: briefingdocItem[]): string {
    return briefingdoc
        .map(
            (item) =>
                `title:${item.title ?? ""},briefingdoc:${item.briefingdoc ?? ""}`
        )
        .join("--==|==--");
}

async function mergebriefingdoc(props: { llm: ChatFireworks, countSource: number, briefingdocToStr: string }) {

    const { llm, countSource, briefingdocToStr } = props

    const mapPrompt = ChatPromptTemplate.fromMessages([
        [
            "user",
            `You are a professional Briefing Doc creator. Your task is to merge the following ${countSource} briefingdocs into a single, polished, and concise briefingdoc.
Each briefingdoc is separated by the marker: "--==|==--".

Input briefingdoc:
{context}

Output requirements:

1. Structure:
   - Produce a clear, logically organized Markdown document.
   - Use headings (##) for major sections if applicable.
   - Use bullet points (-) for key concepts or takeaways.
   - Include sub-bullets when appropriate for details.

2. Style & Clarity:
   - Preserve all essential ideas from the original briefingdoc.
   - Avoid repetition, filler, or irrelevant content.
   - Keep the tone factual, neutral, and professional.
   - Highlight important terms, technologies, or concepts using **bold**.

3. Readability:
   - Ensure the Markdown output is clean, scannable, and visually clear.
   - Paragraphs should be concise and coherent.
   - Lists should be indented and properly formatted.

4. Output:
   - Only return Markdown content; do not include explanations outside of Markdown.
`
        ]
    ]);

    const prompt = await mapPrompt.invoke({ context: briefingdocToStr });
    const response = await llm.invoke(prompt);
    const llmFinalbriefingdoc = response?.content;
    return llmFinalbriefingdoc

}
