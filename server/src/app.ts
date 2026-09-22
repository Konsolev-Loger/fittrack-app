import "dotenv/config";
import express from "express";
import serverConfig from "./configs/serverConfig";
import authRouter from "./routes/authRouter";
import workoutRouter from "./routes/workoutRoutes";
import profileRouter from "./routes/profileRouter";
import { errorHandler } from "./middlewares/errorHandler";
import formatResponse from "./utils/formatResponse";
import { prisma } from "./utils/prisma";
import { validateEnvironment } from "./configs/environment";
validateEnvironment();
export const app = express();
serverConfig(app);
app.get("/healthz", (_req, res) => res.json({status:"ok"}));
app.get("/readyz", async (_req, res) => { await prisma.$queryRaw`SELECT 1`; res.json({status:"ok"}); });
app.use("/api/auth", authRouter);
app.use("/api/workout", workoutRouter);
app.use("/api/profile", profileRouter);
app.use((_req, res) => { res.status(404).json(formatResponse(404, "Маршрут не найден")); });
app.use(errorHandler);
if (require.main === module) {
 for (const key of ["ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"]) {
  if (!process.env[key]) throw new Error(`${key} is required`);
 }
 const server = app.listen(process.env.PORT || 3000, () => console.log("Server started"));
 const shutdown = () => server.close(() => { void prisma.$disconnect().finally(() => process.exit(0)); });
 process.once("SIGINT", shutdown);
 process.once("SIGTERM", shutdown);
}
