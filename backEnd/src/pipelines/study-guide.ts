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
import "dotenv/config"
import { Runnable } from "@langchain/core/runnables";

// // / Load documents from a webpage
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
// });

export async function generateStudyguide<T extends Runnable>(llm:T,splitDocs:Document[]){
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

// Root state
const OverallState = Annotation.Root({
  contents: Annotation<string[]>,

  // Each node returns chunks of study guide
  studyGuides: Annotation<string[]>({
    reducer: (state, update) => state.concat(update),
  }),
  collapsedStudyGuides: Annotation<Document[]>,
  finalStudyGuide: Annotation<string>(),
});

// State for a single chunk
interface StudyGuideState {
  content: string;
}

// Map: Generate study guide for a single chunk
const generateStudyGuideChunk = async (
  state: StudyGuideState
): Promise<{ studyGuides: string[] }> => {
  const mapPrompt = ChatPromptTemplate.fromMessages([
    [
      "user",
      `Create structured study notes for the following text. Include:
- Key concepts / definitions
- Examples or illustrations
- Important points
Format as bullet points:\n\n{context}`,
    ],
  ]);

  const prompt = await mapPrompt.invoke({ context: state.content });
  const response = await llm.invoke(prompt);

  return { studyGuides: [String(response.content)] };
};

// Map logic
const mapStudyGuides = (state: typeof OverallState.State) => {
  return state.contents.map(
    (content) => new Send("generateStudyGuideChunk", { content })
  );
};

// Collect all chunks into Documents
const collectStudyGuides = async (state: typeof OverallState.State) => {
  return {
    collapsedStudyGuides: state.studyGuides.map(
      (guide) => new Document({ pageContent: guide })
    ),
  };
};

function capAtSentenceBoundary(text: string, maxCharacters: number): string {
  if (text.length <= maxCharacters) return text.trim();

  const shortened = text.slice(0, maxCharacters);
  const sentenceEnd = Math.max(
    shortened.lastIndexOf(". "),
    shortened.lastIndexOf("! "),
    shortened.lastIndexOf("? "),
    shortened.lastIndexOf("\n"),
  );

  // Prefer a complete sentence, but do not discard most of the generated result.
  const safeEnd = sentenceEnd >= Math.floor(maxCharacters * 0.6)
    ? sentenceEnd + 1
    : maxCharacters;
  return shortened.slice(0, safeEnd).trim();
}

// Reduce function: distill multiple chunks into one.
// Every collapse must be at least 15% smaller, otherwise LangGraph can keep
// cycling through the collapse node without getting below the token limit.
async function reduceStudyGuides(input: Document[]) {
  const inputText = input.map((document) => document.pageContent).join("\n\n");
  const maxOutputCharacters = Math.max(600, Math.floor(inputText.length * 0.85));
  const reducePrompt = ChatPromptTemplate.fromMessages([
    [
      "user",
      `The following are study guide chunks:
{docs}
Distill these into a single cohesive study guide.
Maintain key concepts, examples, and main points.

Important: your answer must be at least 15% shorter than the input. Keep the
answer within approximately ${maxOutputCharacters} characters. Return only the
condensed study guide.`,
    ],
  ]);

  const prompt = await reducePrompt.invoke({ docs: input });
  const response = await llm.invoke(prompt);
  return capAtSentenceBoundary(String(response.content), maxOutputCharacters);
}

// Collapse node
const collapseStudyGuides = async (state: typeof OverallState.State) => {
  const docBatches = splitListOfDocs(
    state.collapsedStudyGuides,
    lengthFunction,
    tokenMax
  );
  const results = await Promise.all(
    docBatches.map((batch) => collapseDocs(batch, reduceStudyGuides)),
  );
  return { collapsedStudyGuides: results };
};

// Conditional check: should we collapse or generate final study guide
async function shouldCollapse(state: typeof OverallState.State) {
  const numTokens = await lengthFunction(state.collapsedStudyGuides);
  if (numTokens > tokenMax) {
    return "collapseStudyGuides";
  } else {
    return "generateFinalStudyGuide";
  }
}

// Final study guide
const generateFinalStudyGuide = async (state: typeof OverallState.State) => {
  const finalGuide = await reduceStudyGuides(state.collapsedStudyGuides);
  return { finalStudyGuide: finalGuide };
};

// Construct the LangGraph
const graph = new StateGraph(OverallState)
  .addNode("generateStudyGuideChunk", generateStudyGuideChunk)
  .addNode("collectStudyGuides", collectStudyGuides)
  .addNode("collapseStudyGuides", collapseStudyGuides)
  .addNode("generateFinalStudyGuide", generateFinalStudyGuide)
  .addConditionalEdges("__start__", mapStudyGuides, ["generateStudyGuideChunk"])
  .addEdge("generateStudyGuideChunk", "collectStudyGuides")
  .addConditionalEdges("collectStudyGuides", shouldCollapse, [
    "collapseStudyGuides",
    "generateFinalStudyGuide",
  ])
  .addConditionalEdges("collapseStudyGuides", shouldCollapse, [
    "collapseStudyGuides",
    "generateFinalStudyGuide",
  ])
  .addEdge("generateFinalStudyGuide", "__end__");

const app = graph.compile();

// Run the graph
let finalStudyGuide = null;

for await (const step of await app.stream(
  { contents: splitDocs.map((doc) => doc.pageContent) },
  { recursionLimit: 50 }
)) {
  if (step.hasOwnProperty("generateFinalStudyGuide")) {
    finalStudyGuide = step.generateFinalStudyGuide;
  }
}

// console.log("Final Study Guide:\n", finalStudyGuide);
return finalStudyGuide
}
