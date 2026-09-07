"use client"

import * as React from "react"
import Image from "next/image"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { Loader2Icon } from "lucide-react"
import { cn } from "cn"

import { ChatComposer, models, type Model } from "@/components/chat-composer"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"

export interface ChatThreadProps {
  gameId?: string
  initialMessages?: UIMessage[]
  initialPrompt?: string
  initialModelId?: string
  className?: string
}

export function ChatThread({
  gameId,
  initialMessages,
  initialPrompt,
  initialModelId,
  className,
}: ChatThreadProps) {
  const [input, setInput] = React.useState("")
  const [selectedModel, setSelectedModel] = React.useState<Model>(() => {
    if (initialModelId) {
      const match = models.find((m) => m.id === initialModelId)
      if (match) return match
    }
    if (typeof window !== "undefined" && gameId) {
      try {
        const storedModel = window.sessionStorage.getItem(
          `pending_model_${gameId}`
        )
        if (storedModel) {
          const match = models.find((m) => m.id === storedModel)
          if (match) return match
        }
      } catch {
        // ignore
      }
    }
    return models[0]
  })

  const transport = React.useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          gameId,
        },
      }),
    [gameId]
  )

  const { messages, sendMessage, status, stop, error, regenerate } = useChat({
    id: gameId,
    messages: initialMessages,
    transport,
  })

  const isPending = status === "submitted" || status === "streaming"

  const hasAutoSubmittedRef = React.useRef(false)

  React.useEffect(() => {
    if (hasAutoSubmittedRef.current) return

    let promptToSend = initialPrompt?.trim()
    if (!promptToSend && typeof window !== "undefined" && gameId) {
      try {
        const stored = window.sessionStorage.getItem(`pending_prompt_${gameId}`)
        if (stored) {
          promptToSend = stored.trim()
        }
      } catch {
        // ignore
      }
    }

    if (!promptToSend) return

    // If there are already messages in the thread, do not auto-submit
    if (
      (initialMessages && initialMessages.length > 0) ||
      messages.length > 0
    ) {
      return
    }

    // Deduplication check per game to prevent duplicate submissions
    if (typeof window !== "undefined" && gameId) {
      const dedupeKey = `submitted_prompt_${gameId}`
      try {
        if (window.sessionStorage.getItem(dedupeKey) === promptToSend) {
          return
        }
        window.sessionStorage.setItem(dedupeKey, promptToSend)
      } catch {
        // ignore
      }
    }

    hasAutoSubmittedRef.current = true

    // Clean up pending storage and URL query params
    if (typeof window !== "undefined") {
      try {
        if (gameId) {
          window.sessionStorage.removeItem(`pending_prompt_${gameId}`)
          window.sessionStorage.removeItem(`pending_model_${gameId}`)
        }
        const url = new URL(window.location.href)
        if (url.searchParams.has("prompt") || url.searchParams.has("model")) {
          url.searchParams.delete("prompt")
          url.searchParams.delete("model")
          window.history.replaceState(
            {},
            "",
            url.pathname + (url.search ? url.search : "")
          )
        }
      } catch {
        // ignore
      }
    }

    const modelToUse = initialModelId
      ? (models.find((m) => m.id === initialModelId) ?? selectedModel)
      : selectedModel

    sendMessage(
      { text: promptToSend },
      {
        body: {
          gameId,
          model: modelToUse.id,
        },
      }
    )
  }, [
    gameId,
    initialPrompt,
    initialModelId,
    initialMessages,
    messages.length,
    sendMessage,
    selectedModel,
  ])

  const handleSendMessage = (value: string) => {
    const text = value.trim()
    if (!text || isPending) return
    sendMessage(
      { text },
      {
        body: {
          gameId,
          model: selectedModel.id,
        },
      }
    )
    setInput("")
  }

  return (
    <div
      className={cn(
        "flex size-full min-h-0 flex-col overflow-hidden bg-background",
        className
      )}
    >
      <div className="relative min-h-0 flex-1">
        <MessageScrollerProvider defaultScrollPosition="end">
          <MessageScroller className="h-full">
            <MessageScrollerViewport className="p-4 md:px-6">
              <MessageScrollerContent className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-4">
                {messages.length === 0 ? (
                  initialPrompt ? (
                    <div className="flex h-full min-h-[320px] items-center justify-center">
                      <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[320px] flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <Image
                        src="/logo.svg"
                        alt="Assistant"
                        width={40}
                        height={40}
                        className="mb-3 size-10 object-contain opacity-80"
                      />
                      <p className="text-base font-medium text-foreground">
                        What should we build today?
                      </p>
                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        Describe the mechanics, aesthetics, or gameplay changes
                        you&apos;d like to explore.
                      </p>
                    </div>
                  )
                ) : (
                  messages.map((message, index) => {
                    const isLast = index === messages.length - 1
                    const isAssistant = message.role === "assistant"

                    return (
                      <MessageScrollerItem
                        key={message.id}
                        messageId={message.id}
                        scrollAnchor={
                          isLast && status !== "submitted" && !error
                        }
                      >
                        {isAssistant ? (
                          <Message align="start">
                            <MessageAvatar className="size-8 self-start rounded-lg bg-transparent">
                              <Image
                                src="/logo.svg"
                                alt="Assistant"
                                width={32}
                                height={32}
                                className="size-8 object-contain"
                              />
                            </MessageAvatar>
                            <MessageContent>
                              <Bubble variant="ghost">
                                <BubbleContent className="text-sm leading-relaxed whitespace-pre-line">
                                  {message.parts && message.parts.length > 0 ? (
                                    message.parts.map((part, partIndex) => {
                                      if (part.type === "text") {
                                        return (
                                          <span key={partIndex}>
                                            {part.text}
                                          </span>
                                        )
                                      }
                                      if (part.type === "reasoning") {
                                        return (
                                          <div
                                            key={partIndex}
                                            className="my-1 rounded border-l-2 border-primary/40 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground italic"
                                          >
                                            {part.text}
                                          </div>
                                        )
                                      }
                                      return null
                                    })
                                  ) : (
                                    <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                                  )}
                                </BubbleContent>
                              </Bubble>
                            </MessageContent>
                          </Message>
                        ) : (
                          <Message align="end">
                            <MessageContent>
                              <Bubble variant="secondary" align="end">
                                <BubbleContent className="text-sm leading-relaxed whitespace-pre-line">
                                  {message.parts && message.parts.length > 0
                                    ? message.parts.map((part, partIndex) => {
                                        if (part.type === "text") {
                                          return (
                                            <span key={partIndex}>
                                              {part.text}
                                            </span>
                                          )
                                        }
                                        return null
                                      })
                                    : null}
                                </BubbleContent>
                              </Bubble>
                            </MessageContent>
                          </Message>
                        )}
                      </MessageScrollerItem>
                    )
                  })
                )}

                {status === "submitted" && (
                  <MessageScrollerItem
                    key="pending-submission"
                    messageId="pending-submission"
                    scrollAnchor={!error}
                  >
                    <Message align="start">
                      <MessageAvatar className="size-8 self-start rounded-lg bg-transparent">
                        <Image
                          src="/logo.svg"
                          alt="Assistant"
                          width={32}
                          height={32}
                          className="size-8 object-contain"
                        />
                      </MessageAvatar>
                      <MessageContent>
                        <Bubble variant="ghost">
                          <BubbleContent className="text-sm leading-relaxed text-muted-foreground">
                            <Loader2Icon className="size-4 animate-spin" />
                          </BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                )}

                {error && (
                  <MessageScrollerItem
                    key="chat-error"
                    messageId="chat-error"
                    scrollAnchor
                  >
                    <Message align="start">
                      <MessageContent>
                        <Bubble variant="destructive">
                          <BubbleContent className="flex items-center gap-3 text-sm leading-relaxed">
                            <span>
                              {error.message || "Failed to generate response."}
                            </span>
                            <button
                              type="button"
                              onClick={() => regenerate()}
                              className="cursor-pointer text-xs font-semibold underline underline-offset-2 hover:opacity-80"
                            >
                              Retry
                            </button>
                          </BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>

      <div className="w-full shrink-0 border-t bg-background/80 p-4 backdrop-blur-sm md:px-6">
        <div className="mx-auto max-w-3xl">
          <ChatComposer
            value={input}
            onChange={setInput}
            onSubmit={handleSendMessage}
            onStop={stop}
            isPending={isPending}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
      </div>
    </div>
  )
}

export default ChatThread
