"use client"

import * as React from "react"
import { BrainIcon, ChevronDownIcon, Loader2Icon } from "lucide-react"
import { cn } from "cn"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export interface ThinkingBlockProps {
  text: string
  state?: "streaming" | "done"
  className?: string
}

export function ThinkingBlock({ text, state, className }: ThinkingBlockProps) {
  const isThinking = state === "streaming"
  const [open, setOpen] = React.useState(isThinking)
  const prevIsThinkingRef = React.useRef(isThinking)

  React.useEffect(() => {
    const prev = prevIsThinkingRef.current
    if (prev !== isThinking) {
      prevIsThinkingRef.current = isThinking
      // Auto-expand when thinking starts, auto-collapse when it finishes.
      // Manual toggles in between are preserved until the next transition.
      setOpen(isThinking)
    }
  }, [isThinking])

  if (!text && !isThinking) {
    return null
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn("my-1", className)}
    >
      <CollapsibleTrigger className="flex w-fit cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-xs font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50">
        {isThinking ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <BrainIcon className="size-3.5" />
        )}
        <span>{isThinking ? "Thinking…" : "Thinking"}</span>
        <ChevronDownIcon
          className={cn(
            "size-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 max-h-48 overflow-y-auto rounded border-l-2 border-primary/40 bg-muted/30 px-3 py-1.5 text-xs whitespace-pre-line text-muted-foreground italic">
          {text || "Thinking…"}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
