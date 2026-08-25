
import { PanelRight, Sparkles, GitBranch, FileText, Star, HelpCircle, Pencil, NotepadText, AwardIcon, Music2 } from "lucide-react";
import { Button } from "../ui/button";
import { useDispatch, useSelector } from "react-redux";
import { addExtraWidth, reduceExtraWidth, toggleRightPanel } from "@/store/chatSlice";
import './animate.css'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@radix-ui/react-checkbox";
import { createBriefingDoc, createFAQ, createMindMap, createStudyGuide, createSummary } from "@/api/notes";
import type { AppDispatch, RootState } from "@/store";
import { showError } from "@/util/toast-notification";
import { useEffect, useState } from "react";
import { fetchNoteSourceResult, closeSourceModal, showSourceModalContent } from "@/store/rightPanelSlice";
import { truncateTitle } from "@/util/truncateTitle";
import { SourceModal } from "../note/rightpanel/SourceModal";
import MindMapSourceModal from "../note/rightpanel/MindMapSourceModal";
import AudioSection from "./AudioSection";
import { apiUrl } from "@/config/get-env";

const RightPanel = ({ noteId }: { noteId?: string }) => {

  const dispatch = useDispatch<AppDispatch>();
  const { rightPanelOpen } = useSelector((state: RootState) => state.chat);
  const { docIds, sources, sourceModal, audioCard } = useSelector((state: RootState) => state.rightPanel);



  function showSourceModal(source: any) {
    dispatch(showSourceModalContent(source))
  }
  function fetchSources() {
    dispatch(fetchNoteSourceResult(noteId))

  }


  function togglePanel() {
    if (rightPanelOpen) {
      dispatch(addExtraWidth())
      dispatch(toggleRightPanel())

    } else {

      dispatch(reduceExtraWidth())
      dispatch(toggleRightPanel())
    }

  }
const [audioLoading, setAudioLoading] = useState(false);
  const [mindMapLoading, setMindMapLoading] = useState(false);

  async function generateMindMap() {

   try {

     if (docIds.length > 0) {
      setMindMapLoading(true)
      await createMindMap(noteId, docIds)
      fetchSources()
    } else {
      showError("Please select a source");
    }
    
   } catch (error: any) {
     showError(error?.error?.message || error?.message || "Failed to generate mind map");
   }finally{
     setMindMapLoading(false)
   }

  }



  


  async function generateAudio() {
    if (docIds.length > 0) {
      try {
        setAudioLoading(true);

        await createBriefingDoc(noteId, docIds, 'audio')
        fetchSources()
      } catch (error) {
        const message =
          (error as any)?.error?.message ||
          (error as any)?.message ||
          "Unable to generate the audio overview.";
        showError(message);
      } finally {
        setAudioLoading(false);
      }
    } else {
      showError("Please select a source");
    }
  }


  return (


    <div
      className={`bg-white shadow-sm rounded-sm h-full min-h-0 overflow-y-auto transition-all duration-300 ml-auto mr-auto ${rightPanelOpen ? "w-[25%] p-4" : "w-16 p-2"
        }`}
    >
      <SourceModal />
      <MindMapSourceModal />

      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        {rightPanelOpen && <p className="text-base text-gray-800">Studio</p>}
        <Button
          variant="link"
          size="icon"
          className="size-8 hover:bg-slate-100 cursor-pointer"
          onClick={() => togglePanel()}
        >
          <PanelRight size={52} />
        </Button>
      </div>
      <hr />

      {/* Content */}
      <div className={`mt-4 grid ${rightPanelOpen ? "grid-cols-3 gap-2" : "grid-cols-1 gap-3"}`}>
        <div
          className={`${audioLoading ? 'animated-gradient-border' : ''}`}
        >

          <PanelItem generateSource={() => generateAudio()} loading={audioLoading} rightPanelOpen={rightPanelOpen} icon={<Sparkles />} label="Audio Overview" />

        </div>

        <PanelItem generateSource={generateMindMap} loading={mindMapLoading} rightPanelOpen={rightPanelOpen} icon={<GitBranch />} label="Mind Map" />

        <ReportPanelItem rightPanelOpen={rightPanelOpen} fetchSources={fetchSources} noteId={noteId} docIds={docIds} />
      </div>


      {rightPanelOpen && (
        <AudioSection
          audioUrl={`${apiUrl}/api/v1/notes/read/audios/${audioCard?.content}`}
          title={audioCard?.title}
        />
      )}



      {rightPanelOpen ? (


        <section className="mt-6 border-t border-slate-100 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Generated sources</h2>
            {sources?.length > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{sources.length}</span>}
          </div>

        {sources?.length > 0 ? (<div className={`space-y-2 ${audioCard.show ? 'max-h-60' : 'max-h-[min(24rem,45vh)]'} overflow-y-auto pr-1`}>

          {Array.isArray(sources) && sources.map((source) => (

            <div
              key={source._id}
              onClick={() => showSourceModal(source)}
              className="group flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition hover:border-indigo-100 hover:bg-indigo-50/40 hover:shadow"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 group-hover:bg-white">
                <SourceIcon type={source?.source_type} />
              </div>

              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-700">{truncateTitle(source?.title, 35) || 'Untitled source'}</span>
                <span className="mt-1 block text-xs capitalize text-slate-500">
                  {formatSourceMeta(source?.source_type, source?.total_source)}
                </span>
              </div>
            </div>
          ))}
        </div>) : (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <FileText className="text-slate-400" size={36} />
            <p className="mt-3 text-sm font-medium text-slate-600">
              No generated sources yet
            </p>
            <p className="mt-1 text-xs text-slate-400">Select a source, then choose an option above.</p>
          </div>

        )}
        </section>




      ) : (
        <div className="flex flex-col items-center mt-6  pl-1  gap-4">
          {/* {note?.docs.map((doc) => (
            <Button key={doc._id} variant="outline" size="icon">
              <FileText className="text-blue-500" size={20} />
            </Button>
          ))} */}
        </div>
      )}



      {/* Bottom note button */}
      {/* <div className="mt-6 flex justify-center">
        <Button
          className={`flex items-center gap-2 rounded-full font-medium shadow-md ${rightPanelOpen ? "px-6 py-3" : "p-3"
            }`}
        >
          <Pencil size={18} />
          {rightPanelOpen && <span>Add note</span>}
        </Button>
      </div> */}
    </div>

  );
};



const PanelItem = ({
  icon,
  label,
  rightPanelOpen,
  generateSource,
  loading = false,
}: {
  icon: React.ReactNode;
  label: string;
  rightPanelOpen: boolean;
  generateSource: () => void;
  loading?: boolean;
}) => {
  return (
    <div
      onClick={!loading ? generateSource : undefined}
      className={`flex items-center justify-center rounded-md transition
        ${rightPanelOpen ? "flex-col p-3 h-24" : "p-2 h-14"}
        ${label === "Mind Map" ? "bg-orange-50" : "bg-gray-100"}
        ${label === "Audio Overview" ? "bg-green-50" : ""}
        ${loading ? "cursor-not-allowed opacity-60" : "hover:bg-gray-200 cursor-pointer"}
      `}
    >
      {loading ? (
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      ) : (
        icon
      )}

      {rightPanelOpen && (
            <span className="mt-1.5 text-center text-xs font-medium text-gray-700">
          {loading ? "Loading..." : label}
        </span>
      )}
    </div>
  );
};





// / 🧾 Report menu (with dropdown)
const ReportPanelItem = ({ rightPanelOpen, noteId, docIds, fetchSources }: { rightPanelOpen: boolean, noteId: string, docIds: string[], fetchSources: () => void }) => {
  const menuItems = ["Summary", "Study Guide", "Briefing Doc", "FAQ"];
  const [loading, setLoading] = useState(false);

  async function generateSource(item: string) {
    if (docIds.length > 0) {
      setLoading(true);
      if (item === "Summary") {


        await createSummary(noteId, docIds);



      }
      else if (item === "FAQ") {

        await createFAQ(noteId, docIds)
      } else if (item === "Study Guide") {
        await createStudyGuide(noteId, docIds)
      }
      else if (item === "Briefing Doc") {
        await createBriefingDoc(noteId, docIds, 'briefing-doc')
      }


      fetchSources()

      setLoading(false);
    } else {
      showError("Please select a source");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={`flex items-center justify-center rounded-md bg-blue-50 hover:bg-gray-200 cursor-pointer transition ${rightPanelOpen ? "flex-col p-4 h-24" : "p-2 h-14"}`}
        >
          {loading ? (
            <div className="animated-gradient-border w-full h-full flex items-center justify-center">
              <div className="animated-gradient-inner flex items-center justify-center">
                <FileText />
              </div>
            </div>
          ) : (
            <FileText />
          )}

          {rightPanelOpen && (
            <span className="mt-2 text-sm font-medium text-gray-700">
              Reports
            </span>

          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-44">
        {menuItems.map((item) => (
          <DropdownMenuItem
            key={item}
            onClick={() => generateSource(item)}
            className="cursor-pointer"
          >
            {item}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};




interface SourceIconProps {
  type?: string;
}

function formatSourceMeta(type?: string, total?: number) {
  const label = type?.trim() || "source";
  return typeof total === "number" && total > 0
    ? `${label} · ${total} source${total === 1 ? "" : "s"}`
    : label;
}

 function SourceIcon({ type = "" }: SourceIconProps) {
  const normalized = type.toLowerCase();

  if (normalized.includes("audio")) {
    return <Music2 className="text-green-500" />;
  }

  if (normalized.includes("mindmap")) {
    return <GitBranch className="text-orange-500" size={20} />;
  }



  return <FileText className="text-blue-500" size={20} />;
}

export default RightPanel;
