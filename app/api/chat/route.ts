import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  gateway,
} from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { deepseek } from "@ai-sdk/deepseek"
import { auth } from "@clerk/nextjs/server"

interface IncomingMessage {
  id?: string
  role: "user" | "assistant" | "system"
  content?: string
  parts?: UIMessage["parts"]
}

function getLanguageModel(modelId?: string) {
  if (process.env.AI_GATEWAY_API_KEY) {
    const gatewayMap: Record<string, string> = {
      "kimi-k3": "moonshotai/kimi-k3",
      "claude-3-7-sonnet": "anthropic/claude-3-7-sonnet",
      "gpt-4o": "openai/gpt-4o",
      "gemini-2-5-flash": "google/gemini-2.5-flash",
      "deepseek-v4-flash": "deepseek/deepseek-v4-flash",
    }
    const target = modelId
      ? (gatewayMap[modelId] ?? modelId)
      : "anthropic/claude-sonnet-4.5"
    return gateway(target)
  }

  if (modelId === "deepseek-v4-flash") {
    return deepseek("deepseek-v4-flash")
  }

  return anthropic("claude-sonnet-4-5")
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const {
    messages,
    model,
  }: {
    messages?: IncomingMessage[]
    model?: string
  } = await req.json()

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
    model: getLanguageModel(model),
    messages: await convertToModelMessages(formattedMessages),
    abortSignal: req.signal,
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
