import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { ChatThread } from "@/components/chat-thread"
import { getGame } from "@/lib/games/queries"

// Chat threads must always render fresh DB state: a statically prerendered
// (or prefetched) copy would show stale messages and a stale resume cursor.
export const dynamic = "force-dynamic"
export const revalidate = 0

interface GamePageProps {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    prompt?: string | string[]
    model?: string | string[]
  }>
}

export default async function GamePage({
  params,
  searchParams,
}: GamePageProps) {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const prompt =
    typeof resolvedSearchParams.prompt === "string"
      ? resolvedSearchParams.prompt
      : Array.isArray(resolvedSearchParams.prompt)
        ? resolvedSearchParams.prompt[0]
        : undefined
  const model =
    typeof resolvedSearchParams.model === "string"
      ? resolvedSearchParams.model
      : Array.isArray(resolvedSearchParams.model)
        ? resolvedSearchParams.model[0]
        : undefined

  const game = await getGame(id)

  if (!game) {
    notFound()
  }

  const initialSessions = game.publicAccessToken
    ? {
        [game.id]: {
          publicAccessToken: game.publicAccessToken,
          lastEventId: game.lastEventId ?? undefined,
        },
      }
    : undefined

  return (
    <div className="flex h-svh w-full flex-col overflow-hidden">
      <ChatThread
        key={game.id}
        gameId={game.id}
        initialMessages={game.messages ?? []}
        initialSessions={initialSessions}
        initialPrompt={prompt}
        initialModelId={model}
      />
    </div>
  )
}
