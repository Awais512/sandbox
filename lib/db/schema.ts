import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id").notNull(),
    title: text("title").notNull(),
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
