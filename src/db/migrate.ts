import "dotenv/config";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { db } from "@/db/client";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run migrations.");
  }
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Migrations complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
