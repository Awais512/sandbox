"use server"

import { auth as triggerAuth } from "@trigger.dev/sdk"
import { chat, type ChatStartSessionParams } from "@trigger.dev/sdk/ai"
import { auth as clerkAuth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import type { UIMessage } from "ai"
import type { gameChat } from "@/trigger/chat"

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const start = chat.createStartSessionAction<typeof gameChat>("game-chat")

async function assertGameOwner(chatId: string) {
  const { userId, orgId } = await clerkAuth()

  if (!userId || !orgId) {
    throw new Error("Unauthorized")
  }

  if (!chatId || !UUID_REGEX.test(chatId)) {
    throw new Error("Invalid or missing game ID")
  }

  const [game] = await db
    .select({ id: games.id })
    .from(games)
    .where(and(eq(games.id, chatId), eq(games.orgId, orgId)))
    .limit(1)

  if (!game) {
    throw new Error("Game not found")
  }
}

// Creates the Session + first run, returns a session PAT.
// Idempotent on (env, chatId).
export async function startGameChatSession(
  params: ChatStartSessionParams<typeof gameChat>
) {
  await assertGameOwner(params.chatId)

  return start(params)
}

// Pure mint. The transport calls this on 401/403 to refresh an expired token.
export async function mintGameChatToken(chatId: string) {
  await assertGameOwner(chatId)

  return triggerAuth.createPublicToken({
    scopes: {
      read: { sessions: chatId },
      write: { sessions: chatId },
    },
    expirationTime: "1h",
  })
}

export interface GameChatState {
  messages: UIMessage[]
  session: { publicAccessToken: string; lastEventId?: string } | null
}

// Fresh authoritative state for a game thread: DB messages plus a usable
// session. Mints (and persists) a PAT when the row predates session
// persistence, so old rows and stale props can still resume.
export async function getGameChatState(chatId: string): Promise<GameChatState> {
  const { userId, orgId } = await clerkAuth()

  if (!userId || !orgId) {
    throw new Error("Unauthorized")
  }

  if (!chatId || !UUID_REGEX.test(chatId)) {
    throw new Error("Invalid or missing game ID")
  }

  const [game] = await db
    .select()
    .from(games)
    .where(and(eq(games.id, chatId), eq(games.orgId, orgId)))
    .limit(1)

  if (!game) {
    throw new Error("Game not found")
  }

  let token = game.publicAccessToken
  if (!token) {
    token = await triggerAuth.createPublicToken({
      scopes: {
        read: { sessions: chatId },
        write: { sessions: chatId },
      },
      expirationTime: "1h",
    })
    await db
      .update(games)
      .set({ publicAccessToken: token })
      .where(eq(games.id, chatId))
  }

  return {
    messages: game.messages ?? [],
    session: {
      publicAccessToken: token,
      lastEventId: game.lastEventId ?? undefined,
    },
  }
}
