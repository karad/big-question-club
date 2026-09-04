import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * Creates the typed Drizzle client used by application repositories.
 * @param database - Cloudflare D1 database binding.
 * @returns A Drizzle client configured with the application schema.
 */
export function createDatabase(database: D1Database) {
  return drizzle(database, { schema });
}

export type ApplicationDatabase = ReturnType<typeof createDatabase>;
