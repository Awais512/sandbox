import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import type { UIMessage } from "ai"

export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id").notNull(),
    title: text("title").notNull(),
    messages: jsonb("messages").$type<UIMessage[]>().default([]).notNull(),
    lastEventId: text("last_event_id"),
    publicAccessToken: text("public_access_token"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("games_org_id_idx").on(table.orgId),
    index("games_org_id_created_at_idx").on(table.orgId, table.createdAt),
  ]
)

export type Game = typeof games.$inferSelect
export type NewGame = typeof games.$inferInsert
