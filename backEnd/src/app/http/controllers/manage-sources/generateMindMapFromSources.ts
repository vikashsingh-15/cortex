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
import { generateMindMap } from '@/pipelines/mind-map';
import { chargeCredits, CREDIT_COST } from "@/app/services/creditService";


export async function generateMindMapFromSources(req: Request, res: Response, next: NextFunction) {
    try {


        const { userId, noteId, docIds } = req.body as { userId: string, noteId: string, docIds: string[] }

        if (!userId || !noteId) {
            return res.status(400).json({ message: "  userId or noteId are required" });
        }

        if (docIds.length === 0) {
            return res.status(400).json({ message: "select a source" });
        }
        await chargeCredits(userId, CREDIT_COST.generatedOutput);

        const llm = LLM.getInstance()


        const sourceRepo = SourceRepository.getInstance()
        const docRepo = DocRepository.getInstance()

        const studyguides = [] as Array<{ title: string | null | undefined, studyguide: string | null | undefined }>

        for (const docId of docIds) {

            const doc = await docRepo.getSingleDoc2({ _id: docId, userId, noteId })
            // doc exist 
            if (doc) {

                studyguides.push({
                    title: doc?.title,
                    studyguide: doc?.studyGuide
                })

            }

        }


        if (studyguides.length > 0) {

            if (studyguides.length === 1) {

                const title = `Mind map · ${studyguides[0]?.title || "Source"}`;
                const mindMap = await generateMindMap(llm, studyguides[0]?.studyguide as string)
                // return doc studyguide
                await sourceRepo.createSource({
                    userId, noteId,
                    title,
                    source_type: 'mindMap',
                    content: mindMap,
                    total_source: 1
                })
                return res.status(200).send({ message: "finished creating mind" })

                // finish

            } else {
                // pass that array to llm to create a single studyguide
                const countSource = studyguides.length
                const studyguideToStr = formatstudyguides(studyguides)

                const llmFinalstudyguide = await mergestudyguide({ countSource, llm, studyguideToStr }) as string

                const title = `Mind map · ${countSource} sources`;
                const mindMap = await generateMindMap(llm, llmFinalstudyguide)
                await sourceRepo.createSource({
                    userId, noteId,
                    title,
                    source_type: 'mindMap',
                    content: mindMap,
                    total_source: countSource
                })

                return res.status(200).send({ message: "finished creating mindmap" })
            }


        }


    } catch (error) {

        next(error)

    }

}
type studyguideItem = {
    title?: string | null;
    studyguide?: string | null;
};


function formatstudyguides(studyguides: studyguideItem[]): string {
    return studyguides
        .map(
            (item) =>
                `title:${item.title ?? ""},studyguide:${item.studyguide ?? ""}`
        )
        .join("--==|==--");
}

async function mergestudyguide(props: { llm: ChatFireworks, countSource: number, studyguideToStr: string }) {

    const { llm, countSource, studyguideToStr } = props

    const mapPrompt = ChatPromptTemplate.fromMessages([
        [
            "user",
            `You are a professional technical study guide creator. Your task is to merge the following ${countSource} studyguides into a single, polished, and concise studyguide.
Each studyguide is separated by the marker: "--==|==--".

Input studyguides:
{context}

Output requirements:

1. Structure:
   - Produce a clear, logically organized Markdown document.
   - Use headings (##) for major sections if applicable.
   - Use bullet points (-) for key concepts or takeaways.
   - Include sub-bullets when appropriate for details.

2. Style & Clarity:
   - Preserve all essential ideas from the original studyguides.
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

    const prompt = await mapPrompt.invoke({ context: studyguideToStr });
    const response = await llm.invoke(prompt);
    const llmFinalstudyguide = response?.content;
    return llmFinalstudyguide

}
