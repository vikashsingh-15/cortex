import express from 'express'
import { Express, NextFunction, Response, Request } from "express";
import { LLM } from '@/app/llm/LLM';
import { cwd } from 'process';
import path from 'path';

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatFireworks } from '@langchain/community/chat_models/fireworks';
import { Document } from '@langchain/core/documents';
import { DocRepository } from '../notes/repository/DocRepository';
import { SourceRepository } from '../notes/repository/SourceRepository';
import { generateTitle } from '../notes/helpers/TitleGeneration';
import { chargeCredits, CREDIT_COST } from "@/app/services/creditService";


export async function generateFAQFromSources(req: Request, res: Response, next: NextFunction) {
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

        const faqs = [] as Array<{ title: string | null | undefined, faq: string | null | undefined }>

        for (const docId of docIds) {

            const doc = await docRepo.getSingleDoc2({ _id: docId, userId, noteId })
            // doc exist 
            if (doc) {

                faqs.push({
                    title: doc?.title,
                    faq: doc?.faq
                })

            }

        }


        if (faqs.length > 0) {

            if (faqs.length === 1) {

                const title = `FAQ · ${faqs[0]?.title || "Source"}`;

                // return doc summary
                await sourceRepo.createSource({
                    userId, noteId,
                    title,
                    source_type: 'FAQ',
                    content: faqs[0]?.faq as string,
                    total_source: 1
                })
                return res.status(200).send({ message: "finished creating faq" })

                // finish

            } else {
                // pass that array to llm to create a single Summary
                const countSource = faqs.length
                const faqToStr = formatFaqs(faqs)

                const llmFinalFAQ = await mergeFaq({ countSource, llm, faqToStr }) as string

                const title = `FAQ · ${countSource} sources`;

                await sourceRepo.createSource({
                    userId, noteId,
                    title,
                    source_type: 'faq',
                    content: llmFinalFAQ,
                    total_source: countSource
                })

                return res.status(200).send({ message: "finished creating faq" })
            }


        }


    } catch (error) {

        next(error)

    }

}
type FaqItem = {
    title?: string | null;
    faq?: string | null;
};


function formatFaqs(faqs: FaqItem[]): string {
    return faqs
        .map(
            (item) =>
                `title:${item.title ?? ""},summary:${item.faq ?? ""}`
        )
        .join("--==|==--");
}

async function mergeFaq(props: { llm: ChatFireworks, countSource: number, faqToStr: string }) {

    const { llm, countSource, faqToStr } = props

    const mapPrompt = ChatPromptTemplate.fromMessages([
        [
            "user",
            `You are a professional technical FAQ creator. Your task is to merge the following ${countSource} faqs into a single, polished, and concise FAQ.
Each FAQ is separated by the marker: "--==|==--".

Input faqs:
{context}

Output requirements:

1. Structure:
   - Produce a clear, logically organized Markdown document.
   - Use headings (##) for major sections if applicable.
   - Use bullet points (-) for key concepts or takeaways.
   - Include sub-bullets when appropriate for details.

2. Style & Clarity:
   - Preserve all essential ideas from the original faqs.
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

    const prompt = await mapPrompt.invoke({ context: faqToStr });
    const response = await llm.invoke(prompt);
    const llmFinalFAQ = response?.content;
    return llmFinalFAQ

}
