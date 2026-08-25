import {
  END,
  START,
  StateGraph,
  Annotation,
  MessagesAnnotation,
} from "@langchain/langgraph";

import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { PromptTemplate, ChatPromptTemplate } from "@langchain/core/prompts";
import z from "zod";
import zodToJsonSchema from "zod-to-json-schema";

import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { queryVectorDB } from "./retriever.ts";
import { reciprocalRankFusion } from "./RRF.ts";
import { formatDocumentsAsString } from "langchain/util/document";

import { Document } from "@langchain/core/documents";
import {
  extractMessage,
  generateResponseFormatter,
  gradeDocResponseFormater,
  questionResponseFormater,
  TranformResponseFormatter,
} from "./util/index.ts";
import {
  generate_question_prompt,
  grade_doc_prompt,
  response_generator_prompt,
  transform_query_prompt,
} from "./prompt/prompts.ts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { TavilySearch } from "@langchain/tavily";

// https://fireworks.ai/
const llm = new ChatFireworks({
  // model: "accounts/fireworks/models/deepseek-v3p1",
  model: "accounts/fireworks/models/kimi-k2p6",
  temperature: 0.7,
  apiKey: process.env.FIRE_WORKS_API_KEY,
});

// nextNode,retrievedDoc,filteredDoc,transformQuery
const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  nextNode: Annotation<string>({
    reducer: (previousVal, nextVal) => previousVal ?? nextVal ?? "",
  }),
  newQuery: Annotation<string>({
    reducer: (previousVal, nextVal) => previousVal ?? nextVal ?? "",
  }),
  retrievedDoc: Annotation<Document[]>({
    default: () => [],
    reducer: (previousVal, nextVal) => previousVal.concat(nextVal),
  }),

  generateQuestions: Annotation<Document[]>({
    default: () => [],
    reducer: (previousVal, nextVal) => previousVal.concat(nextVal),
  }),

  filteredDoc: Annotation<Document[]>({
    default: () => [],
    reducer: (previousVal, nextVal) => previousVal.concat(nextVal),
  }),
});

// Create the graph
const RetrieverNode = async (state: typeof StateAnnotation.State) => {
  const lastMessage = extractMessage(state, "human");
  const query = lastMessage?.content;

  const generateQuestionPromt = await generate_question_prompt.invoke({
    question: query,
  });

  const llmResult = await llm.invoke(
    [
      {
        role: "user",
        content: generateQuestionPromt.value,
      },
    ],
    questionResponseFormater,
  );

  const parsedResult = JSON.parse(llmResult?.content as string);

  const questions = parsedResult?.questions as string[];

  const allRetrievedDocs = [] as Document[][];

  for (const question of questions) {
    const result = await queryVectorDB(question);
    allRetrievedDocs.push(result);
  }

  const fusedDoc = reciprocalRankFusion(allRetrievedDocs) as Document[];

  return {
    retrievedDoc: fusedDoc,
    generateQuestions: questions,
  };
};
const gradeDocNode = async (state: typeof StateAnnotation.State) => {
  const lastMessage = extractMessage(state, "human");
  const allRetrievedDoc = state.retrievedDoc;

  const chain = grade_doc_prompt.pipe(llm);
  const allFilteredDoc = [] as Document[];

  for (const doc of allRetrievedDoc) {
    const chainResult = await chain.invoke(
      {
        question: lastMessage?.content,
        context: doc?.pageContent,
      },
      gradeDocResponseFormater as any,
    );

    const parsedResult = JSON.parse(chainResult?.content as string) as
      | "yes"
      | "no";

    if (parsedResult === "yes") {
      console.log("IS VALID DOC");
      allFilteredDoc.push(new Document({ pageContent: doc?.pageContent }));
    }
  }
  return {
    filteredDoc: allFilteredDoc,
  };
};

const transformQuery = async (state: typeof StateAnnotation.State) => {
  const lastMessage = extractMessage(state, "human");

  // Prompt
  const chain = transform_query_prompt.pipe(llm);
  //   .pipe(new StringOutputParser());

  const aiResponse = await chain.invoke(
    { question: lastMessage?.content },
    TranformResponseFormatter,
  );
  const newQuestion = JSON.parse(aiResponse?.content as string);
  return {
    newQuery: newQuestion?.question,
  };
};

const webSearch = async (state: typeof StateAnnotation.State) => {
  const tool = new TavilySearch({ apiKey: process.env.TAVILY_API_KEY });
  const docs = await tool.invoke({ query: state.newQuery });

  const webResult = docs?.results.map(
    (doc) =>
      new Document({
        pageContent: doc?.content,
        metadata: { title: doc?.title, url: doc?.url },
      }),
  );

  return {
    retrievedDoc: webResult,
  };
};

const generate = async (state: typeof StateAnnotation.State) => {
  const lastMessage = extractMessage(state, "human");

  const docToString = formatDocumentsAsString(state.retrievedDoc);

  const generatorResPrompt = await response_generator_prompt.invoke({
    original_question: lastMessage?.content,
    questions: state.generateQuestions.join(","),
    retrieved_docs: docToString,
  });

  const aiResponse = await llm.invoke(
    [
      {
        role: "user",
        content: generatorResPrompt.value,
      },
    ],
    generateResponseFormatter,
  );

  const result = JSON.parse(aiResponse?.content as string) as {
    reasoning: string;
    answer: string;
  };
  //

  console.log("AI REASONING  ::", result?.reasoning);

  return {
    messages: [new AIMessage(result?.answer)],
  };
};

const router = (state: typeof StateAnnotation.State) => {
  const filteredDocs = state.filteredDoc;
  if (filteredDocs.length === 0) {
    //no relevant doc find
    console.log("=====WE TRANFORM QUERY====");
    return "transformQuery";
  }

  return "generate";
};

const builder = new StateGraph(StateAnnotation)
  .addNode("RetrieverNode", RetrieverNode)
  .addNode("gradeDocNode", gradeDocNode)
  .addNode("generate", generate)
  .addNode("transformQuery", transformQuery)
  .addNode("webSearch", webSearch);

// Build graph
builder.addEdge(START, "RetrieverNode");
builder.addEdge("RetrieverNode", "gradeDocNode");
builder.addConditionalEdges("gradeDocNode", router);
builder.addEdge("transformQuery", "webSearch");
builder.addEdge("webSearch", "generate");
builder.addEdge("generate", END);

// Compile
const app = builder.compile();

const result = await app.invoke({
  messages: [new HumanMessage({ content: "What is prompt engineering" })],
});
console.log("Result  :: ", result);
