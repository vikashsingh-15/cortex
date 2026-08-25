import { LLM } from '@/app/llm/LLM';
import { cwd } from 'process';
import path from 'path';
import { DocRepository } from '../repository/DocRepository';
import { loadDocumentFromBuffer } from '../loaders/loaders';
import { generateBriefingDoc } from '@/pipelines/briefing-doc';

export async function updateOrCreateBriefingDoc(_id:string,userId:string, noteId:string) {
        const llm = LLM.getInstance()


        const docRepo = DocRepository.getInstance()
        const doc = await docRepo.getSingleDoc2({_id, userId, noteId })
        if (!doc) throw new Error('No document found')

        if (!doc.fileData) throw new Error("Source file not found in MongoDB")
        const splittingDocs = await loadDocumentFromBuffer(doc.fileData, doc.fileName || "source.txt")
        const briefingDoc = await generateBriefingDoc(llm, splittingDocs)

        await docRepo.updateBriefingDoc2({_id, userId, noteId, briefingDoc: briefingDoc?.finalBriefingDoc })

        console.log('briefingDoc generated successfully')

}


