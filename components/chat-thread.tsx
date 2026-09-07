"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "cn"

import { ChatComposer } from "@/components/chat-composer"
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

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    role: "user",
    content:
      "Create a retro 2D platformer called 'Neon Leap'. The player is a robot navigating cyberpunk rooftops with high-speed jumps and neon laser traps.",
  },
  {
    id: "msg-2",
    role: "assistant",
    content:
      "I've built the foundation for **Neon Leap**! Here is what's ready to test in your game canvas:\n\n• **Player Controller**: Snappy movement physics, variable jump height, and air-dash with glowing trail particles.\n• **Hazards & Traps**: Pulsing vertical laser barriers and crumbling rooftop tiles that drop after 0.5 seconds.\n• **Energy Nodes**: 8 glowing energy cells scattered across the skyline to collect for speed boosts.\n• **Atmosphere**: Synthwave city backdrop with dynamic neon lighting and CRT scanlines.\n\nTake a look at the game preview! What gameplay mechanics or hazards would you like to refine next?",
  },
  {
    id: "msg-3",
    role: "user",
    content:
      "Can you make the jump gravity feel slightly heavier for crisper landing, and add a double-jump with a spark particle effect?",
  },
  {
    id: "msg-4",
    role: "assistant",
    content:
      "Updated! Here are the changes I've applied:\n\n• **Jump Tuning**: Increased downward gravity scale by 20% for tighter, more responsive aerial control.\n• **Double-Jump**: Added a mid-air jump mechanic accompanied by a cyan spark burst animation.\n• **Audio Feedback**: Hooked up audio cues for both initial jump and double-jump execution.\n\nTry out the acrobatics now and let me know how the movement feels!",
  },
]

export interface ChatThreadProps {
  gameId?: string
  className?: string
}

export function ChatThread({ className }: ChatThreadProps) {
  const [input, setInput] = React.useState("")

  const sendMessage = (value: string) => {
    console.log("sendMessage:", value)
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
                {MOCK_MESSAGES.map((message, index) => (
                  <MessageScrollerItem
                    key={message.id}
                    messageId={message.id}
                    scrollAnchor={index === MOCK_MESSAGES.length - 1}
                  >
                    {message.role === "assistant" ? (
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
                              {message.content}
                            </BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    ) : (
                      <Message align="end">
                        <MessageContent>
                          <Bubble variant="secondary" align="end">
                            <BubbleContent className="text-sm leading-relaxed whitespace-pre-line">
                              {message.content}
                            </BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    )}
                  </MessageScrollerItem>
                ))}
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
            onSubmit={sendMessage}
          />
        </div>
      </div>
    </div>
  )
}

export default ChatThread
