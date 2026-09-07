import { chat } from "@trigger.dev/sdk/ai"
import { gateway, streamText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { deepseek } from "@ai-sdk/deepseek"
import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// No tools exist in the current route handler. Declared here as an empty set
// so `chat.toStreamTextOptions({ tools })` and the `run` payload stay wired
// for future tools and `toModelOutput` survives across turns.
const tools = {}

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

export const gameChat = chat.agent({
  id: "game-chat",
  tools,
  onPreload: async ({ chatId, chatAccessToken }) => {
    // Persist the session PAT before the first message arrives, so a
    // reload mid-first-turn still has a token to resubscribe with.
    if (chatAccessToken) {
      await db
        .update(games)
        .set({ publicAccessToken: chatAccessToken })
        .where(eq(games.id, chatId))
    }
  },
  onChatStart: async ({ chatId, chatAccessToken }) => {
    // Non-preloaded path (or token rotation): same guarantee as onPreload.
    if (chatAccessToken) {
      await db
        .update(games)
        .set({ publicAccessToken: chatAccessToken })
        .where(eq(games.id, chatId))
    }
  },
  onTurnStart: async ({ chatId, uiMessages, chatAccessToken }) => {
    await db
      .update(games)
      .set({
        messages: uiMessages,
        ...(chatAccessToken ? { publicAccessToken: chatAccessToken } : {}),
      })
      .where(eq(games.id, chatId))
  },
  onTurnComplete: async ({
    chatId,
    uiMessages,
    chatAccessToken,
    lastEventId,
  }) => {
    // Single-row write: messages + resume cursor (+ fresh PAT) land together,
    // so a reload never sees new messages with a stale lastEventId.
    await db
      .update(games)
      .set({
        messages: uiMessages,
        lastEventId: lastEventId ?? null,
        publicAccessToken: chatAccessToken ?? null,
      })
      .where(eq(games.id, chatId))
  },
  run: async ({ messages, tools, signal, clientData }) =>
    streamText({
      // Spread FIRST so explicit options below still win.
      ...chat.toStreamTextOptions({ tools }),
      model: getLanguageModel(
        (clientData as { model?: string } | undefined)?.model
      ),
      messages,
      abortSignal: signal,
    }),
})
