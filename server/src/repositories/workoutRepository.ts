import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";
import type { CreateExerciseInput, SetUpdateInput } from "../validation/workout.validation";

class WorkoutRepository {
 getCategories(userId: string) {
  return prisma.category.findMany({ where: { OR: [{ isCustom: false, userId: null }, { userId }] }, orderBy: { name: "asc" } });
 }
 createCategory(name: string, userId: string) { return prisma.category.create({ data: { name, isCustom: true, userId } }); }
 async renameCategory(id: string, userId: string, name: string) {
  const result = await prisma.category.updateMany({ where: { id, userId, isCustom: true }, data: { name } });
  if (!result.count) throw new HttpError(404, "Своя категория не найдена");
  return { id, name };
 }
 async deleteCategory(id: string, userId: string, replacementCategoryId?: string) {
  return prisma.$transaction(async tx => {
   await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
   const category = await tx.category.findFirst({ where: { id, userId, isCustom: true } });
   if (!category) throw new HttpError(404, "Своя категория не найдена");
   if (replacementCategoryId === id) throw new HttpError(400, "Выберите другую категорию");
   if (replacementCategoryId) {
    const replacement = await tx.category.findFirst({ where: { id: replacementCategoryId, OR: [{ userId }, { userId: null, isCustom: false }] } });
    if (!replacement) throw new HttpError(403, "Категория для переноса недоступна");
   }
   const used = await tx.exercise.count({ where: { categoryId: id } });
   if (used && !replacementCategoryId) throw new HttpError(409, "Категория используется. Выберите, куда перенести упражнения.");
   if (replacementCategoryId) await tx.exercise.updateMany({ where: { categoryId: id, workout: { userId } }, data: { categoryId: replacementCategoryId } });
   await tx.category.delete({ where: { id } });
   return { categoryId: id };
  });
 }
 async changeSets(userId: string, id: string, action: "add" | "delete") {
  return prisma.$transaction(async tx => {
   await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
   const target = action === "delete" ? await tx.workoutSet.findFirst({ where: { id, exercise: { workout: { userId } } } }) : null;
   if (action === "delete" && !target) throw new HttpError(404, "Подход не найден");
   const exercise = await tx.exercise.findFirst({ where: { id: target?.exerciseId ?? id, workout: { userId } }, include: { workout: true } });
   if (!exercise) throw new HttpError(404, "Упражнение не найдено");
   if (action === "delete") await tx.workoutSet.delete({ where: { id } });
   const sets = await tx.workoutSet.findMany({ where: { exerciseId: exercise.id }, orderBy: [{ setNumber: "asc" }, { id: "asc" }] });
   if (action === "add" && sets.length >= 100) throw new HttpError(409, "Можно добавить не больше 100 подходов");
   for (let i = 0; i < sets.length; i++) {
    if (sets[i]!.setNumber !== i + 1) await tx.workoutSet.update({ where: { id: sets[i]!.id }, data: { setNumber: i + 1 } });
   }
   if (action === "add") await tx.workoutSet.create({ data: { exerciseId: exercise.id, setNumber: sets.length + 1, weight: 0, repsCount: 0 } });
   return { exerciseId: exercise.id, sets: await tx.workoutSet.findMany({ where: { exerciseId: exercise.id }, orderBy: { setNumber: "asc" } }) };
  });
 }
 async createExerciseForDay(userId: string, input: CreateExerciseInput) {
  return prisma.$transaction(async tx => {
   // All workout mutations take this lock, including set updates.
   await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
   const category = await tx.category.findFirst({ where: { id: input.categoryId, OR: [{ isCustom: false, userId: null }, { userId }] } });
   if (!category) throw new HttpError(403, "Категория недоступна");
   const date = new Date(`${input.date}T00:00:00.000Z`);
   const dayOffset = (new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).getUTCDay() + 6) % 7;
   const workout = await tx.workout.upsert({
    where: { userId_date: { userId, date } }, update: {},
    create: { userId, date, month: date.getUTCMonth() + 1, year: date.getUTCFullYear(), weekNumber: Math.ceil((date.getUTCDate() + dayOffset) / 7) },
   });
   const { date: _date, sets, ...data } = input;
   return tx.exercise.create({ data: { ...data, workoutId: workout.id, sets: { create: sets } }, include: { category: true, sets: { orderBy: { setNumber: "asc" } } } });
  });
 }
 getWorkoutWithExercises(userId: string, month: number, year: number) {
  return prisma.workout.findMany({ where: { userId, month, year }, orderBy: { date: "asc" },
   include: { exercises: { orderBy: [{ createdAt: "asc" }, { id: "asc" }], include: { category: true, sets: { orderBy: { setNumber: "asc" } } } } } });
 }
 async deleteExercise(exerciseId: string, userId: string) {
  return prisma.$transaction(async tx => {
   await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
   const exercise = await tx.exercise.findFirst({ where: { id: exerciseId, workout: { userId } }, include: { workout: true } });
   if (!exercise) throw new HttpError(404, "Упражнение не найдено");
   await tx.exercise.delete({ where: { id: exerciseId } });
   await tx.workout.deleteMany({ where: { id: exercise.workoutId, userId, exercises: { none: {} } } });
   return { exerciseId };
  });
 }
 async updateSet(setId: string, userId: string, data: SetUpdateInput) {
  return prisma.$transaction(async tx => {
   await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
   const set = await tx.workoutSet.findFirst({ where: { id: setId, exercise: { workout: { userId } } }, include: { exercise: { include: { workout: true } } } });
   if (!set) throw new HttpError(404, "Подход не найден");
   return tx.workoutSet.update({ where: { id: setId }, data });
  });
 }
}
export const workoutRepository = new WorkoutRepository();
