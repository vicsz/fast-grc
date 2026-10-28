// `npm run db:migrate`: apply migrations and seed without starting the app.
import { migrateDatabase } from './migrate';

migrateDatabase(undefined, { resetOnDrift: process.env.DB_RESET_ON_DRIFT === 'true' }).catch(
  (err) => {
    console.error(err.message);
    process.exit(1);
  },
);
