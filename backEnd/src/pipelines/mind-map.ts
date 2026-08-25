import "dotenv/config";
import { PromptTemplate } from "@langchain/core/prompts";
import { Runnable } from "@langchain/core/runnables";
import z from "zod";
import zodToJsonSchema from "zod-to-json-schema";

const MindElixirNode = z.object({
  id: z.string(),
  topic: z.string(),
  children: z.array(
    z.object({
      id: z.string(),
      topic: z.string(),
      children: z.array(
        z.object({
          id: z.string(),
          topic: z.string(),
          children: z.array(z.any()).optional(),
        }),
      ).optional(),
    }),
  ).optional(),
});

const MindElixirData = z.object({ nodeData: MindElixirNode });

export async function generateMindMap<T extends Runnable>(llm: T, studyguide: string) {
  const prompt = PromptTemplate.fromTemplate(`
Create one concise, accurate mind map from the study guide below.

Return valid MindElixir JSON only. Use this exact outer structure:
{{
  "nodeData": {{
    "id": "root",
    "topic": "Main topic",
    "children": []
  }}
}}

Rules:
- Create 3 to 6 main branches and no more than 3 levels in total.
- Use short labels of 1 to 5 words.
- Keep only important concepts and relationships; do not add questions, evaluations, explanations, or text outside JSON.
- Give every node a unique string id.

Study guide:
{study_guide_text}
`);

  let response;

  try {
    response = await prompt.pipe(llm).invoke(
      { study_guide_text: studyguide },
      {
        response_format: {
          type: "json_object",
          schema: zodToJsonSchema(MindElixirData),
        },
      } as any,
    );
  } catch {
    // Some Fireworks models do not support response_format. The prompt still
    // requires JSON, so retry without that optional provider-specific setting.
    response = await prompt.pipe(llm).invoke({ study_guide_text: studyguide });
  }

  const rawContent = String(response.content).trim();
  const jsonContent = rawContent
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let result: unknown;
  try {
    result = JSON.parse(jsonContent);
  } catch {
    throw new Error("The AI returned an invalid mind map. Please try again.");
  }

  const parsedMindMap = MindElixirData.safeParse(result);
  if (!parsedMindMap.success) {
    throw new Error("The AI returned an incomplete mind map. Please try again.");
  }

  return JSON.stringify(parsedMindMap.data, null, 2);
}
