import { db } from "@/lib/db"
import { games, type Game } from "@/lib/db/schema"
import { auth } from "@clerk/nextjs/server"
import { and, desc, eq } from "drizzle-orm"

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function listGames(): Promise<Game[]> {
  const { orgId } = await auth()

  if (!orgId) {
    return []
  }

  return await db
    .select()
    .from(games)
    .where(eq(games.orgId, orgId))
    .orderBy(desc(games.createdAt))
}

export async function getGame(id: string): Promise<Game | null> {
  const { orgId } = await auth()

  if (!orgId || !UUID_REGEX.test(id)) {
    return null
  }

  const [game] = await db
    .select()
    .from(games)
    .where(and(eq(games.id, id), eq(games.orgId, orgId)))
    .limit(1)

  return game ?? null
}
