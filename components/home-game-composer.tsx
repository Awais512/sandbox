"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChatComposer, models, type Model } from "@/components/chat-composer"
import { suggestions } from "@/lib/game/suggestions"
import { createGame } from "@/lib/games/actions"

export function HomeGameComposer() {
  const router = useRouter()
  const [prompt, setPrompt] = React.useState("")
  const [selectedModel, setSelectedModel] = React.useState<Model>(models[0])
  const [isPending, startTransition] = React.useTransition()

  const handleCreate = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isPending) return

    startTransition(async () => {
      try {
        const newGame = await createGame({ title: trimmed })
        if (newGame?.id) {
          try {
            sessionStorage.setItem(`pending_prompt_${newGame.id}`, trimmed)
            sessionStorage.setItem(
              `pending_model_${newGame.id}`,
              selectedModel.id
            )
          } catch {
            // ignore
          }

          const params = new URLSearchParams()
          params.set("prompt", trimmed)
          if (selectedModel?.id) {
            params.set("model", selectedModel.id)
          }

          router.push(`/games/${newGame.id}?${params.toString()}`)
        }
      } catch (error) {
        console.error("Failed to create game:", error)
      }
    })
  }

  return (
    <>
      <ChatComposer
        value={prompt}
        onChange={setPrompt}
        onSubmit={handleCreate}
        isPending={isPending}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
      <div className="flex flex-wrap items-center justify-center gap-2">
        {suggestions.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.label}
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleCreate(item.label)}
              className="rounded-full font-normal text-muted-foreground"
            >
              <Icon />
              {item.label}
            </Button>
          )
        })}
      </div>
    </>
  )
}
