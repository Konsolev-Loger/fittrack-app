import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import corsConfig from "./corsConfig";
import { production } from "./environment";
import { apiLimiter, protectBrowserWrites } from "../middlewares/security";
export default function serverConfig(app: express.Express): void {
 app.disable("x-powered-by");
 app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || "0"));
 app.use(helmet({ strictTransportSecurity: production ? { maxAge: 31536000 } : false }));
 app.use(cors(corsConfig));
 app.use(morgan(production ? "tiny" : "dev"));
 app.use("/api", (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
 app.use("/api", apiLimiter, protectBrowserWrites);
 app.use(express.json({limit:"32kb"}));
 app.use(cookieParser());
}
