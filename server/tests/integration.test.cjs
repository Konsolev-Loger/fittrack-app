const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv/config");
const { Client } = require("pg");
const schema = "fittrack_test_" + randomUUID().replaceAll("-", "");
const previewDir = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "fittrack-mail-"));
process.env.EMAIL_AUTH_ENABLED = "true";
process.env.MAIL_MODE = "preview";
process.env.MAIL_PREVIEW_DIR = previewDir;
const mailToken = (email, purpose) => {
 const mails = fs.readdirSync(previewDir).map(name => JSON.parse(fs.readFileSync(path.join(previewDir, name), "utf8")));
 const letter = mails.reverse().find(mail => mail.to === email && mail.text.includes("/" + purpose));
 assert.ok(letter, "Preview mail exists");
 return letter.text.match(/#token=([a-f0-9]{64})/)[1];
};
let admin, prisma, server, base, workoutService, owner, other, category;
const password = "Password123!";
const request = async (route, { token, cookie, method = "GET", body } = {}) => {
 const response = await fetch(base + route, { method, headers: {
  ...(token ? { Authorization: "Bearer " + token } : {}),
  ...(cookie ? { Cookie: cookie } : {}),
  ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
 }, body: body === undefined ? undefined : JSON.stringify(body) });
 return { status: response.status, body: await response.json(), cookie: response.headers.get("set-cookie") };
};
before(async () => {
 admin = new Client({ connectionString: process.env.DATABASE_URL });
 await admin.connect();
 await admin.query('CREATE SCHEMA "' + schema + '"');
 await admin.query('SET search_path TO "' + schema + '"');
 const dir = path.join(__dirname, "../prisma/migrations");
 for (const name of fs.readdirSync(dir).filter(n => fs.existsSync(path.join(dir, n, "migration.sql"))).sort()) {
  if (name.startsWith("20260919")) {
   await admin.query('INSERT INTO "User" (id,email,password,"updatedAt") VALUES ($1,$2,$3,now())', ["legacy", "legacy@test.invalid", "unused"]);
   await admin.query('INSERT INTO "Workout" (id,date,"weekNumber",month,year,"userId","updatedAt") VALUES ($1,$2,1,9,2026,$3,now())', ["legacy-day", "2026-08-31 21:00:00", "legacy"]);
  }
  await admin.query(fs.readFileSync(path.join(dir, name, "migration.sql"), "utf8"));
 }
 const url = new URL(process.env.DATABASE_URL);
 url.searchParams.set("schema", schema);
 url.searchParams.set("options", "-c search_path=" + schema);
 process.env.DATABASE_URL = url.toString();
 process.env.ACCESS_TOKEN_SECRET = randomUUID();
 process.env.REFRESH_TOKEN_SECRET = randomUUID();
 ({ prisma } = require("../src/utils/prisma"));
 ({ workoutService } = require("../src/services/workoutService"));
 const { app } = require("../src/app");
 server = app.listen(0, "127.0.0.1");
 await new Promise(resolve => server.once("listening", resolve));
 base = "http://127.0.0.1:" + server.address().port + "/api";
 owner = await request("/auth/register", { method: "POST", body: { email: "owner@test.invalid", name: "Owner", password } });
 other = await request("/auth/register", { method: "POST", body: { email: "other@test.invalid", name: "Other", password } });
 assert.equal(owner.status, 201);
 assert.equal(other.status, 201);
 for (const email of ["owner@test.invalid", "other@test.invalid"]) {
  const confirmation = await request("/auth/verify-email", { method: "POST", body: { token: mailToken(email, "verify-email") } });
  assert.equal(confirmation.status, 200);
 }
 owner = await request("/auth/login", { method: "POST", body: { email: "owner@test.invalid", password } });
 other = await request("/auth/login", { method: "POST", body: { email: "other@test.invalid", password } });
 category = await prisma.category.create({ data: { name: "Owner category", userId: owner.body.data.user.id, isCustom: true } });
});
after(async () => {
 fs.rmSync(previewDir, { recursive: true });
 if (server) await new Promise(resolve => server.close(resolve));
 if (prisma) await prisma.$disconnect();
 if (admin) {
  // Only the random schema created by this test can be removed.
  assert.match(schema, /^fittrack_test_[a-f0-9]{32}$/);
  await admin.query('SET search_path TO public');
  await admin.query('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE');
  await admin.end();
 }
});
const exercise = date => ({ name: "Test exercise", isCompound: true, categoryId: category.id, date,
 sets: [{ setNumber: 1, weight: 0, repsCount: 0 }] });

test("migration chain preserves the Moscow calendar day and matches new schema", async () => {
 const legacy = await prisma.workout.findUnique({ where: { id: "legacy-day" } });
 assert.equal(legacy.date.toISOString(), "2026-09-01T00:00:00.000Z");
 assert.equal(legacy.month, 9);
 const columns = await admin.query("SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name='Exercise'", [schema]);
 assert.equal(columns.rows.some(row => row.column_name === "repsCount"), false);
});
test("foreign category is rejected without creating a workout", async () => {
 const result = await request("/workout/exercises", { method: "POST", token: other.body.data.accessToken, body: exercise("2026-09-02") });
 assert.equal(result.status, 403);
 assert.equal(await prisma.workout.count({ where: { userId: other.body.data.user.id } }), 0);
});
test("concurrent additions create one day and two exercises", async () => {
 const results = await Promise.all([1, 2].map(() => request("/workout/exercises", { method: "POST", token: owner.body.data.accessToken, body: exercise("2026-09-03") })));
 assert.deepEqual(results.map(r => r.status), [201, 201]);
 assert.equal(await prisma.workout.count({ where: { userId: owner.body.data.user.id } }), 1);
 assert.equal(await prisma.exercise.count({ where: { workout: { userId: owner.body.data.user.id } } }), 2);
});
test("ownership checks protect PATCH and DELETE; legacy archived workouts remain editable", async () => {
 const result = await request("/workout/exercises", { method: "POST", token: owner.body.data.accessToken, body: exercise("2026-09-04") });
 const ex = result.body.data, set = ex.sets[0];
 await prisma.workout.update({where:{id:ex.workoutId},data:{isArchived:true}});
 assert.equal((await request("/workout/archive", {method:"POST",token:owner.body.data.accessToken,body:{workoutId:ex.workoutId,isArchived:true}})).status,404);
 assert.equal((await request("/workout/sets/" + set.id, { method: "PATCH", token: other.body.data.accessToken, body: { weight: 10 } })).status, 404);
 assert.equal((await request("/workout/exercises/" + ex.id, { method: "DELETE", token: other.body.data.accessToken })).status, 404);
 for (const body of [{ weight: -1 }, { repsCount: -1 }, { repsCount: 1.5 }, { weight: null }, { weight: "" }, {}]) {
  assert.equal((await request("/workout/sets/" + set.id, { method: "PATCH", token: owner.body.data.accessToken, body })).status, 400);
 }
 assert.equal((await request("/workout/sets/" + set.id, { method: "PATCH", token: owner.body.data.accessToken, body: { weight: 12.5, repsCount: 8 } })).status, 200);
 assert.equal((await request("/workout/exercises/" + ex.id, { method: "DELETE", token: owner.body.data.accessToken })).status, 200);
 assert.equal(await prisma.workout.count({ where: { id: ex.workoutId } }), 0);
});
test("invalid exercise rolls back newly-created workout", async () => {
 const input = exercise("2026-09-05");
 // Force a database failure after workout creation, bypassing service validation.
 const { workoutRepository } = require("../src/repositories/workoutRepository");
 await assert.rejects(workoutRepository.createExerciseForDay(owner.body.data.user.id, { ...input, isFailure: false, isDropSet: false, sets: [{ setNumber: 1, weight: 0, repsCount: 2147483648 }] }));
 assert.equal(await prisma.workout.count({ where: { userId: owner.body.data.user.id, date: new Date("2026-09-05") } }), 0);
});
test("calendar is date-only and query validation returns JSON", async () => {
 const result = await request("/workout/calendar?month=9&year=2026", { token: owner.body.data.accessToken });
 assert.equal(result.status, 200);
 assert.equal(result.body.data[0].date, "2026-09-03");
 assert.equal((await request("/workout/calendar?month=13&year=2026", { token: owner.body.data.accessToken })).status, 400);
 assert.equal((await request("/missing")).status, 404);
});
test("weight goal is private, persistent and keeps its baseline until the target changes", async () => {
 const token = owner.body.data.accessToken;
 assert.equal((await request("/profile/weight")).status, 401);
 assert.equal((await request("/profile/weight", {method:"PUT", token, body:{currentWeight:-1,targetWeight:70}})).status, 400);
 let result = await request("/profile/weight", {method:"PUT", token, body:{currentWeight:90,targetWeight:80}});
 assert.equal(result.status,200);
 assert.equal(result.body.data.startWeight,90);
 result = await request("/profile/weight", {method:"PUT", token, body:{currentWeight:85,targetWeight:80}});
 assert.equal(result.body.data.startWeight,90);
 assert.equal((await request("/profile/weight",{token})).body.data.currentWeight,85);
 assert.equal((await request("/profile/weight",{token:other.body.data.accessToken})).body.data,null);
 result = await request("/profile/weight", {method:"PUT", token, body:{currentWeight:85,targetWeight:95}});
 assert.equal(result.body.data.startWeight,85);
});

test("set removal checks owner, renumbers and allows recovery after the final set", async () => {
 const token = owner.body.data.accessToken;
 const input = {...exercise("2026-09-12"),sets:[{setNumber:1,weight:20,repsCount:12},{setNumber:2,weight:30,repsCount:10},{setNumber:3,weight:40,repsCount:8}]};
 const ex = (await request("/workout/exercises",{method:"POST",token,body:input})).body.data;
 const id = ex.sets[1].id;
 assert.equal((await request("/workout/sets/"+id,{method:"DELETE",token:other.body.data.accessToken})).status,404);
 let result = await request("/workout/sets/"+id,{method:"DELETE",token});
 assert.equal(result.status,200);
 assert.deepEqual(result.body.data.sets.map(s=>[s.setNumber,s.weight]),[[1,20],[2,40]]);
 for(const s of result.body.data.sets) await request("/workout/sets/"+s.id,{method:"DELETE",token});
 result = await request("/workout/exercises/"+ex.id+"/sets",{method:"POST",token});
 assert.equal(result.status,201); assert.equal(result.body.data.sets.length,1); assert.equal(result.body.data.sets[0].setNumber,1);
});

test("custom categories rename and transfer safely; foreign and shared categories stay protected", async () => {
 const token = owner.body.data.accessToken;
 const cat = (await request("/workout/categories",{method:"POST",token,body:{name:"Опечатка"}})).body.data;
 const shared = await prisma.category.create({data:{name:"Общая группа"}});
 assert.equal((await request("/workout/categories/"+cat.id,{method:"PATCH",token:other.body.data.accessToken,body:{name:"Чужое"}})).status,404);
 assert.equal((await request("/workout/categories/"+shared.id,{method:"DELETE",token})).status,404);
 assert.equal((await request("/workout/categories/"+cat.id,{method:"PATCH",token,body:{name:"Исправлено"}})).status,200);
 const ex = (await request("/workout/exercises",{method:"POST",token,body:{...exercise("2026-09-13"),categoryId:cat.id}})).body.data;
 assert.equal((await request("/workout/categories/"+cat.id,{method:"DELETE",token})).status,409);
 const transferred = await request("/workout/categories/"+cat.id,{method:"DELETE",token,body:{replacementCategoryId:shared.id}});
 assert.equal(transferred.status,200);
 assert.equal((await prisma.exercise.findUnique({where:{id:ex.id}})).categoryId,shared.id);
 assert.equal(await prisma.workoutSet.count({where:{exerciseId:ex.id}}),1);
 const empty = (await request("/workout/categories",{method:"POST",token,body:{name:"Пустая"}})).body.data;
 assert.equal((await request("/workout/categories/"+empty.id,{method:"DELETE",token})).status,200);
});

test("refresh restores user; logout revokes copied refresh and access tokens", async () => {
 const cookie = other.cookie.match(/refreshToken=([^;,]+)/)[0];
 const refreshed = await request("/auth/refresh", { method: "POST", cookie });
 assert.equal(refreshed.status, 200);
 assert.equal(refreshed.body.data.user.id, other.body.data.user.id);
 assert.equal((await request("/auth/logout", { method: "POST", cookie })).status, 200);
 assert.equal((await request("/auth/refresh", { method: "POST", cookie })).status, 401);
 assert.equal((await request("/workout/categories", { token: other.body.data.accessToken })).status, 401);
});
test("registration rejects a missing special character with structured JSON", async () => {
 const result = await request("/auth/register", { method: "POST", body: { email: "invalid@test.invalid", password: "Password123" } });
 assert.equal(result.status, 400);
 assert.ok(Array.isArray(result.body.error));
 assert.equal(typeof result.body.error[0].message, "string");
});
test("security headers, origin checks, body limits and CORS preflight", async () => {
 const health = await fetch(base.replace("/api", "") + "/healthz");
 assert.equal(health.status, 200);
 assert.equal(health.headers.get("x-powered-by"), null);
 assert.equal(health.headers.get("x-content-type-options"), "nosniff");
 const foreign = await fetch(base + "/auth/logout", {method:"POST",headers:{Origin:"https://attacker.invalid","Content-Type":"application/json"},body:"{}"});
 assert.equal(foreign.status,403);
 const preflight = await fetch(base + "/auth/login", {method:"OPTIONS",headers:{Origin:"http://127.0.0.1:5173","Access-Control-Request-Method":"POST"}});
 assert.equal(preflight.headers.get("access-control-allow-origin"),"http://127.0.0.1:5173");
 assert.equal(preflight.headers.get("access-control-allow-credentials"),"true");
 const plain = await fetch(base + "/auth/login", {method:"POST",headers:{"Content-Type":"text/plain"},body:"{}"});
 assert.equal(plain.status,415);
 const large = await fetch(base + "/auth/login", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:"x".repeat(40000)})});
 assert.equal(large.status,413);
 assert.equal(large.headers.get("cache-control"),"no-store");
 const malformed = await fetch(base + "/auth/login", {method:"POST",headers:{"Content-Type":"application/json"},body:"{"});
 assert.equal(malformed.status,400);
});
test("email verification and password reset use scoped one-time tokens and revoke sessions", async () => {
 const email = "new-account@test.invalid";
 const registered = await request("/auth/register", {method:"POST",body:{email,password,name:"New user"}});
 assert.equal(registered.status,201);
 assert.equal(registered.cookie,null);
 assert.equal(registered.body.data?.accessToken,undefined);
 assert.equal((await request("/auth/login",{method:"POST",body:{email,password}})).status,403);
 const verify = mailToken(email,"verify-email");
 const tokenRow = await prisma.emailToken.findFirst({where:{user:{email}}});
 assert.notEqual(tokenRow.tokenHash,verify);
 assert.equal((await request("/auth/reset-password",{method:"POST",body:{token:verify,password}})).status,400);
 assert.equal((await request("/auth/verify-email",{method:"POST",body:{token:verify}})).status,200);
 assert.equal((await request("/auth/verify-email",{method:"POST",body:{token:verify}})).status,400);
 const logged = await request("/auth/login",{method:"POST",body:{email,password}});
 assert.equal(logged.status,200);
 const resetRequest = await request("/auth/forgot-password",{method:"POST",body:{email}});
 const unknown = await request("/auth/forgot-password",{method:"POST",body:{email:"missing@test.invalid"}});
 assert.deepEqual(resetRequest.body,unknown.body);
 const reset = mailToken(email,"reset-password");
 const count = fs.readdirSync(previewDir).length;
 await request("/auth/forgot-password",{method:"POST",body:{email}});
 assert.equal(fs.readdirSync(previewDir).length,count,"one-minute email cooldown");
 const newPassword = "Different123!";
 assert.equal((await request("/auth/reset-password",{method:"POST",body:{token:reset,password:"weak"}})).status,400);
 const results = await Promise.all([1,2].map(() => request("/auth/reset-password",{method:"POST",body:{token:reset,password:newPassword}})));
 assert.deepEqual(results.map(r=>r.status).sort(),[200,400]);
 assert.equal((await request("/auth/refresh",{method:"POST",cookie:logged.cookie.split(";")[0]})).status,401);
 assert.equal((await request("/profile/weight",{token:logged.body.data.accessToken})).status,401);
 assert.equal((await request("/auth/login",{method:"POST",body:{email,password}})).status,401);
 assert.equal((await request("/auth/login",{method:"POST",body:{email,password:newPassword}})).status,200);
 // Create another reset through the service so the IP limit remains available for unrelated tests.
 const {requestAccountMail} = require("../src/services/emailTokenService");
 await requestAccountMail(email,"reset");
 const expired = mailToken(email,"reset-password");
 await prisma.emailToken.updateMany({where:{user:{email}},data:{expiresAt:new Date(0)}});
 assert.equal((await request("/auth/reset-password",{method:"POST",body:{token:expired,password}})).status,400);
});

test("disabled email features allow registration and existing unverified users without sending mail", async () => {
 process.env.EMAIL_AUTH_ENABLED = "false";
 try {
  const count = fs.readdirSync(previewDir).length;
  const email = "no-mail@test.invalid";
  const result = await request("/auth/register", {method:"POST",body:{email,password,name:"No mail"}});
  assert.equal(result.status,201);
  assert.ok(result.body.data.accessToken);
  assert.ok(result.cookie);
  const user = await prisma.user.findUnique({where:{email}});
  assert.equal(user.emailVerifiedAt,null,"do not falsely mark email verified");
  assert.equal((await request("/auth/login",{method:"POST",body:{email,password}})).status,200);
  assert.equal((await request("/auth/register",{method:"POST",body:{email,password,name:"Duplicate"}})).status,409);
  assert.equal((await request("/auth/forgot-password",{method:"POST",body:{email}})).status,404);
  assert.equal(fs.readdirSync(previewDir).length,count);
 } finally { process.env.EMAIL_AUTH_ENABLED = "true"; }
});

test("production configuration fails closed and bcrypt rejects oversized UTF-8 passwords", async () => {
 const { registerSchema } = require("../src/validation/auth.validation");
 assert.equal(registerSchema.safeParse({email:"x@y.com",password:"Aa1!"+"😀".repeat(16)+"абвг"}).success,false);
 const {spawnSync} = require("node:child_process");
 const result = spawnSync(process.execPath,["-r","ts-node/register","-e","require('./src/configs/environment').validateEnvironment()"],{cwd:path.join(__dirname,".."),env:{...process.env,NODE_ENV:"production",FRONTEND_ORIGINS:"",ACCESS_TOKEN_SECRET:"short",REFRESH_TOKEN_SECRET:"short"}});
 assert.notEqual(result.status,0);
});
test("repeated invalid login attempts are throttled", async () => {
 let response;
 for (let i=0; i<22; i++) response = await request("/auth/login",{method:"POST",body:{}});
 assert.equal(response.status,429);
});
test("seed is repeatable and creates no users or workouts", async () => {
 const {spawnSync} = require("node:child_process");
 const users = await prisma.user.count(), workouts = await prisma.workout.count();
 for (let i=0; i<2; i++) {
  const run = spawnSync(process.execPath,["-r","ts-node/register","prisma/seed.ts"],{cwd:path.join(__dirname,".."),env:process.env});
  assert.equal(run.status,0,run.stderr?.toString());
 }
 assert.equal(await prisma.user.count(),users);
 assert.equal(await prisma.workout.count(),workouts);
 assert.equal(await prisma.category.count({where:{userId:null,isCustom:false,name:{in:["Грудь","Спина","Ноги","Плечи","Руки","Корпус"]}}}),6);
});
