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
import { chargeCredits, CREDIT_COST } from "@/app/services/creditService";


export async function generateSummarySource(req: Request, res: Response, next: NextFunction) {
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

        const summaries = [] as Array<{ title: string | null | undefined, summary: string | null | undefined }>

        for (const docId of docIds) {

            const doc = await docRepo.getSingleDoc2({ _id: docId, userId, noteId })
            // doc exist 
            if (doc) {

                summaries.push({
                    title: doc?.title,
                    summary: doc?.summary
                })

            }

        }


        if (summaries.length > 0) {

            if (summaries.length === 1) {

                const title = `Summary · ${summaries[0]?.title || "Source"}`;

                // return doc summary
                await sourceRepo.createSource({
                    userId, noteId,
                    title,
                    source_type: 'summary',
                    content: summaries[0]?.summary as string,
                    total_source: 1
                })
                return res.status(200).send({ message: "finished creating summary" })

                // finish

            } else {
                // pass that array to llm to create a single Summary
                const countSource = summaries.length
                const summaryToStr = formatSummaries(summaries)

                const llmFinalSummary = await mergeSummary({ countSource, llm, summaryToStr }) as string

                const title = `Summary · ${countSource} sources`;

                await sourceRepo.createSource({
                    userId, noteId,
                    title,
                    source_type: 'summary',
                    content: llmFinalSummary,
                    total_source: countSource
                })

                return res.status(200).send({ message: "finished creating summary" })
            }


        }


    } catch (error) {

        next(error)

    }

}
type SummaryItem = {
    title?: string | null;
    summary?: string | null;
};


function formatSummaries(summaries: SummaryItem[]): string {
    return summaries
        .map(
            (item) =>
                `title:${item.title ?? ""},summary:${item.summary ?? ""}`
        )
        .join("--==|==--");
}

async function mergeSummary(props: { llm: ChatFireworks, countSource: number, summaryToStr: string }) {

    const { llm, countSource, summaryToStr } = props

    const mapPrompt = ChatPromptTemplate.fromMessages([
        [
            "user",
            `You are a professional technical summarizer. Your task is to merge the following ${countSource} summaries into a single, polished, and concise summary.
Each summary is separated by the marker: "--==|==--".

Input summaries:
{context}

Output requirements:

1. Structure:
   - Produce a clear, logically organized Markdown document.
   - Do not include a # title; the application displays the title separately.
   - Start with ## Overview, then use ## headings for every other major section. Each heading must be on its own line.
   - Leave a blank line before and after every heading and list.
   - Use bullet points (-) for key concepts or takeaways.
   - Include sub-bullets when appropriate for details.
   - Never leave bare labels such as "Architecture" or "Significance" without a Markdown heading.

2. Style & Clarity:
   - Preserve all essential ideas from the original summaries.
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

    const prompt = await mapPrompt.invoke({ context: summaryToStr });
    const response = await llm.invoke(prompt);
    const llmFinalSummary = response?.content;
    return llmFinalSummary

}
