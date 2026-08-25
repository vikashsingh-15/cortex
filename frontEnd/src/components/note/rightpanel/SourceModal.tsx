
import { BaseModal } from "@/components/base/BaseModal";
import { Button } from "@/components/ui/button";
import type { AppDispatch, RootState } from "@/store";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { AiResponseContent } from "@/components/base/AiResponseContent";
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

        <div className="text-sm leading-7">
          <AiResponseContent content={`# ${sourceModal?.title ?? "Untitled source"}\n\n${sourceModal?.content ?? ""}`} />
        </div>
      </BaseModal>
    </div>

  );
}
