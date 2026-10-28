// Tests run against their own database, recreated and migrated once per test run.
const server = process.env.TEST_DATABASE_SERVER ?? 'postgres://postgres:dev@localhost:5432';
export const adminUrl = `${server}/postgres`;
export const testUrl = `${server}/fast_grc_test`;
