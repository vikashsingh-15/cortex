import {
  collapseDocs,
  splitListOfDocs,
} from "langchain/chains/combine_documents/reduce";
import { Document } from "@langchain/core/documents";
import { StateGraph, Annotation, Send } from "@langchain/langgraph";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import "dotenv/config";
import { Runnable } from "@langchain/core/runnables";

// // Load documents from a webpage
// const loader = new CheerioWebBaseLoader(
//   "https://lilianweng.github.io/posts/2023-03-15-prompt-engineering"
// );
// const docs = await loader.load();

// // Split into chunks
// const textSplitter = new RecursiveCharacterTextSplitter({
//   chunkSize: 1000,
//   chunkOverlap: 200,
// });
// const splitDocs = await textSplitter.splitDocuments(docs);

// // LLM
// const llm = new ChatFireworks({
//   model: "accounts/fireworks/models/deepseek-v3p1",
//   temperature: 0.7,
//   apiKey: process.env.FIRE_WORKS_API_KEY,
// });e


export async function generateFAQ<T extends Runnable>(llm:T,splitDocs:Document[]){
  
const tokenMax = 6000;

// Approximate token counter
function approximateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function lengthFunction(documents: Document[]) {
  const tokenCounts = documents.map((doc) =>
    approximateTokens(doc.pageContent)
  );
  return tokenCounts.reduce((sum, count) => sum + count, 0);
}

function capAtSentenceBoundary(text: string, maxCharacters: number) {
  if (text.length <= maxCharacters) return text.trim();
  const shortened = text.slice(0, maxCharacters);
  const sentenceEnd = Math.max(
    shortened.lastIndexOf(". "),
    shortened.lastIndexOf("! "),
    shortened.lastIndexOf("? "),
    shortened.lastIndexOf("\n"),
  );
  const safeEnd = sentenceEnd >= Math.floor(maxCharacters * 0.6)
    ? sentenceEnd + 1
    : maxCharacters;
  return shortened.slice(0, safeEnd).trim();
}

// Root state
const OverallState = Annotation.Root({
  contents: Annotation<string[]>,

  // Each node returns chunks of FAQs
  faqChunks: Annotation<string[]>({
    reducer: (state, update) => state.concat(update),
  }),
  collapsedFAQChunks: Annotation<Document[]>(),
  finalFAQ: Annotation<string>(),
});

// State for a single chunk
interface FAQState {
  content: string;
}

// Map: Generate FAQ for a single chunk
const generateFAQChunk = async (
  state: FAQState
): Promise<{ faqChunks: string[] }> => {
  const mapPrompt = ChatPromptTemplate.fromMessages([
    [
      "user",
      `Create a set of FAQs (questions and answers) from the following text. 
Each FAQ should include:
- A clear question
- A concise, accurate answer
Format as a list of Q&A:\n\n{context}`,
    ],
  ]);

  const prompt = await mapPrompt.invoke({ context: state.content });
  const response = await llm.invoke(prompt);

  return { faqChunks: [String(response.content)] };
};

// Map logic
const mapFAQChunks = (state: typeof OverallState.State) => {
  return state.contents.map(
    (content) => new Send("generateFAQChunk", { content })
  );
};

// Collect all chunks into Documents
const collectFAQChunks = async (state: typeof OverallState.State) => {
  return {
    collapsedFAQChunks: state.faqChunks.map(
      (chunk) => new Document({ pageContent: chunk })
    ),
  };
};

// Reduce function: distill multiple chunks into one FAQ doc
async function reduceFAQChunks(input: Document[]) {
  const inputText = input.map((document) => document.pageContent).join("\n\n");
  const maxOutputCharacters = Math.max(800, Math.floor(inputText.length * 0.85));
  const reducePrompt = ChatPromptTemplate.fromMessages([
    [
      "user",
      `The following are FAQ chunks:
{docs}
Merge and refine them into a single cohesive FAQ document.
Ensure clarity, remove duplicates, and keep only useful questions with accurate answers.
Make the result at least 15% shorter than the input and keep it within approximately ${maxOutputCharacters} characters.`,
    ],
  ]);

  const prompt = await reducePrompt.invoke({ docs: input });
  const response = await llm.invoke(prompt);
  return capAtSentenceBoundary(String(response.content), maxOutputCharacters);
}

// Collapse node
const collapseFAQChunks = async (state: typeof OverallState.State) => {
  const docBatches = splitListOfDocs(
    state.collapsedFAQChunks,
    lengthFunction,
    tokenMax
  );
  const results = await Promise.all(
    docBatches.map((batch) => collapseDocs(batch, reduceFAQChunks)),
  );
  return { collapsedFAQChunks: results };
};

// Conditional check: should we collapse or generate final FAQ doc
async function shouldCollapse(state: typeof OverallState.State) {
  const numTokens = await lengthFunction(state.collapsedFAQChunks);
  if (numTokens > tokenMax) {
    return "collapseFAQChunks";
  } else {
    return "generateFinalFAQ";
  }
}

// Final FAQ document
const generateFinalFAQ = async (state: typeof OverallState.State) => {
  const finalFAQ = await reduceFAQChunks(state.collapsedFAQChunks);
  return { finalFAQ };
};

// Construct the LangGraph
const graph = new StateGraph(OverallState)
  .addNode("generateFAQChunk", generateFAQChunk)
  .addNode("collectFAQChunks", collectFAQChunks)
  .addNode("collapseFAQChunks", collapseFAQChunks)
  .addNode("generateFinalFAQ", generateFinalFAQ)
  .addConditionalEdges("__start__", mapFAQChunks, ["generateFAQChunk"])
  .addEdge("generateFAQChunk", "collectFAQChunks")
  .addConditionalEdges("collectFAQChunks", shouldCollapse, [
    "collapseFAQChunks",
    "generateFinalFAQ",
  ])
  .addConditionalEdges("collapseFAQChunks", shouldCollapse, [
    "collapseFAQChunks",
    "generateFinalFAQ",
  ])
  .addEdge("generateFinalFAQ", "__end__");

const app = graph.compile();

// Run the graph
let finalFAQ = null;

for await (const step of await app.stream(
  { contents: splitDocs.map((doc) => doc.pageContent) },
  { recursionLimit: 10 }
)) {
  if (step.hasOwnProperty("generateFinalFAQ")) {
    finalFAQ = step.generateFinalFAQ;
  }
}

// console.log("Final FAQ:\n", finalFAQ);

return finalFAQ

}
