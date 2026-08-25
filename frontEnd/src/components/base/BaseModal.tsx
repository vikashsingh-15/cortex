import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface BaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  width: number
  height: number
  background?:string
  allowExternalFocus?: boolean
}

export function BaseModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width,
  height,
  background,
  allowExternalFocus = false,
}: BaseModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={!allowExternalFocus}>
      <DialogContent
        // Google Picker is rendered in its own document-level overlay. Let it
        // receive focus instead of forcing focus back into this modal.
        onInteractOutside={allowExternalFocus ? (event) => event.preventDefault() : undefined}
        style={{

          width: "500vw",
          maxWidth: width + "px",
          height: height + "px",
          background:background

        }}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle className="text-gray-500">{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}

        <div className="py-4 overflow-auto overflow-y-auto">{children}</div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}
