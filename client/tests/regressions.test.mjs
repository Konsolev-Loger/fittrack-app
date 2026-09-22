import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
let server, store, auth, api, original;
const values = new Map();
const memoryStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
Object.defineProperty(globalThis, "localStorage", { value: memoryStorage, configurable: true });
globalThis.window = { localStorage: memoryStorage };
before(async () => {
 server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
 ({ useWorkoutStore: store } = await server.ssrLoadModule("/src/store/workoutStore.ts"));
 ({ useAuthStore: auth } = await server.ssrLoadModule("/src/store/authStore.ts"));
 ({ axiosInstance: api } = await server.ssrLoadModule("/src/api/axiosInstance.ts"));
 original = { get: api.get, post: api.post, patch: api.patch };
});
after(async () => { Object.assign(api, original); await server?.close(); delete globalThis.localStorage; delete globalThis.window; });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
test("validation error arrays become readable strings", async () => {
 const { getErrorMessage } = await server.ssrLoadModule("/src/utils/errors.ts");
 assert.equal(getErrorMessage({ isAxiosError: true, response: { data: { error: [{ field: "password", message: "Нужен спецсимвол" }] } } }), "Нужен спецсимвол");
});
test("calendar browsing does not replace selected-day workouts", async () => {
 store.getState().reset();
 store.setState({ monthlyWorkouts: [{ id: "selected", date: "2026-09-01", exercises: [] }] });
 api.get = async () => ({ data: { data: [{ id: "calendar", date: "2026-10-01" }] } });
 await store.getState().fetchCalendarData(10, 2026);
 assert.equal(store.getState().monthlyWorkouts[0].id, "selected");
 assert.equal(store.getState().calendarWorkouts[0].id, "calendar");
});
test("late monthly responses cannot overwrite a newer month", async () => {
 store.getState().reset();
 const old = deferred(), latest = deferred();
 api.get = (_url, config) => config.params.month === 9 ? old.promise : latest.promise;
 const first = store.getState().fetchMonthlyData(9, 2026), second = store.getState().fetchMonthlyData(10, 2026);
 latest.resolve({ data: { data: [{ id: "new" }] } }); await second;
 old.resolve({ data: { data: [{ id: "old" }] } }); await first;
 assert.equal(store.getState().monthlyWorkouts[0].id, "new");
});
test("session reset clears private state and discards in-flight responses", async () => {
 const pending = deferred();
 api.get = () => pending.promise;
 const fetching = store.getState().fetchCategories();
 auth.getState().resetAuth();
 pending.resolve({ data: { data: [{ id: "previous-user" }] } }); await fetching;
 assert.deepEqual(store.getState().categories, []);
 assert.deepEqual(store.getState().monthlyWorkouts, []);
});
test("set saves are serialized and failed writes leave confirmed state unchanged", async () => {
 store.getState().reset();
 store.setState({ monthlyWorkouts: [{ id: "day", exercises: [{ id: "exercise", sets: [{ id: "set", weight: 5, repsCount: 3 }] }] }] });
 const pending = deferred(), calls = [];
 api.patch = async (_url, data) => { calls.push(data.weight); if (calls.length === 1) return pending.promise; throw new Error("Offline"); };
 const first = store.getState().updateSetData("set", "exercise", { weight: 10 });
 const second = store.getState().updateSetData("set", "exercise", { weight: 20 });
 await new Promise(resolve => setTimeout(resolve, 0));
 assert.deepEqual(calls, [10]);
 assert.equal(store.getState().monthlyWorkouts[0].exercises[0].sets[0].weight, 5);
 pending.resolve({ data: { data: { id: "set", weight: 10, repsCount: 3 } } });
 assert.equal(await first, true); assert.equal(await second, false);
 assert.deepEqual(calls, [10, 20]);
 assert.equal(store.getState().monthlyWorkouts[0].exercises[0].sets[0].weight, 10);
 assert.equal(store.getState().error, "Offline");
});
test("refresh requests share one promise and persist the new token", async () => {
 const { refreshSession } = await server.ssrLoadModule("/src/api/axiosInstance.ts");
 const pending = deferred(); let calls = 0;
 api.post = () => { calls++; return pending.promise; };
 auth.setState({error:"Network Error"});
 const first = refreshSession(), second = refreshSession();
 assert.equal(calls, 1);
 pending.resolve({ data: { statusCode: 200, data: { accessToken: "fresh", user: { id: "user", name: null, email: "a@b.c" } } } });
 assert.equal(await first, "fresh"); assert.equal(await second, "fresh");
 assert.equal(auth.getState().accessToken, "fresh");
 assert.equal(auth.getState().error, null);
 assert.equal(JSON.parse(values.get("auth-storage")).state.accessToken, undefined);
});
test("refresh completed after logout cannot restore the old session", async () => {
 const { refreshSession } = await server.ssrLoadModule("/src/api/axiosInstance.ts");
 const pending = deferred(); api.post = () => pending.promise;
 const refreshing = refreshSession();
 auth.getState().resetAuth();
 pending.resolve({ data: { statusCode: 200, data: { accessToken: "old", user: { id: "old" } } } });
 await assert.rejects(refreshing);
 assert.equal(auth.getState().accessToken, null);
});
test("calendar-day serialization does not convert local midnight into UTC", async () => {
 const { dateKey, localDate } = await server.ssrLoadModule("/src/utils/dates.ts");
 assert.equal(dateKey(new Date(2026, 8, 1)), "2026-09-01");
 assert.equal(dateKey(localDate("2026-09-01")), "2026-09-01");
 const legacy = new Date(2026, 8, 1);
 assert.equal(dateKey(localDate(legacy.toISOString())), "2026-09-01");
});
test("first visit without a session shows the login screen without an error", async () => {
 api.post = async () => { throw { isAxiosError: true, response: { status: 401 } }; };
 assert.equal(await auth.getState().refreshTokens(), false);
 assert.equal(auth.getState().isAuthenticated, false);
 assert.equal(auth.getState().isInitialized, true);
 assert.equal(auth.getState().error, null);
});
test("registration waits for email verification without authenticating or storing tokens", async () => {
 auth.getState().resetAuth();
 api.post = async () => ({data:{statusCode:201,message:"Check email"}});
 const message = await auth.getState().register({name:"New",email:"new@test.invalid",password:"Password123!"});
 assert.equal(message,"Check email");
 assert.equal(auth.getState().isAuthenticated,false);
 assert.equal(auth.getState().accessToken,null);
 assert.equal(auth.getState().user,null);
});
test("registration without email confirmation opens an authenticated session", async () => {
 auth.getState().resetAuth();
 api.post = async () => ({data:{statusCode:201,message:"Created",data:{user:{id:"new",email:"new@test.invalid",name:"New"},accessToken:"session-token"}}});
 await auth.getState().register({name:"New",email:"new@test.invalid",password:"Password123!"});
 assert.equal(auth.getState().isAuthenticated,true);
 assert.equal(auth.getState().accessToken,"session-token");
 auth.getState().resetAuth();
});
