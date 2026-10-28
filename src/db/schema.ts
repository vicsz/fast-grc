import { pgTable, text, timestamp, uuid, type AnyPgColumn } from 'drizzle-orm/pg-core';

// An org unit is a node in the organisation hierarchy (e.g. a business line or team)
// that risks and controls are assigned to. Bitemporal history comes in a later step.
export const orgUnits = pgTable('org_units', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  parentId: uuid('parent_id').references((): AnyPgColumn => orgUnits.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type OrgUnit = typeof orgUnits.$inferSelect;
export type NewOrgUnit = typeof orgUnits.$inferInsert;
