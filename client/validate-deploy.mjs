import { readFileSync } from "node:fs";
// Fail closed on Vercel instead of publishing a frontend with a broken API.
if (process.env.VERCEL) {
 const config = JSON.parse(readFileSync(new URL("./vercel.json", import.meta.url)));
 const destination = config.rewrites.find(rule => rule.source === "/api/:path*")?.destination;
 const url = new URL(destination || "");
 if (url.protocol !== "https:" || url.hostname.endsWith(".invalid") || url.username || url.password)
  throw new Error("Set a real HTTPS API host in client/vercel.json before deploying.");
}
