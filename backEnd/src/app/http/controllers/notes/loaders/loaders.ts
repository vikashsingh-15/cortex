// loaders.js
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { Document } from "@langchain/core/documents";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { randomUUID } from "crypto";

export async function splitDocToChunks(docs:Document<Record<string, any>>[],props:{chunkSize:number, chunkOverlap:number}){
      const splitter = new RecursiveCharacterTextSplitter({...props});
  const splitDocs = await splitter.splitDocuments(docs);
  return splitDocs
}


export async function loadWeb(url:string) {
  const loader = new CheerioWebBaseLoader(url);
  const docs = await loader.load();

  return docs
}


export async function loadPDF(filePath:string) {
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();
   return docs
}


export async function loadText(filePath:string) {
  const loader = new TextLoader(filePath);
  const docs = await loader.load();
  return docs
}




export async function loadDocument(
  filePath: string,
  // doctype:"pdf"|"html"|"txt",
  chunkSize = 1600,
  chunkOverlap = 150
) {

  const extentionWithoutDot=path.extname(filePath).replace('.',' ')
  let docs=null;

  switch  (extentionWithoutDot.trim()) {
    case 'pdf':
      docs = await loadPDF(filePath);
      break;
      case 'html':
      docs = await loadWeb(filePath);
      break;
      case 'txt':
      case 'md':
      case 'markdown':
      docs = await loadText(filePath);
      break;
      case 'csv':
      docs = await loadText(filePath);
      break;
    default:
      throw new Error(`Unsupported file ${filePath}`);
  }

  return splitDocToChunks(docs, { chunkSize, chunkOverlap });
}

export async function loadDocumentFromBuffer(
  fileData: Buffer,
  fileName: string,
  chunkSize = 1600,
  chunkOverlap = 150,
) {
  const extension = path.extname(fileName) || ".txt";
  const tempFilePath = path.join(os.tmpdir(), `cortex-${randomUUID()}${extension}`);

  await fs.writeFile(tempFilePath, fileData);
  try {
    return await loadDocument(tempFilePath, chunkSize, chunkOverlap);
  } finally {
    await fs.unlink(tempFilePath).catch(() => undefined);
  }
}






