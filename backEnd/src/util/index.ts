import z from "zod";
import zodToJsonSchema from "zod-to-json-schema";


export function extractMessage(state:any,messageType:'ai'|'human'){
        const lastMessage = state.messages
    .filter((m:any) => m._getType() === messageType)
    .slice(-1)[0];
    return lastMessage
}


export const questionResponseFormater= {
    response_format: {
        type: "json_object",
        schema: zodToJsonSchema(
            z.object({
                questions: z.array(z.string())
            })
        )
    }
} as any




 export  const gradeDocResponseFormater= {
      response_format: {
        type: "json_object",
        schema: zodToJsonSchema(
          z
            .object({
              binaryScore: z
                .enum(["yes", "no"])
                .describe("Relevance score 'yes' or 'no'"),
            })
            .describe(
              "Grade the relevance of the retrieved documents to the question. Either 'yes' or 'no'."
            )
        ),
      },
    }



    
export const generateResponseFormatter =    {
      response_format: {
          type: "json_object",
          schema: zodToJsonSchema(
              z.object({
                reasoning: z.string(),
      answer: z.string()
              })
          )
      }
  } as any



 export const TranformResponseFormatter =  {
    response_format: {
        type: "json_object",
        schema: zodToJsonSchema(
            z.object({
                question: z.string()
            })
        )
    }
} as any


