import { SearchToolData } from "@/app/tools/SearchToolData";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { queryVectorDB } from "./queryVectorDB";
import { SourceRepository } from "../repository/SourceRepository";
import { NoteRepository } from "../repository/NoteRepository";
import { Document } from "@langchain/core/documents";

export const docSummaryTool = tool(
  async ({ noteId, docId }) => {
    const noteRepo = NoteRepository.getInstance();
    const noteDocs = await noteRepo.getNoteSummary({ noteId, docId });

    return JSON.stringify(noteDocs);
  },
  {
    name: "Doc_summary",
    description: "return  the summary of a document.",
    schema: z.object({
      noteId: z.string().describe("userId"),
      // userId: z.string().describe("noteId"),
      docId: z.string().describe("docId"),
    }),
  },
);

export const libraryTool = tool(
  async ({ userId, noteId }) => {
    const noteRepo = NoteRepository.getInstance();
    const noteDocs = await noteRepo.getSingleNote2(noteId);

    return JSON.stringify(noteDocs);
  },
  {
    name: "user_library",
    description:
      "return a list of user documents, if query equal user_doc or include user_doc.",
    schema: z.object({
      noteId: z.string().describe("userId used to fetch data for this user"),
      userId: z.string().describe("noteId used to fetch data of a note"),
    }),
  },
);

export const vectorDBTool = tool(
  async ({ query, noteId, userId }) => {
    const results = await queryVectorDB({ query, noteId, userId });
    const docs = [] as any;

    for (const result of results) {
      const doc = {
        pageContent: result?.pageContent,
        metadata: { ...result?.metadata },
      } as any;
      docs.push(new Document(doc));
    }

    return JSON.stringify(docs);
  },
  {
    name: "vector_db",
    description: "Call to retrieve data in vector db based on user documents",
    schema: z.object({
      query: z.string().describe("The query to use in your search."),
      noteId: z.string().describe("userId used to fetch data for this user"),
      userId: z.string().describe("noteId used to fetch data of a note"),
    }),
  },
);

export const searchTool = tool(
  async ({ query }) => {
    const searchTool = new SearchToolData("exa");
    const searchResult = await searchTool.invoke(query as string);
    return searchResult;
  },
  {
    name: "search",
    description: "Call to surf the web.",
    schema: z.object({
      query: z.string().describe("The query to use in your search."),
    }),
  },
);
