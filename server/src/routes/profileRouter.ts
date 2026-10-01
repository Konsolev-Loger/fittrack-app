import { Router } from "express";
import { z } from "zod";
import { verifyAccessToken } from "../tokens/veryfyToken";
import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";
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
const noteSchema=z.object({content:z.string().trim().min(1,"Напишите заметку").max(5000)}).strict();
router.get("/notes",async (_req,res)=>{
 const notes=await prisma.personalNote.findMany({where:{userId:res.locals.userId},orderBy:[{updatedAt:"desc"},{id:"asc"}]});
 res.json(formatResponse(200,"Заметки загружены",notes));
});
router.post("/notes",async (req,res)=>{
 const input=noteSchema.parse(req.body);
 const note=await prisma.personalNote.create({data:{...input,userId:res.locals.userId}});
 res.status(201).json(formatResponse(201,"Заметка сохранена",note));
});
router.patch("/notes/:id",async (req,res)=>{
 const id=z.uuid().parse(req.params.id), input=noteSchema.parse(req.body);
 const note=await prisma.$transaction(async tx=>{
  const updated=await tx.personalNote.updateMany({where:{id,userId:res.locals.userId},data:input});
  if(!updated.count)throw new HttpError(404,"Заметка не найдена");
  return tx.personalNote.findFirstOrThrow({where:{id,userId:res.locals.userId}});
 });
 res.json(formatResponse(200,"Заметка сохранена",note));
});
router.delete("/notes/:id",async (req,res)=>{
 const id=z.uuid().parse(req.params.id);
 const deleted=await prisma.personalNote.deleteMany({where:{id,userId:res.locals.userId}});
 if(!deleted.count)throw new HttpError(404,"Заметка не найдена");
 res.json(formatResponse(200,"Заметка удалена",{id}));
});
export default router;
