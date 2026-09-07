"use client"

import * as React from "react"
import {
  ArrowUpIcon,
  ChevronDownIcon,
  GripVerticalIcon,
  Loader2Icon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { createGame } from "@/lib/games/actions"

export function ChatComposer() {
  const [prompt, setPrompt] = React.useState("")
  const [isPending, startTransition] = React.useTransition()

  const handleSubmit = (value?: string) => {
    const title = (value ?? prompt).trim()
    if (!title || isPending) return

    startTransition(async () => {
      try {
        await createGame({ title })
        setPrompt("")
      } catch (error) {
        console.error("Failed to create game:", error)
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <InputGroup className="bg-popover">
      <InputGroupTextarea
        rows={1}
        placeholder="Describe the game you want to build..."
        className="field-sizing-content max-h-48 min-h-10"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isPending}
      />
      <InputGroupAddon align="block-end" className="justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <InputGroupButton variant="ghost">
                <GripVerticalIcon />
                <span>Kimi K3</span>
                <ChevronDownIcon />
              </InputGroupButton>
            }
          />
          <DropdownMenuContent align="start">
            <DropdownMenuItem>Kimi K3</DropdownMenuItem>
            <DropdownMenuItem>Claude 3.7 Sonnet</DropdownMenuItem>
            <DropdownMenuItem>GPT-4o</DropdownMenuItem>
            <DropdownMenuItem>Gemini 2.5 Flash</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <InputGroupButton
          variant="default"
          size="icon-sm"
          className="rounded-full"
          disabled={isPending || !prompt.trim()}
          onClick={() => handleSubmit()}
        >
          {isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <ArrowUpIcon />
          )}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

export default ChatComposer
