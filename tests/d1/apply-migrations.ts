import { applyD1Migrations, type D1Migration } from 'cloudflare:test';

export type MigrationRange = {
  from?: number;
  through?: number;
};

export function selectMigrations(
  migrations: readonly D1Migration[],
  { from = 1, through = migrations.length }: MigrationRange = {},
): D1Migration[] {
  if (!Number.isInteger(from) || !Number.isInteger(through) || from < 1 || through < from) {
    throw new RangeError('The migration range is invalid.');
  }
  return migrations.slice(from - 1, through);
}

export async function applyMigrations(
  database: D1Database,
  migrations: readonly D1Migration[],
  range?: MigrationRange,
): Promise<void> {
  await applyD1Migrations(database, selectMigrations(migrations, range));
}
