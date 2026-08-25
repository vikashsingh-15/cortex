import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import z from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { SourceRepository } from "../notes/repository/SourceRepository";

type DialogueInput = {
  text: string;
  voiceId: string;
};

const MAX_DIALOGUE_CHARACTERS = 1800;

export async function generatePodCastFromBriefingDoc(props: {
  llm: ChatFireworks;
  context: string;
  title: string;
  userId: string;
  noteId: string;
  total_source: number;
}) {
  try {
    const { context, userId, noteId, total_source, title, llm } = props;

    if (!context?.trim()) {
      throw new Error(
        "No briefing document is available for the selected source.",
      );
    }

    console.log("Audio generation in progress...");

    const promptTemplate = ChatPromptTemplate.fromMessages([
      [
        "user",
        `You are a professional podcast scriptwriter.

Write a natural two-host audio overview from this briefing document:
---
{context}
---

Requirements:
- Create a 60 to 90 second conversation, not a five-minute conversation.
- Alternate the speakers naturally.
- Host 1 uses voiceId "Xb7hH8MSUJpSbSDYk0k2".
- Host 2 uses voiceId "pqHfZKP75CvOlQylNhV4".
- The combined length of every text field must be under 1,800 characters.
- Return exactly one JSON object and no Markdown:
{{"podcast":[{{"text":"...","voiceId":"..."}}]}}`,
      ],
    ]);

    const prompt = await promptTemplate.invoke({ context });
    const response = await llm.invoke(prompt, {
      response_format: {
        type: "json_object",
        schema: zodToJsonSchema(
          z.object({
            podcast: z.array(
              z.object({ text: z.string(), voiceId: z.string() }),
            ),
          }),
        ),
      },
    } as any);

    const { podcast } = parsePodcastResponse(response?.content);
    const inputs = fitDialogueToCharacterLimit(podcast);

    await generateAudio({ inputs, title, userId, noteId, total_source });
  } catch (error: any) {
    console.error("Audio overview generation failed:", error?.message || error);
    throw error;
  }
}

function parsePodcastResponse(content: unknown): { podcast: DialogueInput[] } {
  const text = typeof content === "string" ? content : "";
  const normalized = text
    .replace(/<think>[\s\S]*?<\/think>\s*/g, "")
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = normalized.indexOf("{");
  const end = normalized.lastIndexOf("}");

  if (start < 0 || end < start) {
    throw new Error("The AI did not return a valid podcast script.");
  }

  const parsed = JSON.parse(normalized.slice(start, end + 1));
  if (!Array.isArray(parsed?.podcast)) {
    throw new Error("The AI returned a podcast script in an invalid format.");
  }

  return { podcast: parsed.podcast };
}

function fitDialogueToCharacterLimit(inputs: unknown): DialogueInput[] {
  if (!Array.isArray(inputs)) {
    throw new Error("The podcast script contains no dialogue.");
  }

  let remaining = MAX_DIALOGUE_CHARACTERS;
  const dialogue: DialogueInput[] = [];

  for (const input of inputs) {
    if (remaining <= 0) break;

    const text = typeof input?.text === "string" ? input.text.trim() : "";
    const voiceId =
      typeof input?.voiceId === "string" ? input.voiceId.trim() : "";
    if (!text || !voiceId) continue;

    const clippedText = text.slice(0, remaining).trim();
    if (!clippedText) continue;

    dialogue.push({ text: clippedText, voiceId });
    remaining -= clippedText.length;
  }

  if (dialogue.length === 0) {
    throw new Error("The podcast script contains no usable dialogue.");
  }

  return dialogue;
}

async function generateAudio(props: {
  inputs: DialogueInput[];
  title: string;
  userId: string;
  noteId: string;
  total_source: number;
}) {
  const { inputs, userId, noteId, total_source, title } = props;

  if (!process.env.ELEVEN_LAB_API_KEY) {
    throw new Error("ELEVEN_LAB_API_KEY is not configured.");
  }

  const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVEN_LAB_API_KEY,
  });

  const audioStream = await elevenlabs.textToDialogue.convert(
    {
      inputs,
      modelId: "eleven_v3",
      outputFormat: "mp3_44100_128",
    },
    { timeoutInSeconds: 90 },
  );

  const chunks: Uint8Array[] = [];
  const reader = audioStream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const buffer = Buffer.concat(chunks);
  if (!buffer.length) {
    throw new Error("ElevenLabs returned an empty audio file.");
  }

  const filename = `audio-${Date.now()}.mp3`;
  try {
    const sourceRepo = SourceRepository.getInstance();
    await sourceRepo.createSource({
      userId,
      noteId,
      title,
      source_type: "audio",
      content: filename,
      audioData: buffer,
      audioMimeType: "audio/mpeg",
      total_source,
    });
  } catch (error) {
    throw error;
  }

  console.log("Podcast saved successfully");
}
