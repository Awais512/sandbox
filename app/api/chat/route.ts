import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
} from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { auth } from "@clerk/nextjs/server"

interface IncomingMessage {
  id?: string
  role: "user" | "assistant" | "system"
  content?: string
  parts?: UIMessage["parts"]
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { messages }: { messages?: IncomingMessage[] } = await req.json()

  // Format messages to ensure compatibility with both UIMessage (with parts) and legacy message formats
  const formattedMessages: UIMessage[] = (messages ?? []).map(
    (message, index) => {
      if (Array.isArray(message.parts)) {
        return message as UIMessage
      }
      return {
        id: message.id ?? String(index),
        role: message.role,
        parts: [
          {
            type: "text",
            text: typeof message.content === "string" ? message.content : "",
          },
        ],
      }
    }
  )

  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    messages: await convertToModelMessages(formattedMessages),
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
