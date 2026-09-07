import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { ChatThread } from "@/components/chat-thread"
import { getGame } from "@/lib/games/queries"

interface GamePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function GamePage({ params }: GamePageProps) {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })
  const { id } = await params

  const game = await getGame(id)

  if (!game) {
    notFound()
  }

  return (
    <div className="flex h-svh w-full flex-col overflow-hidden">
      <ChatThread gameId={game.id} />
    </div>
  )
}
