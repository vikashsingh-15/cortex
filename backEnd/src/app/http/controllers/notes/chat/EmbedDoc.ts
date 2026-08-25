
import { Document } from "@langchain/core/documents";

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { loadDocument } from "../loaders/loaders";
import { loadDocumentFromBuffer } from "../loaders/loaders";
import { Doc } from "@/app/models/docSchema";


export async function docEmbedding(props: { docId: string, noteId: string, userId: string }) {
    const { docId, noteId, userId } = props
    const storedDoc = await Doc.findOne({ _id: docId, noteId, userId }).select("+fileData");
    if (!storedDoc?.fileData) throw new Error("Source file not found in MongoDB.");

    const parseDocs = await loadDocumentFromBuffer(storedDoc.fileData, storedDoc.fileName || "source.txt");
    const pdfDocsWithMeta = parseDocs.map((doc) => {
        doc.metadata.source = storedDoc.fileName
        doc.metadata.noteId = noteId
        doc.metadata.userId = userId

        return doc;
    });


    const docs = pdfDocsWithMeta.flat();

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const allSplits = await textSplitter.splitDocuments(docs);

    // step 3. embedding

    const embeddings = new CohereEmbeddings({
        model: "embed-english-v3.0",
        apiKey: process.env.COHERE_API_KEY,
    });

    const pinecone = new PineconeClient({
        apiKey: process.env.PINECONE_API_KEY as string,
    });
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX as string);

    const vectorStore = new PineconeStore(embeddings, {
        pineconeIndex,
        maxConcurrency: 5,
    });
    await vectorStore.addDocuments(allSplits);


    console.log("finished embedding... doc ");


}

