export function databaseUrl() {
  return process.env.DATABASE_URL ?? 'postgres://postgres:dev@localhost:5432/fast_grc';
}
