"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUpIcon,
  ChevronDownIcon,
  GripVerticalIcon,
  Loader2Icon,
  SquareIcon,
} from "lucide-react"
import { cn } from "cn"

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

export const models = [
  { id: "kimi-k3", name: "Kimi K3" },
  { id: "claude-3-7-sonnet", name: "Claude 3.7 Sonnet" },
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "gemini-2-5-flash", name: "Gemini 2.5 Flash" },
  { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash" },
]

export type Model = (typeof models)[number]

export interface ChatComposerProps {
  value?: string
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void | Promise<void>
  onStop?: () => void
  disabled?: boolean
  isPending?: boolean
  placeholder?: string
  className?: string
  selectedModel?: Model
  onModelChange?: (model: Model) => void
}

export function ChatComposer({
  value: controlledValue,
  onChange: controlledOnChange,
  onSubmit,
  onStop,
  disabled = false,
  isPending: controlledIsPending,
  placeholder = "Describe the game you want to build...",
  className,
  selectedModel: controlledSelectedModel,
  onModelChange,
}: ChatComposerProps = {}) {
  const router = useRouter()
  const [internalValue, setInternalValue] = React.useState("")
  const [internalSelectedModel, setInternalSelectedModel] = React.useState(
    models[0]
  )
  const [isPendingTransition, startTransition] = React.useTransition()

  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue

  const selectedModel = controlledSelectedModel ?? internalSelectedModel
  const isPending = controlledIsPending ?? isPendingTransition

  const handleSelectModel = (model: Model) => {
    if (controlledSelectedModel === undefined) {
      setInternalSelectedModel(model)
    }
    onModelChange?.(model)
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value
    if (!isControlled) {
      setInternalValue(nextVal)
    }
    controlledOnChange?.(nextVal)
  }

  const handleSubmit = (overrideValue?: string) => {
    const text = (overrideValue ?? value).trim()
    if (!text || isPending || disabled) return

    if (onSubmit) {
      onSubmit(text)
      if (!isControlled) {
        setInternalValue("")
      }
      return
    }

    // Default: create a new game when rendered without an onSubmit handler (e.g. from page.tsx)
    startTransition(async () => {
      try {
        const newGame = await createGame({ title: text })
        if (!isControlled) {
          setInternalValue("")
        }
        if (newGame?.id) {
          router.push(`/games/${newGame.id}`)
        }
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
    <InputGroup className={cn("bg-popover", className)}>
      <InputGroupTextarea
        rows={1}
        placeholder={placeholder}
        className="field-sizing-content max-h-48 min-h-10"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={isPending || disabled}
      />
      <InputGroupAddon align="block-end" className="justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <InputGroupButton variant="ghost">
                <GripVerticalIcon />
                <span>{selectedModel.name}</span>
                <ChevronDownIcon />
              </InputGroupButton>
            }
          />
          <DropdownMenuContent align="start">
            {models.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => handleSelectModel(model)}
              >
                {model.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <InputGroupButton
          variant="default"
          size="icon-sm"
          className="rounded-full"
          disabled={isPending ? !onStop : disabled || !value.trim()}
          onClick={() => {
            if (isPending && onStop) {
              onStop()
            } else {
              handleSubmit()
            }
          }}
        >
          {isPending ? (
            onStop ? (
              <SquareIcon className="size-3.5 fill-current" />
            ) : (
              <Loader2Icon className="animate-spin" />
            )
          ) : (
            <ArrowUpIcon />
          )}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

export default ChatComposer
