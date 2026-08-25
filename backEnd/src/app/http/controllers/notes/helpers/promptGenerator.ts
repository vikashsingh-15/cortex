
       
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import "dotenv/config";
import zodToJsonSchema from "zod-to-json-schema";
import z from "zod";
import { Runnable } from "@langchain/core/runnables";

import { debounce } from "lodash";


export async function generatePrompt<T extends Runnable>(llm:T,title:string){
    

//      const prompt_image_generator= PromptTemplate.fromTemplate(`
// You are an expert prompt engineer for an AI image generator. Your task is to take the user's input, which is a document title, and create a single, concise prompt to generate a logo for it.

// The prompt you create must instruct the image generator to produce:
// * A **minimalist and modern vector icon** that visually represents the title.
// * The style should be **flat design** with clean, simple lines.
// * The final image must be **only the logo with a transparent background**.

// Your output should be the prompt itself, and nothing more.

// Here is the user's input: **{input}**`)

const prompt_image_name_generator = PromptTemplate.fromTemplate(`
You are an expert at selecting concise, emoji-style names for images based on a document title.

Task:
- Receive a single document title (variable {input}).
- Return exactly one emoji-style name suitable for an AI image generator.

Mandatory output rules:
- Output exactly one token or short phrase (one or two words maximum).
- Lowercase letters only. If two words, separate with a single space.
- No punctuation, no special characters, no quotes, no explanations, no extra text — output the name and nothing else.
- Never return the original title, long phrases, or fragments longer than a few characters of the title.

Selection rules (in order):
1. If the title clearly maps to a known object, symbol, or UI icon, return the most visually representative emoji name (examples below).
2. If the title is technical or acronym-heavy, map it to a simple visual metaphor (for example, RAG → robot, encryption → lock).
3. If multiple valid emoji names are plausible, choose the single most representative one.
4. If you cannot confidently map the title, pick one random name from the fallback list below (simulate a human choosing a plausible emoji).
5. Always return only the chosen emoji-style name.

Controlled fallback list (use one item from this list if unsure):
star book rocket lightbulb shield cloud robot server laptop phone gears tools bolt atom battery flame lock key globe calendar pencil folder megaphone heart checkmark clock map compass satellite database network electricity

Examples:
- Input: "RAG and generative AI" → Output: robot
- Input: "Overview of Retrieval-Augmented Generation (RAG)" → Output: robot
- Input: "What is RAG?" → Output: robot
- Input: "How to optimise a Nodejs app deploy on AWS Lambda" → Output: server
- Input: "Building a personal brand online" → Output: megaphone
- Input: "Cloud-native infrastructure" → Output: cloud
- Input: "Cybersecurity best practices" → Output: shield
- Input: "How to write a novel" → Output: book
- Input: "System design patterns" → Output: gears
- Input: "How to create a fusion reactor" → Output: electricity

Here is the user's input: **{input}**
`);




const chain=prompt_image_name_generator.pipe(llm)
const chainResult=await chain.invoke({
    input:title
},{
      response_format: {
          type: "json_object",
          schema: zodToJsonSchema(
              z.object({
                 emoji_name: z.string()
              })
          )
      }
  } as any)
const result=JSON.parse(chainResult?.content as string)
const emoji=result?.emoji_name
console.log('emoji_name : ',emoji)
return emoji
}

