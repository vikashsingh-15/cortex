// // MiddlePannel.jsx
// import { useDispatch, useSelector } from "react-redux";
// import type { AppDispatch, RootState } from "@/stores";
// import { Copy, GitBranch, Loader2, Music2, NotebookTabs, SendHorizonal, Sparkles, ArrowDown } from "lucide-react";
// import { memo, useEffect, useRef, useState } from "react";
// import { Button } from "../ui/button";
// import { createBriefingDoc, createMindMap, createSummary, sendChatMessage, type chatHistoryType, type messageType, type questionAndDocOverviewType } from "@/api/notes";
// import { addMessageInChatHistory } from "@/store/chatHistorySlice";
// import type { NoteType } from "@/types/note-types";
// import { showError } from "@/util/toast-notification";
// import { fetchNoteSourceResult } from "@/store/rightPanelSlice";

// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import { SuggestedInput } from "./SuggestedInput";
// import { ChatInput } from "./ChatInput";

// const MiddlePannel = ({ chatHistory, userId, note, aiResult }: { chatHistory: chatHistoryType, userId: string, note: NoteType, aiResult: questionAndDocOverviewType }) => {
//     const { _id: noteId } = note
//     const dispatch = useDispatch<AppDispatch>();
//     const { middlePanelDefaultWidth } = useSelector((state: RootState) => state.chat);

//     const { docIds } = useSelector((state: RootState) => state.rightPanel);

//     const [inputValue, setInputValue] = useState("");
//     const [loading, setLoading] = useState(false);

//     const chatContainerRef = useRef<HTMLElement>(null);
//     const [showScrollButton, setShowScrollButton] = useState(false);

//     async function sendUserMessage({ newMessage }: { newMessage: messageType }) {
//         setLoading(true);
//         dispatch(addMessageInChatHistory(newMessage));

//         try {
//             const data = await sendChatMessage({
//                 userId,
//                 noteId,
//                 query: inputValue || newMessage.content,
//             });

//             if (!data?.message) {
//                 throw new Error("The server did not return a chat response.");
//             }

//             dispatch(addMessageInChatHistory(data.message));
//         } catch (error: any) {
//             showError(
//                 error?.error?.message ||
//                 error?.message ||
//                 "Unable to answer the question. Please try again."
//             );
//         } finally {
//             setLoading(false);
//             setTimeout(scrollToBottom, 100);
//         }
//     }

//     const sendMessage = async () => {
//         if (!inputValue.trim()) return;

//         const newMessage: messageType = {
//             role: "user",
//             content: inputValue,
//             userId, noteId
//         };

//         await sendUserMessage({ newMessage })

//     };

//     async function selectQuestion(question: string) {
//         const newMessage: messageType = {
//             role: "user",
//             content: question,
//             userId, noteId
//         };

//         await sendUserMessage({ newMessage })

//     }

//     const onKeyDownMessage = async (e) => {
//         if (e.key === "Enter" && !e.shiftKey) {
//             e.preventDefault();

//             const newMessage: messageType = {
//                 role: "user",
//                 content: inputValue,
//                 userId, noteId
//             };
//             setInputValue("");
//             await sendUserMessage({ newMessage })

//         }
//     };

//     const scrollToBottom = () => {
//         const container = chatContainerRef.current;
//         if (container) {
//             container.scrollTo({
//                 top: container.scrollHeight,
//                 behavior: "smooth",
//             });
//         }
//     };

//     useEffect(() => {
//         const container = chatContainerRef.current;
//         if (!container) return;

//         const handleScroll = () => {
//             const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
//             setShowScrollButton(!isAtBottom);
//         };

//         container.addEventListener("scroll", handleScroll);
//         return () => container.removeEventListener("scroll", handleScroll);
//     }, []);

//     return (
//         <div
//             style={{
//                 width: `${middlePanelDefaultWidth}%`,
//             }}
//             className={`bg-white transition-all duration-300 shadow-sm rounded-md h-full p-4 flex flex-col`}
//         >
//             {/* chat section */}
//             <div
//                 ref={chatContainerRef}
//                 className="relative flex-1 overflow-y-auto mb-4 space-y-3 pr-2"
//             >
//                 <div className="flex justify-between items-center mb-4 flex-shrink-0">
//                     <p className="text-base text-gray-800">Chat</p>
//                 </div>

//                 <hr className="mb-2" />

//                 <MiddlePanelHeader aiResult={aiResult} note={note} docIds={docIds} />

//                 {/* messages */}
//                 {/* {chatHistory?.chatHistory?.map((msg, index) => ChatMessage({ msg }))} */}

// {/* performance optimization */}
//                 {chatHistory?.chatHistory?.filter(Boolean).map((msg, index) => (
//                     <ChatMessage key={index} msg={msg} />
//                 ))}

//             </div>

//             {/* jump-to-bottom button */}
//             {showScrollButton && (
//                 <div className="flex justify-center mb-3">
//                     <button
//                         onClick={scrollToBottom}
//                         className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-md rounded-full px-4 py-1.5 flex items-center gap-2 transition-all"
//                     >
//                         <ArrowDown />
//                         <span className="text-sm font-medium">Jump to bottom</span>

//                     </button>
//                 </div>
//             )}

//             {/* bordered chat-input card */}
//             <div className="relative border border-gray-200 rounded-2xl p-3 bg-white">
//                 {/* main input row */}
//                 <div className="flex items-center gap-3">

//                     <ChatInput
//                         inputValue={inputValue}
//                         setInputValue={setInputValue}
//                         onKeyDownMessage={onKeyDownMessage}
//                     />

//                     <div className="text-xs text-gray-500 whitespace-nowrap">
//                         {docIds?.length} sources
//                     </div>

//                     <button
//                         onClick={sendMessage}
//                         disabled={loading}
//                         aria-label="Send"
//                         className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition
//             ${loading
//                                 ? "bg-indigo-400 cursor-not-allowed"
//                                 : "bg-indigo-500 hover:bg-indigo-600"
//                             }`}
//                         title="Send"
//                     >
//                         {loading ? (
//                             <Loader2 className="animate-spin text-white" size={18} />
//                         ) : (
//                             <SendHorizonal className="text-white" size={16} />
//                         )}
//                     </button>
//                 </div>

//             </div>
//             <SuggestedInput selectQuestion={selectQuestion} questions={aiResult?.aiResult?.questions} />
//         </div>
//     );

// };

// const MiddlePanelHeader = ({ note, docIds, aiResult }: { note: NoteType, docIds: string[], aiResult: questionAndDocOverviewType }) => {

//     const [audioLoading, setAudioLoading] = useState(false);
//     const [summaryLoading, setSummaryLoading] = useState(false);
//     const [mindMapLoading, setMindMapLoading] = useState(false);

//     const dispatch = useDispatch<AppDispatch>();
//     async function generateSummary() {
//         if (docIds.length > 0) {
//             setSummaryLoading(true)
//             await createSummary(note?._id, docIds);
//             setSummaryLoading(false)

//         } else {
//             showError("Please select a source");
//         }

//     }
//     async function generateMindMap() {

//         if (docIds.length > 0) {
//             setMindMapLoading(true)
//             await createMindMap(note?._id, docIds)
//             setMindMapLoading(false)
//             dispatch(fetchNoteSourceResult(note?._id))

//         } else {
//             showError("Please select a source");
//         }

//     }

//     async function generateAudio() {
//         if (docIds.length > 0) {
//             try {
//                 setAudioLoading(true);

//                 await createBriefingDoc(note?._id, docIds, 'audio')
//                 dispatch(fetchNoteSourceResult(note?._id))

//                 setAudioLoading(false);

//             } catch (error) {
//                 setAudioLoading(false);

//             }
//         } else {
//             showError("Please select a source");
//         }
//     }

//     return (<div className="mb-3">
//         <div>
//             <span style={{ fontSize: "4rem" }}>
//                 {note?.image}
//             </span>

//         </div>
//         <div className="mb-4">
//             <p className="text-3xl mb-2">{note?.title}</p>
//             <p className="text-sm">{docIds?.length} sources</p>
//             <p className="py-2 text-sm  bg-gray-10 text-gray-800 mb-4  ">
//                 {aiResult?.aiResult?.doc_overview}
//             </p>
//             <p>
//                 <Button
//                     variant="outline"
//                 >
//                     <Copy size={18} />

//                 </Button>
//             </p>

//         </div>

//         <div className="flex gap-4 mb-6 justify-between">
//             <div>
//                 <Button
//                     disabled={summaryLoading}
//                     onClick={generateSummary}
//                     variant="outline"
//                     className="rounded-3xl px-5 py-4 w-45 text-gray-500 "
//                 >

//                     {summaryLoading ? (
//                         <Loader2 className="animate-spin" size={18} />
//                     ) : (
//                         <NotebookTabs className="text-yellow-500" size={18} />
//                     )}
//                     <span className="text-sm">Summary</span>
//                 </Button>
//             </div>
//             <div>
//                 <Button
//                     disabled={mindMapLoading}
//                     onClick={generateMindMap}
//                     variant="outline"
//                     className="rounded-3xl px-5 py-4 w-45 text-gray-500 "
//                 >

//                     {mindMapLoading ? (
//                         <Loader2 className="animate-spin" size={18} />
//                     ) : (
//                         <GitBranch className="text-indigo-500" />

//                     )}

//                     <span className="text-sm">MindMap</span>
//                 </Button>
//             </div>
//             <div>
//                 <Button
//                     disabled={audioLoading}
//                     onClick={generateAudio}
//                     variant="outline"
//                     className="rounded-3xl px-5 py-4 w-45 text-gray-500 "
//                 >
//                     {audioLoading ? (
//                         <Loader2 className="animate-spin" size={18} />
//                     ) : (

//                         <Music2 size={18} className=" text-green-400" />

//                     )}

//                     <span className="text-sm">Audio Overview</span>
//                 </Button>
//             </div>

//         </div>

//     </div>);
// }

// type Msg = { role: "ai" | "user"; content: string };

// const  ChatMessage=memo(({ msg }: { msg?: Msg }) =>{
//     if (!msg) return null;

//     return (
//         <div className={`flex ${msg?.role === "ai" ? "justify-start" : "justify-end"}`}>
//             <div
//                 className={`
//           max-w-[90%] px-4 text-sm
//           ${msg.role === "ai"
//                         ? "text-gray-800 py-2"
//                         : "bg-indigo-100 text-gray-900 py-4 rounded-br-none shadow rounded-2xl"}
//         `}
//             >
//                 <div
//                     className="
//             break-words whitespace-pre-wrap
//             overflow-x-hidden
//             leading-normal

//             [&_a]:underline [&_a]:text-blue-600
//             [&_pre]:my-1 [&_pre]:p-1 [&_pre]:rounded [&_pre]:bg-gray-100 [&_pre]:overflow-x-auto [&_code]:font-mono
//           "
//                 >
//                     <ReactMarkdown
//                         remarkPlugins={[remarkGfm]}
//                         components={{
//                             a: ({ node, ...props }) => <a {...props} />,
//                             ul: ({ node, ...props }) => (
//                                 <ul className="list-disc list-inside space-y-0" {...props} />
//                             ),
//                             ol: ({ node, ...props }) => (
//                                 <ol {...props} />
//                             ),
//                             li: ({ node, ...props }) => (
//                                 <li style={{ marginBottom: '-16px' }} {...props} />
//                             ),
//                             p: ({ node, ...props }) => (
//                                 <p style={{ marginBottom: msg.role === "ai" ? '0px' : '' }} {...props} />
//                             ),

//                             h1: ({ node, ...props }) => <h1 style={{ marginBottom: '-20px' }} className="text-2xl  font-bold text-gray-800 my-" {...props} />,
//                             h2: ({ node, ...props }) => <h2 style={{ marginBottom: '-20px' }} className="text-xl font-semibold text-gray-700 my-" {...props} />,
//                             h3: ({ node, ...props }) => <h2 style={{ marginBottom: '-20px' }} className="text-xl font-semibold text-gray-700 my-" {...props} />,

//                             strong: ({ node, ...props }) => <strong className="font-bold text-gray-700" {...props} />,

//                         }}
//                     >
//                         {msg.content}
//                     </ReactMarkdown>
//                 </div>
//             </div>
//         </div>
//     );
// })

// export default MiddlePannel;

//way 2

// MiddlePannel.jsx
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/stores";
import {
  BookOpen,
  Loader2,
  SendHorizonal,
  ArrowDown,
} from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import {
  sendChatMessage,
  type chatHistoryType,
  type messageType,
  type questionAndDocOverviewType,
} from "@/api/notes";
import { addMessageInChatHistory } from "@/store/chatHistorySlice";
import type { NoteType } from "@/types/note-types";
import { showError } from "@/util/toast-notification";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SuggestedInput } from "./SuggestedInput";
import { ChatInput } from "./ChatInput";

const MiddlePannel = ({
  chatHistory,
  userId,
  note,
  aiResult,
}: {
  chatHistory: chatHistoryType;
  userId: string;
  note: NoteType;
  aiResult: questionAndDocOverviewType;
}) => {
  const { _id: noteId } = note;
  const dispatch = useDispatch<AppDispatch>();
  const { middlePanelDefaultWidth } = useSelector(
    (state: RootState) => state.chat,
  );
  const { docIds } = useSelector((state: RootState) => state.rightPanel);

  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const chatContainerRef = useRef<HTMLElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  async function sendUserMessage({ newMessage }: { newMessage: messageType }) {
    setLoading(true);
    dispatch(addMessageInChatHistory(newMessage));

    try {
      const data = await sendChatMessage({
        userId,
        noteId,
        query: inputValue || newMessage.content,
      });

      if (!data?.message) {
        throw new Error("The server did not return a chat response.");
      }

      dispatch(addMessageInChatHistory(data.message));
    } catch (error: any) {
      showError(
        error?.error?.message ||
          error?.message ||
          "Unable to answer the question. Please try again.",
      );
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage: messageType = {
      role: "user",
      content: inputValue,
      userId,
      noteId,
    };

    await sendUserMessage({ newMessage });
  };

  async function selectQuestion(question: string) {
    const newMessage: messageType = {
      role: "user",
      content: question,
      userId,
      noteId,
    };

    await sendUserMessage({ newMessage });
  }

  const onKeyDownMessage = async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      const newMessage: messageType = {
        role: "user",
        content: inputValue,
        userId,
        noteId,
      };
      setInputValue("");
      await sendUserMessage({ newMessage });
    }
  };

  const scrollToBottom = () => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isAtBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 50;
      setShowScrollButton(!isAtBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      style={{
        width: `${middlePanelDefaultWidth}%`,
      }}
      className={`bg-white transition-all duration-300 shadow-sm rounded-md h-full min-h-0 p-4 flex flex-col`}
    >
      {/* chat section */}
      <div
        ref={chatContainerRef}
        className="relative min-h-0 flex-1 overflow-y-auto mb-4 space-y-3 pr-2"
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <p className="text-base text-gray-800">Chat</p>
        </div>

        <hr className="mb-2" />

        <MiddlePanelHeader aiResult={aiResult} note={note} />

        {/* messages */}
        {/* {chatHistory?.chatHistory?.map((msg, index) => ChatMessage({ msg }))} */}

        {/* performance optimization */}
        {chatHistory?.chatHistory?.filter(Boolean).map((msg, index) => (
          <ChatMessage key={index} msg={msg} />
        ))}
      </div>

      {/* jump-to-bottom button */}
      {showScrollButton && (
        <div className="flex justify-center mb-3">
          <button
            onClick={scrollToBottom}
            className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-md rounded-full px-4 py-1.5 flex items-center gap-2 transition-all"
          >
            <ArrowDown />
            <span className="text-sm font-medium">Jump to bottom</span>
          </button>
        </div>
      )}

      {/* bordered chat-input card */}
      <div className="relative border border-gray-200 rounded-2xl p-3 bg-white">
        {/* main input row */}
        <div className="flex items-center gap-3">
          <ChatInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            onKeyDownMessage={onKeyDownMessage}
          />

          <div className="text-xs text-gray-500 whitespace-nowrap">
            {docIds?.length} sources
          </div>

          <button
            onClick={sendMessage}
            disabled={loading}
            aria-label="Send"
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition 
            ${
              loading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-500 hover:bg-indigo-600"
            }`}
            title="Send"
          >
            {loading ? (
              <Loader2 className="animate-spin text-white" size={18} />
            ) : (
              <SendHorizonal className="text-white" size={16} />
            )}
          </button>
        </div>
      </div>
      <SuggestedInput
        selectQuestion={selectQuestion}
        questions={aiResult?.aiResult?.questions}
      />
    </div>
  );
};

const MiddlePanelHeader = ({ note, aiResult }: { note: NoteType; aiResult: questionAndDocOverviewType }) => {
  const sourceCount = note?.docs?.length ?? 0;
  const overview = simplifyOverview(aiResult?.aiResult?.doc_overview);
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const hasLongOverview = overview.length > 260;

  useEffect(() => {
    setOverviewExpanded(false);
  }, [note?._id]);

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50/40 p-5 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300">
          <BookOpen size={21} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{note?.title || "Untitled notebook"}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">{sourceCount} {sourceCount === 1 ? "source" : "sources"}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-200/80 pt-4 dark:border-slate-700">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-200">About this notebook</p>
        <p className={`mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-100 ${overviewExpanded ? "" : "line-clamp-3"}`}>
          {overview || "Add a source to start exploring this notebook."}
        </p>
        {hasLongOverview && (
          <button
            type="button"
            onClick={() => setOverviewExpanded((expanded) => !expanded)}
            className="mt-2 text-sm font-medium text-indigo-600 transition hover:text-indigo-700 hover:underline dark:text-indigo-300 dark:hover:text-indigo-200"
          >
            {overviewExpanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>
    </section>
  );
};

function simplifyOverview(overview?: string) {
  if (!overview) return "";

  const plainText = overview
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  return plainText;
}

type Msg = { role: "ai" | "user"; content: string };

type ResponseMetadata = {
  tools_called?: string[];
  library_used?: string[];
  external_sources?: string[];
  confidence?: "high" | "medium" | "low" | string;
};

function splitResponseMetadata(content: string) {
  const metadataStart = content.search(/(?:^|\n)\s*\**metadata\**\s*:\s*/i);
  if (metadataStart === -1) return { answer: content, metadata: undefined };

  const metadataSection = content.slice(metadataStart);
  const metadataText = metadataSection.match(/\{[\s\S]*\}/)?.[0];
  if (!metadataText) return { answer: content, metadata: undefined };

  try {
    const metadata = JSON.parse(metadataText) as ResponseMetadata;
    if (!Array.isArray(metadata.tools_called) && !metadata.confidence) {
      return { answer: content, metadata: undefined };
    }

    return { answer: content.slice(0, metadataStart).trim(), metadata };
  } catch {
    return { answer: content, metadata: undefined };
  }
}

const ChatMessage = memo(({ msg }: { msg?: Msg }) => {
  if (!msg) return null;
  const { answer, metadata } = msg.role === "ai"
    ? splitResponseMetadata(msg.content)
    : { answer: msg.content, metadata: undefined };

  return (
    <div
      className={`flex ${msg?.role === "ai" ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`
          max-w-[90%] px-4 text-sm
          ${
            msg.role === "ai"
              ? "text-gray-800 py-2"
              : "bg-indigo-100 text-gray-900 py-4 rounded-br-none shadow rounded-2xl"
          }
        `}
      >
        <div
          className="
            break-words whitespace-pre-wrap
            overflow-x-hidden
            leading-normal
           
            [&_a]:underline [&_a]:text-blue-600
            [&_pre]:my-1 [&_pre]:p-1 [&_pre]:rounded [&_pre]:bg-gray-100 [&_pre]:overflow-x-auto [&_code]:font-mono
          "
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, ...props }) => <a {...props} />,
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside space-y-0" {...props} />
              ),
              ol: ({ node, ...props }) => <ol {...props} />,
              li: ({ node, ...props }) => (
                <li style={{ marginBottom: "-16px" }} {...props} />
              ),
              p: ({ node, ...props }) => (
                <p
                  style={{ marginBottom: msg.role === "ai" ? "0px" : "" }}
                  {...props}
                />
              ),

              h1: ({ node, ...props }) => (
                <h1
                  style={{ marginBottom: "-20px" }}
                  className="text-2xl  font-bold text-gray-800 my-"
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2
                  style={{ marginBottom: "-20px" }}
                  className="text-xl font-semibold text-gray-700 my-"
                  {...props}
                />
              ),
              h3: ({ node, ...props }) => (
                <h2
                  style={{ marginBottom: "-20px" }}
                  className="text-xl font-semibold text-gray-700 my-"
                  {...props}
                />
              ),

              strong: ({ node, ...props }) => (
                <strong className="font-bold text-gray-700" {...props} />
              ),
            }}
          >
            {answer}
          </ReactMarkdown>
        </div>
        {metadata && <ResponseMetadataCard metadata={metadata} />}
      </div>
    </div>
  );
});

function ResponseMetadataCard({ metadata }: { metadata: ResponseMetadata }) {
  const confidenceClass = metadata.confidence === "high"
    ? "bg-emerald-50 text-emerald-700"
    : metadata.confidence === "low"
      ? "bg-amber-50 text-amber-700"
      : "bg-slate-100 text-slate-600";

  return (
    <details open className="mt-4 overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50/40 text-xs text-slate-600">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 bg-white/60 px-3 py-2.5 font-medium marker:hidden">
        <span className="text-slate-700">Answer details</span>
        {metadata.confidence && <span className={`rounded-full px-2 py-0.5 capitalize ${confidenceClass}`}>{metadata.confidence} confidence</span>}
      </summary>
      <div className="space-y-3 border-t border-indigo-100 px-3 py-3">
        <MetadataRow label="Tools used" values={metadata.tools_called} emptyText="No tools recorded" />
        <MetadataRow label="Notebook sources" values={metadata.library_used} emptyText="No notebook sources recorded" />
        <MetadataRow label="External sources" values={metadata.external_sources} emptyText="None" />
      </div>
    </details>
  );
}

function MetadataRow({ label, values, emptyText }: { label: string; values?: string[]; emptyText: string }) {
  return (
    <div>
      <p className="mb-1 font-semibold text-slate-500">{label}</p>
      {values?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value) => isUrl(value) ? (
            <a key={value} href={value} target="_blank" rel="noreferrer" className="max-w-full truncate rounded-md bg-white px-2 py-1 text-indigo-600 ring-1 ring-indigo-100 transition hover:bg-indigo-50 hover:underline">
              {formatExternalSource(value)}
            </a>
          ) : (
            <span key={value} className="max-w-full truncate rounded-md bg-white px-2 py-1 text-slate-700 ring-1 ring-slate-200">{formatMetadataValue(value)}</span>
          ))}
        </div>
      ) : <p className="text-slate-400">{emptyText}</p>}
    </div>
  );
}

function isUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function formatExternalSource(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function formatMetadataValue(value: string) {
  const labels: Record<string, string> = {
    vector_db: "Vector database",
    user_library: "Notebook library",
    search: "Web search",
  };
  return labels[value] || value.replace(/_/g, " ");
}

export default MiddlePannel;
