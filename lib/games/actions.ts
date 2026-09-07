"use server"

import { generateText, gateway } from "ai"
import { deepseek } from "@ai-sdk/deepseek"
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

  let promptText: string
  if (typeof input === "string") {
    promptText = input
  } else if (input instanceof FormData) {
    promptText = (input.get("title") as string) || ""
  } else {
    promptText = input.title
  }

  promptText = promptText.trim()
  if (!promptText) {
    throw new Error("Game description cannot be empty")
  }

  let title = promptText
  try {
    const model = process.env.AI_GATEWAY_API_KEY
      ? gateway("deepseek/deepseek-v4-flash")
      : deepseek("deepseek-v4-flash")

    const { text } = await generateText({
      model,
      system:
        "You are a creative video game naming assistant. Generate a short, catchy, memorable title (2 to 5 words, max 40 characters) for the game described by the user. Respond with ONLY the title. Do not include quotes, markdown formatting, or any extra explanation.",
      prompt: promptText,
    })

    const cleanTitle = text.trim().replace(/^["']|["']$/g, "")
    if (cleanTitle) {
      title = cleanTitle
    }
  } catch (error) {
    console.error(
      "Failed to generate game title with AI, using fallback:",
      error
    )
    title = promptText.slice(0, 50).trim()
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
