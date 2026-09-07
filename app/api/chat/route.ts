import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  gateway,
  generateId,
} from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { deepseek } from "@ai-sdk/deepseek"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

interface IncomingMessage {
  id?: string
  role: "user" | "assistant" | "system"
  content?: string
  parts?: UIMessage["parts"]
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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
  const { userId, orgId } = await auth()

  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const {
    messages,
    id: chatId,
    gameId: bodyGameId,
    model,
  }: {
    messages?: IncomingMessage[]
    id?: string
    gameId?: string
    model?: string
  } = await req.json()

  const gameId = bodyGameId || chatId

  if (!gameId || !UUID_REGEX.test(gameId)) {
    return new Response("Invalid or missing game ID", { status: 400 })
  }

  // Load game from database, scoped to orgId
  const [game] = await db
    .select()
    .from(games)
    .where(and(eq(games.id, gameId), eq(games.orgId, orgId)))
    .limit(1)

  if (!game) {
    return new Response("Game not found", { status: 404 })
  }

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

  // Persist current thread state (including user's incoming message)
  await db
    .update(games)
    .set({ messages: formattedMessages })
    .where(and(eq(games.id, gameId), eq(games.orgId, orgId)))

  const result = streamText({
    model: getLanguageModel(model),
    messages: await convertToModelMessages(formattedMessages),
    abortSignal: req.signal,
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: formattedMessages,
      generateMessageId: () => generateId(),
      onEnd: async ({ messages: fullThread }) => {
        try {
          await db
            .update(games)
            .set({ messages: fullThread })
            .where(and(eq(games.id, gameId), eq(games.orgId, orgId)))
        } catch (error) {
          console.error("Failed to persist full thread to game:", error)
        }
      },
    }),
  })
}
