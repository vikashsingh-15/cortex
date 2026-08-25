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

//  const loader = new CheerioWebBaseLoader('https://lilianweng.github.io/posts/2023-03-15-prompt-engineering');
//     const docs = await loader.load();
//   const textSplitter = new RecursiveCharacterTextSplitter({
//     chunkSize: 1000,
//     chunkOverlap: 200,
//   });
//   const splitDocs = await textSplitter.splitDocuments(docs);

// // https://fireworks.ai/
// const llm = new ChatFireworks({
//     model: "accounts/fireworks/models/deepseek-v3p1",
//     temperature: 0.7,
//     apiKey: process.env.FIRE_WORKS_API_KEY,
// })

export async function generateSummary<T extends Runnable>(
  llm: T,
  splitDocs: Document[],
) {
  const tokenMax = 6000;

  function approximateTokens(text: string): number {
    // Roughly: 1 token ≈ 4 characters (English text)
    return Math.ceil(text.length / 4);
  }

  async function lengthFunction(documents: Document[]) {
    const tokenCounts = documents.map((doc) =>
      approximateTokens(doc.pageContent),
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

  const OverallState = Annotation.Root({
    contents: Annotation<string[]>,
    // Notice here we pass a reducer function.
    // This is because we want combine all the summaries we generate
    // from individual nodes back into one list. - this is essentially
    // the "reduce" part
    summaries: Annotation<string[]>({
      reducer: (state, update) => state.concat(update),
    }),
    collapsedSummaries: Annotation<Document[]>,
    finalSummary: Annotation<string>,
  });

  // This will be the state of the node that we will "map" all
  // documents to in order to generate summaries
  interface SummaryState {
    content: string;
  }

  // Here we generate a summary, given a document
  const generateSummary = async (
    state: SummaryState,
  ): Promise<{ summaries: string[] }> => {
    const mapPrompt = ChatPromptTemplate.fromMessages([
      ["user", "Write a concise summary of the following: \n\n{context}"],
    ]);
    const prompt = await mapPrompt.invoke({ context: state.content });
    const response = await llm.invoke(prompt);
    return { summaries: [String(response.content)] };
  };

  // Here we define the logic to map out over the documents
  // We will use this an edge in the graph
  const mapSummaries = (state: typeof OverallState.State) => {
    // We will return a list of `Send` objects
    // Each `Send` object consists of the name of a node in the graph
    // as well as the state to send to that node
    return state.contents.map(
      (content) => new Send("generateSummary", { content }),
    );
  };

  const collectSummaries = async (state: typeof OverallState.State) => {
    return {
      collapsedSummaries: state.summaries.map(
        (summary) => new Document({ pageContent: summary }),
      ),
    };
  };

  async function _reduce(input: Document[]) {
    const inputText = input.map((document) => document.pageContent).join("\n\n");
    const maxOutputCharacters = Math.max(800, Math.floor(inputText.length * 0.85));
    const reducePrompt = ChatPromptTemplate.fromMessages([
      [
        "user",
        `
The following is a set of summaries:
{docs}

Please distill these into a **final, consolidated summary** of the main themes.

⚡ **Instructions for the output**:
- Return the summary in **Markdown format**.
- Do not include a # title; the application displays the title separately.
- Start with ## Overview, then use ## headings for every other section. Each heading must be on its own line.
- Leave a blank line before and after every heading and list.
- Use bullet points (-) for factual details and key points. Do not leave bare labels such as "Architecture" or "Significance" without a Markdown heading.
- Emphasize important terms with **bold**.
- Keep it clear, concise, and well-structured.
- Make the result at least 15% shorter than the input and keep it within approximately ${maxOutputCharacters} characters.
`,
      ],
    ]);

    const prompt = await reducePrompt.invoke({ docs: input });
    const response = await llm.invoke(prompt);
    return capAtSentenceBoundary(String(response.content), maxOutputCharacters);
  }

  // Add node to collapse summaries
  const collapseSummaries = async (state: typeof OverallState.State) => {
    const docLists = splitListOfDocs(
      state.collapsedSummaries,
      lengthFunction,
      tokenMax,
    );
    const results = await Promise.all(
      docLists.map((docList) => collapseDocs(docList, _reduce)),
    );

    return { collapsedSummaries: results };
  };

  // This represents a conditional edge in the graph that determines
  // if we should collapse the summaries or not
  async function shouldCollapse(state: typeof OverallState.State) {
    let numTokens = await lengthFunction(state.collapsedSummaries);
    if (numTokens > tokenMax) {
      return "collapseSummaries";
    } else {
      return "generateFinalSummary";
    }
  }

  // Here we will generate the final summary
  const generateFinalSummary = async (state: typeof OverallState.State) => {
    const response = await _reduce(state.collapsedSummaries);
    return { finalSummary: response };
  };

  // Construct the graph
  const graph = new StateGraph(OverallState)
    .addNode("generateSummary", generateSummary)
    .addNode("collectSummaries", collectSummaries)
    .addNode("collapseSummaries", collapseSummaries)
    .addNode("generateFinalSummary", generateFinalSummary)

    .addConditionalEdges("__start__", mapSummaries, ["generateSummary"])
    .addEdge("generateSummary", "collectSummaries")
    .addConditionalEdges("collectSummaries", shouldCollapse, [
      "collapseSummaries",
      "generateFinalSummary",
    ])
    .addConditionalEdges("collapseSummaries", shouldCollapse, [
      "collapseSummaries",
      "generateFinalSummary",
    ])
    .addEdge("generateFinalSummary", "__end__");

  const app = graph.compile();

  // const finalSummary=await app.invoke(  { contents: splitDocs.map((doc) => doc.pageContent) },
  //   { recursionLimit: 10 })

  let finalSummary = null;

  for await (const step of await app.stream(
    { contents: splitDocs.map((doc) => doc.pageContent) },
    { recursionLimit: 10 },
  )) {
    if (step.hasOwnProperty("generateFinalSummary")) {
      finalSummary = step.generateFinalSummary;
    }
  }

  // console.log('Final sum : ',finalSummary)

  return finalSummary;
}
