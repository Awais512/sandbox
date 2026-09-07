"use client"

import * as React from "react"
import {
  ArrowUpIcon,
  CarIcon,
  ChevronDownIcon,
  CrosshairIcon,
  Gamepad2Icon,
  GripVerticalIcon,
  Loader2Icon,
  PickaxeIcon,
  PlaneIcon,
  SwordsIcon,
  ZapIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
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

const suggestions = [
  { label: "Voxel survival", icon: PickaxeIcon },
  { label: "Ink samurai duel", icon: SwordsIcon },
  { label: "Comic-book firefight", icon: ZapIcon },
  { label: "Realistic battlefield", icon: PlaneIcon },
  { label: "Fight-first shooter", icon: CrosshairIcon },
  { label: "Jungle expedition drive", icon: CarIcon },
  { label: "Sunny kingdom platformer", icon: Gamepad2Icon },
]

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
    <div className="flex w-full flex-col items-center gap-4">
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

      <div className="flex flex-wrap items-center justify-center gap-2">
        {suggestions.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.label}
              variant="outline"
              size="sm"
              className="rounded-full font-normal text-muted-foreground"
              disabled={isPending}
              onClick={() => {
                setPrompt(item.label)
                handleSubmit(item.label)
              }}
            >
              <Icon />
              {item.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export default ChatComposer
