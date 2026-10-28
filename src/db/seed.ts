import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { orgUnits } from './schema';

// A small, realistic hierarchy so the app looks useful straight after a reset.
const hierarchy: Record<string, string[]> = {
  'Northwind Financial': ['Retail Banking', 'Wealth Management', 'Technology', 'Risk & Compliance'],
  'Retail Banking': ['Cards', 'Mortgages'],
  Technology: ['Infrastructure', 'Information Security'],
  'Risk & Compliance': ['Operational Risk', 'Internal Audit'],
};

// Inserts the seed hierarchy into an empty table. Returns how many rows were added.
export async function seed(db: NodePgDatabase): Promise<number> {
  const existing = await db.$count(orgUnits);
  if (existing > 0) return 0;

  const ids = new Map<string, string>();
  let count = 0;
  const insert = async (name: string, parentId: string | null) => {
    const [row] = await db.insert(orgUnits).values({ name, parentId }).returning();
    ids.set(name, row.id);
    count++;
    for (const child of hierarchy[name] ?? []) await insert(child, row.id);
  };
  await insert('Northwind Financial', null);
  return count;
}
