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
// });
export async function generateBriefingDoc<T extends Runnable>(llm:T,splitDocs:Document[]){
  
let tokenMax = 1000;

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

  // Each node returns chunks of briefing content
  briefingChunks: Annotation<string[]>({
    reducer: (state, update) => state.concat(update),
  }),
  collapsedBriefingChunks: Annotation<Document[]>,
  finalBriefingDoc: Annotation<string>(),
});

// State for a single chunk
interface BriefingState {
  content: string;
}

// Map: Generate briefing for a single chunk
const generateBriefingChunk = async (
  state: BriefingState
): Promise<{ briefingChunks: string[] }> => {
  const mapPrompt = ChatPromptTemplate.fromMessages([
    [
      "user",
      `Create a professional briefing document for the following text. 
Include:
- Summary of main ideas
- Key takeaways
- Actionable insights or recommendations
Format as concise, clear paragraphs:\n\n{context}`,
    ],
  ]);

  const prompt = await mapPrompt.invoke({ context: state.content });
  const response = await llm.invoke(prompt);

  return { briefingChunks: [String(response.content)] };
};

// Map logic
const mapBriefingChunks = (state: typeof OverallState.State) => {
  return state.contents.map(
    (content) => new Send("generateBriefingChunk", { content })
  );
};

// Collect all chunks into Documents
const collectBriefingChunks = async (state: typeof OverallState.State) => {
  return {
    collapsedBriefingChunks: state.briefingChunks.map(
      (chunk) => new Document({ pageContent: chunk })
    ),
  };
};

// Reduce function: distill multiple chunks into one briefing doc
async function reduceBriefingChunks(
  input: Document[],
  maxOutputTokens?: number,
) {
  const outputLimit = maxOutputTokens
    ? ` Keep the result at or below approximately ${maxOutputTokens} tokens. This is a strict size limit: prioritize the most important information and omit secondary detail.`
    : "";

  const reducePrompt = ChatPromptTemplate.fromMessages([
    [
      "user",
      `The following are briefing chunks:
{docs}
Distill these into a single cohesive briefing document.
Maintain main ideas, key takeaways, and actionable insights.${outputLimit}`,
    ],
  ]);

  const prompt = await reducePrompt.invoke({ docs: input });
  const response = await llm.invoke(prompt);
  return String(response.content);
}

function trimToTokenLimit(content: string, maxTokens: number) {
  const maxCharacters = maxTokens * 4;
  if (content.length <= maxCharacters) {
    return content;
  }

  const shortened = content.slice(0, maxCharacters);
  const lastBreak = Math.max(
    shortened.lastIndexOf("\n"),
    shortened.lastIndexOf(". "),
    shortened.lastIndexOf(" "),
  );

  return shortened.slice(0, Math.max(lastBreak, 1)).trim();
}

// Collapse node
const collapseBriefingChunks = async (state: typeof OverallState.State) => {
  const docBatches = splitListOfDocs(
    state.collapsedBriefingChunks,
    lengthFunction,
    tokenMax
  );
  const results = [];
  for (const batch of docBatches) {
    const batchTokens = await lengthFunction(batch);
    const targetTokens = Math.max(1, Math.floor(batchTokens * 0.75));

    const collapsed = await collapseDocs(batch, (docs) =>
      reduceBriefingChunks(docs, targetTokens),
    );

    // Models can exceed a requested output limit. Enforce the limit so each
    // pass is approximately 25% smaller and the graph always converges.
    results.push(
      new Document({
        pageContent: trimToTokenLimit(collapsed.pageContent, targetTokens),
        metadata: collapsed.metadata,
      }),
    );
  }
  return { collapsedBriefingChunks: results };
};

// Conditional check: should we collapse or generate final briefing doc
async function shouldCollapse(state: typeof OverallState.State) {
  const numTokens = await lengthFunction(state.collapsedBriefingChunks);
  if (numTokens > tokenMax) {
    return "collapseBriefingChunks";
  } else {
    return "generateFinalBriefingDoc";
  }
}

// Final briefing document
const generateFinalBriefingDoc = async (
  state: typeof OverallState.State
) => {
  const finalDoc = await reduceBriefingChunks(state.collapsedBriefingChunks);
  return { finalBriefingDoc: finalDoc };
};

// Construct the LangGraph
const graph = new StateGraph(OverallState)
  .addNode("generateBriefingChunk", generateBriefingChunk)
  .addNode("collectBriefingChunks", collectBriefingChunks)
  .addNode("collapseBriefingChunks", collapseBriefingChunks)
  .addNode("generateFinalBriefingDoc", generateFinalBriefingDoc)
  .addConditionalEdges("__start__", mapBriefingChunks, ["generateBriefingChunk"])
  .addEdge("generateBriefingChunk", "collectBriefingChunks")
  .addConditionalEdges("collectBriefingChunks", shouldCollapse, [
    "collapseBriefingChunks",
    "generateFinalBriefingDoc",
  ])
  .addConditionalEdges("collapseBriefingChunks", shouldCollapse, [
    "collapseBriefingChunks",
    "generateFinalBriefingDoc",
  ])
  .addEdge("generateFinalBriefingDoc", "__end__");

const app = graph.compile();

// Run the graph
let finalBriefingDoc = null;

for await (const step of await app.stream(
  { contents: splitDocs.map((doc) => doc.pageContent) },
  { recursionLimit: 50 }
)) {
  console.log(Object.keys(step));
  if (step.hasOwnProperty("generateFinalBriefingDoc")) {
    finalBriefingDoc = step.generateFinalBriefingDoc;
  }
}
return finalBriefingDoc

// console.log("Final Briefing Doc:\n", finalBriefingDoc);
}
