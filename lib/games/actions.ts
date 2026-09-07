"use server"

import { db } from "@/lib/db"
import { games, type Game } from "@/lib/db/schema"
import { auth } from "@clerk/nextjs/server"
import { refresh, revalidatePath, revalidateTag } from "next/cache"

export async function createGame(
  input: string | { title: string } | FormData
): Promise<Game> {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("Unauthorized: Organization ID is required")
  }

  let title: string
  if (typeof input === "string") {
    title = input
  } else if (input instanceof FormData) {
    title = (input.get("title") as string) || ""
  } else {
    title = input.title
  }

  title = title.trim()
  if (!title) {
    throw new Error("Game title cannot be empty")
  }

  const [newGame] = await db
    .insert(games)
    .values({
      orgId,
      title,
    })
    .returning()

  // Refresh server component tag / layout
  revalidatePath("/", "layout")
  refresh()
  try {
    revalidateTag("games", "max")
  } catch {
    // Ignore if cache provider does not support tags in current context
  }

  return newGame
}
