import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const connectionString = (process.env.DATABASE_URL || "").trim();

if (!connectionString) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function verify() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
        to_regclass($1) AS money_protection_states,
        to_regclass($2) AS money_protection_events`,
      ["public.money_protection_states", "public.money_protection_events"]
    );

    const row = result.rows[0] ?? {};
    const statesOk = Boolean(row.money_protection_states);
    const eventsOk = Boolean(row.money_protection_events);

    if (!statesOk || !eventsOk) {
      console.error("money protection schema verification failed");
      console.error(
        JSON.stringify({
          money_protection_states: statesOk,
          money_protection_events: eventsOk,
        })
      );
      process.exit(1);
    }

    console.log("money protection schema verification passed");
  } finally {
    client.release();
    await pool.end();
  }
}

verify().catch((error) => {
  console.error(
    "money protection schema verification failed:",
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});
