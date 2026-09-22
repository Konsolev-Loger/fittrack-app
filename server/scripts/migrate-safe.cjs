// Back up before deploying migrations and verify existing records afterwards.
require("dotenv/config");
const { Client } = require("pg");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
async function main() {
 const url = new URL(process.env.DATABASE_URL);
 const db = new Client({ connectionString: url.toString() });
 await db.connect();
 try {
  const before = {};
  for (const table of ["User", "Category", "Exercise", "WorkoutSet"]) {
   before[table] = (await db.query('SELECT * FROM "' + table + '" ORDER BY id')).rows;
  }
  const days = (await db.query('SELECT id, to_char("date", \'YYYY-MM-DD HH24:MI:SS\') AS date FROM "Workout" ORDER BY id')).rows;
  const backupDir = path.join(__dirname, "../.backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, new Date().toISOString().replaceAll(":", "-") + ".dump");
  const dump = process.env.PG_DUMP || "C:/Program Files/PostgreSQL/18/bin/pg_dump.exe";
  const result = spawnSync(dump, ["--format=custom", "--file", backup, "--no-owner", "--no-acl"], {
   env: { ...process.env, PGHOST: url.hostname, PGPORT: url.port || "5432", PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password), PGDATABASE: decodeURIComponent(url.pathname.slice(1)) },
   encoding: "utf8", windowsHide: true,
  });
  if (result.error || result.status !== 0) throw new Error("Database backup failed: " + (result.error?.message || result.stderr));
  console.log("Backup created:", backup);
  const migration = spawnSync(process.execPath, [path.join(__dirname, "../node_modules/prisma/build/index.js"), "migrate", "deploy"], {
   stdio: "inherit", env: process.env, windowsHide: true, cwd: path.join(__dirname, ".."),
  });
  if (migration.error || migration.status !== 0) throw new Error("Migration failed; backup retained");
  const hash = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
  for (const table of Object.keys(before)) {
   const after = (await db.query('SELECT * FROM "' + table + '" ORDER BY id')).rows;
   // Compare all pre-existing columns; additive migrations may introduce new nullable fields.
   const keys = before[table][0] ? Object.keys(before[table][0]) : [];
   const originalColumns = after.map(row => Object.fromEntries(keys.map(key => [key, row[key]])));
   assert.equal(hash(originalColumns), hash(before[table]), table + " changed unexpectedly");
  }
  const afterDays = (await db.query('SELECT id, to_char("date", \'YYYY-MM-DD\') AS date FROM "Workout" ORDER BY id')).rows;
  assert.deepEqual(afterDays, days.map(day => ({
   id: day.id,
   date: new Date(Date.parse(day.date.replace(" ", "T") + "Z") + (day.date.endsWith("21:00:00") ? 3 * 60 * 60 * 1000 : 0)).toISOString().slice(0, 10),
  })));
  console.log("Verified: users, categories, exercises and sets unchanged; calendar days preserved.");
 } finally { await db.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
