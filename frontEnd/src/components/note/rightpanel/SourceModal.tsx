
import { BaseModal } from "@/components/base/BaseModal";
import { Button } from "@/components/ui/button";
import type { AppDispatch, RootState } from "@/store";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm'
import { closeSourceModal } from "@/store/rightPanelSlice";




export const SourceModal = () => {
  const [open, setOpen] = React.useState(false)
  const dispatch = useDispatch<AppDispatch>();

  const { sourceModal } = useSelector((state: RootState) => state.rightPanel);

  return (




    <div>


      <BaseModal
        open={sourceModal?.modal}
        onOpenChange={setOpen}
        title={sourceModal?.source_type}
        description=""
        width={800}
        height={700}
        footer={
          <>
            <Button variant="outline" onClick={() => dispatch(closeSourceModal())}>
              Close Modal
            </Button>

          </>
        }
      >

        <div className="text-sm leading-7 text-slate-700">

          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
            a: ({ node, ...props }) => (
              <a className="text-blue-500 underline hover:text-blue-700" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="my-3 list-disc space-y-1 pl-6" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="my-3 list-decimal space-y-1 pl-6" {...props} />
            ),
            li: ({ node, ...props }) => <li {...props} />,
            p: ({ node, ...props }) => <p className="my-3" {...props} />,
            h1: ({ node, ...props }) => <h1 className="mb-5 text-2xl font-bold leading-tight text-slate-900" {...props} />,
            h2: ({ node, ...props }) => <h2 className="mb-2 mt-6 text-xl font-semibold leading-tight text-slate-800" {...props} />,
            h3: ({ node, ...props }) => <h3 className="mb-2 mt-5 text-base font-semibold text-slate-800" {...props} />,
            strong: ({ node, ...props }) => <strong className="font-bold text-gray-700" {...props} />,
          }}>
            {`# ${sourceModal?.title ?? "Untitled source"}\n\n${sourceModal?.content ?? ""}`}
          </ReactMarkdown>

        </div>
      </BaseModal>
    </div>

  );
}
