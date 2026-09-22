import { Router } from "express";
import { z } from "zod";
import { verifyAccessToken } from "../tokens/veryfyToken";
import { prisma } from "../utils/prisma";
import formatResponse from "../utils/formatResponse";

const router = Router();
const weight = z.number().positive().max(1000);
const goalSchema = z.object({ currentWeight: weight, targetWeight: weight }).strict();
router.use(verifyAccessToken);
router.get("/weight", async (_req, res) => {
 const goal = await prisma.weightGoal.findUnique({ where: { userId: res.locals.userId } });
 res.json(formatResponse(200, "Цель загружена", goal));
});
router.put("/weight", async (req, res) => {
 const input = goalSchema.parse(req.body);
 const userId: string = res.locals.userId;
 const goal = await prisma.$transaction(async tx => {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
  const previous = await tx.weightGoal.findUnique({ where: { userId } });
  const startWeight = !previous || previous.targetWeight !== input.targetWeight ? input.currentWeight : previous.startWeight;
  return tx.weightGoal.upsert({ where: { userId }, create: { userId, ...input, startWeight }, update: { ...input, startWeight } });
 });
 res.json(formatResponse(200, "Вес и цель сохранены", goal));
});
export default router;
