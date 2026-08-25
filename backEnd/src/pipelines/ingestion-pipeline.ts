import { Document } from "@langchain/core/documents";

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

import "dotenv/config";

export async function webFileEmbedding(url:string) {
  

    const loader = new CheerioWebBaseLoader(url);
    const docs = await loader.load();



// chunckoverlap: we use it in order to preverse the meaning of the chunk
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
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
console.log('finished indexing...')

}



await webFileEmbedding('https://lilianweng.github.io/posts/2023-03-15-prompt-engineering/')
