import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const schema = new URL(process.env.DATABASE_URL).searchParams.get("schema") || "public";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL }, { schema });
export const prisma = new PrismaClient({ adapter });
