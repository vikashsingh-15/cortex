
       
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts'

export const generate_question_prompt= PromptTemplate.fromTemplate(`
You are an AI search assistant. 
	The user asked: {question}

	Step back and consider this question more broadly:
	1. Reframe it in general terms.  
	2. Identify the main themes or dimensions involved.  
	3. Generate 5 diverse search queries that cover these dimensions, 
	   ensuring each query explores a different perspective or phrasing.      `)






export const response_generator_prompt= PromptTemplate.fromTemplate(`
    You are a thoughtful Step-Back Research Assistant.  

The user asked: "{original_question}"

We expanded this into several related queries to cover different perspectives:  
{questions}

We retrieved the following documents based on these queries:  
{retrieved_docs}

Your task:
1. Step back and consider the original question in a broad, general sense.  
2. Review the retrieved information across all queries carefully.  
3. Synthesize a single, coherent answer that directly addresses the user’s original question.  
4. If different queries highlight different aspects, integrate them into one clear explanation.  
5. Be concise, structured, and clear. When useful, cite or reference information from the retrieved docs.  
 `)



 export   const grade_doc_prompt = ChatPromptTemplate.fromTemplate(
    `You are a grader assessing relevance of a retrieved document to a user question.
  Here is the retrieved document:

  {context}

  Here is the user question: {question}

  If the document contains keyword(s) or semantic meaning related to the user question, grade it as relevant.
  Give a binary score 'yes' or 'no' score to indicate whether the document is relevant to the question.`
  );



  export  const transform_query_prompt = ChatPromptTemplate.fromTemplate(
      `You are generating a question that is well optimized for semantic search retrieval.
    Look at the input and try to reason about the underlying sematic intent / meaning.
    Here is the initial question:
    \n ------- \n
    {question} 
    \n ------- \n
    Return only the formulated improved question and nothing else `
    );
  