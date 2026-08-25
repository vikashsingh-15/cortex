import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, CheckCircle2, Globe2, Sparkles, Wrench } from "lucide-react";

type ResponseMetadata = {
  tools_called?: string[];
  library_used?: string[];
  external_sources?: string[];
  confidence?: "high" | "medium" | "low" | string;
};

function parseMetadata(value: string) {
  try {
    const parsed = JSON.parse(value) as ResponseMetadata;
    return Array.isArray(parsed.tools_called) || Array.isArray(parsed.library_used) || Array.isArray(parsed.external_sources) || Boolean(parsed.confidence)
      ? parsed
      : undefined;
  } catch {
    return parseLooseMetadata(value);
  }
}

function parseLooseMetadata(value: string): ResponseMetadata | undefined {
  const fields: ResponseMetadata = {};
  let fieldCount = 0;

  const readArray = (key: "tools_called" | "library_used" | "external_sources") => {
    const match = value.match(new RegExp(`(?:\\*\\*)?["']?${key}["']?\\s*:?(?:\\*\\*)?\\s*:?\\s*(\\[[^\\n]*\\])`, "i"));
    if (!match) return;
    try {
      const parsed = JSON.parse(match[1].replace(/'/g, '"'));
      if (Array.isArray(parsed)) {
        fields[key] = parsed.map(String);
        fieldCount += 1;
      }
    } catch {
      // Leave malformed values visible as normal Markdown.
    }
  };

  readArray("tools_called");
  readArray("library_used");
  readArray("external_sources");

  const confidence = value.match(/(?:\*\*)?["']?confidence["']?\s*:?(?:\*\*)?\s*:?\s*["']?([a-z]+)["']?/i)?.[1];
  if (confidence) {
    fields.confidence = confidence;
    fieldCount += 1;
  }

  return fieldCount >= 2 ? fields : undefined;
}

function splitResponseMetadata(content: string) {
  const trimmed = content.trim();
  const standaloneMetadata = parseMetadata(trimmed);
  if (standaloneMetadata) return { answer: "", metadata: standaloneMetadata };

  // Models may wrap the trace in either ```json or an unlabelled ``` fence.
  // Extract it wherever it appears so Markdown never renders it as source code.
  const fencedBlocks = Array.from(content.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/gi));
  for (const block of fencedBlocks) {
    const metadata = parseMetadata(block[1].trim());
    if (metadata) {
      const answer = `${content.slice(0, block.index)}${content.slice((block.index || 0) + block[0].length)}`
        .replace(/(?:^|\n)\s*\**metadata\**\s*:\s*$/i, "")
        .trim();
      return { answer, metadata };
    }
  }

  const labelledStart = content.search(/(?:^|\n)\s*\**metadata\**\s*:\s*/i);
  if (labelledStart >= 0) {
    const metadata = parseMetadata(content.slice(labelledStart).match(/\{[\s\S]*\}/)?.[0] || "");
    if (metadata) return { answer: content.slice(0, labelledStart).trim(), metadata };
  }

  // Some providers omit the surrounding braces and return Markdown-bold keys.
  const looseMetadataStart = content.search(/(?:^|\n)\s*(?:[-*]\s*)?(?:\*\*)?["']?(?:tools_called|library_used|external_sources|confidence)["']?/i);
  if (looseMetadataStart >= 0) {
    const metadata = parseLooseMetadata(content.slice(looseMetadataStart));
    if (metadata) return { answer: content.slice(0, looseMetadataStart).trim(), metadata };
  }

  const jsonStart = content.lastIndexOf("\n{");
  if (jsonStart >= 0) {
    const metadata = parseMetadata(content.slice(jsonStart).trim());
    if (metadata) return { answer: content.slice(0, jsonStart).trim(), metadata };
  }

  // Final safety net for metadata surrounded by extra prose or unusual spacing.
  const closingBrace = content.lastIndexOf("}");
  if (closingBrace >= 0) {
    const openingBraces = Array.from(content.matchAll(/\{/g)).map((match) => match.index || 0).reverse();
    for (const openingBrace of openingBraces) {
      const metadata = parseMetadata(content.slice(openingBrace, closingBrace + 1).trim());
      if (metadata) {
        const answer = `${content.slice(0, openingBrace)}${content.slice(closingBrace + 1)}`
          .replace(/```(?:json)?/gi, "")
          .replace(/(?:^|\n)\s*\**metadata\**\s*:\s*$/i, "")
          .trim();
        return { answer, metadata };
      }
    }
  }

  return { answer: content, metadata: undefined };
}

export function AiResponseContent({ content }: { content?: string }) {
  const { answer, metadata } = splitResponseMetadata(content || "");

  return (
    <>
      {answer && (
        <div className="break-words whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-100 [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-sky-300 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:p-3 [&_pre]:text-slate-900 dark:[&_pre]:bg-slate-950 dark:[&_pre]:text-slate-100 [&_code]:font-mono [&_code]:text-inherit">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ node, ...props }) => <h1 className="my-3 text-2xl font-bold text-slate-900 dark:text-white" {...props} />,
              h2: ({ node, ...props }) => <h2 className="my-3 text-xl font-semibold text-slate-800 dark:text-slate-100" {...props} />,
              h3: ({ node, ...props }) => <h3 className="my-2 text-base font-semibold text-slate-800 dark:text-slate-100" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
            }}
          >
            {answer}
          </ReactMarkdown>
        </div>
      )}
      {metadata && <ResponseMetadataCard metadata={metadata} />}
    </>
  );
}

function ResponseMetadataCard({ metadata }: { metadata: ResponseMetadata }) {
  const confidenceClass = metadata.confidence === "high"
    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
    : metadata.confidence === "low"
      ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200"
      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-100";

  return (
    <section className="my-4 overflow-hidden rounded-2xl border border-indigo-200/80 bg-white shadow-sm dark:border-indigo-400/20 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-indigo-50 via-violet-50 to-sky-50 px-4 py-3.5 dark:from-indigo-950/80 dark:via-violet-950/50 dark:to-sky-950/50">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-300/50 dark:bg-indigo-500 dark:shadow-none">
            <Sparkles size={17} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Response sources</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">How this answer was prepared</p>
          </div>
        </div>
        {metadata.confidence && (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${confidenceClass}`}>
            <CheckCircle2 size={13} />
            {metadata.confidence} confidence
          </span>
        )}
      </div>
      <div className="grid gap-3 border-t border-indigo-100 p-4 dark:border-slate-700 sm:grid-cols-3">
        <MetadataRow icon={<Wrench size={15} />} label="Tools used" values={metadata.tools_called} emptyText="No tools used" />
        <MetadataRow icon={<BookOpen size={15} />} label="Notebook sources" values={metadata.library_used} emptyText="No notebook sources" />
        <MetadataRow icon={<Globe2 size={15} />} label="Web sources" values={metadata.external_sources} emptyText="No external sources" />
      </div>
    </section>
  );
}

function MetadataRow({ icon, label, values, emptyText }: { icon: React.ReactNode; label: string; values?: string[]; emptyText: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/80">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-200">
        <span className="text-indigo-500 dark:text-indigo-300">{icon}</span>
        {label}
      </p>
      {values?.length ? <div className="flex flex-wrap gap-1.5">
        {values.map((value) => isUrl(value) ? (
          <a key={value} href={value} target="_blank" rel="noreferrer" className="max-w-full truncate rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-indigo-600 ring-1 ring-slate-200 transition hover:bg-indigo-50 hover:underline dark:bg-slate-900 dark:text-sky-300 dark:ring-slate-700">{formatExternalSource(value)}</a>
        ) : (
          <span key={value} className="max-w-full truncate rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700">{formatMetadataValue(value)}</span>
        ))}
      </div> : <p className="text-xs text-slate-400 dark:text-slate-300">{emptyText}</p>}
    </div>
  );
}

function isUrl(value: string) { return /^https?:\/\//i.test(value); }

function formatExternalSource(value: string) {
  try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return value; }
}

function formatMetadataValue(value: string) {
  const labels: Record<string, string> = { vector_db: "Vector database", user_library: "Notebook library", search: "Web search" };
  return labels[value] || value.replace(/_/g, " ");
}
