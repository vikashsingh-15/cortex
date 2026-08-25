import { NextFunction, Response, Request } from "express";
import { Source } from "@/app/models/sourceSchema";

export async function readAudio(req: Request, res: Response, next: NextFunction) {
  try {
    const range = req.headers.range;
    if (!range) return res.status(400).send("Requires Range header");

    const source = await Source.findOne({
      content: req.params.filename,
      source_type: "audio",
    }).select("+audioData +audioMimeType");
    if (!source?.audioData) return res.status(404).send("Audio not found");

    const audioSize = source.audioData.length;
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + 10 ** 6, audioSize - 1);
    if (start >= audioSize) return res.status(416).send("Requested range not satisfiable");

    const chunk = source.audioData.subarray(start, end + 1);
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${audioSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunk.length,
      "Content-Type": source.audioMimeType || "audio/mpeg",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Range",
    });
    return res.end(chunk);
  } catch (error) {
    next(error);
  }
}
