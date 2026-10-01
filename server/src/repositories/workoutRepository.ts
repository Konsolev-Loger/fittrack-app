import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";
import type { CreateExerciseInput, SetUpdateInput } from "../validation/workout.validation";

class WorkoutRepository {
 getCategories(userId: string) {
  return prisma.category.findMany({ where: { OR: [{ isCustom: false, userId: null }, { userId }] }, orderBy: { name: "asc" } });
 }
 async changeSets(userId: string, id: string, action: "add" | "delete") {
  return prisma.$transaction(async tx => {
   await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
   const target = action === "delete" ? await tx.workoutSet.findFirst({ where: { id, exercise: { workout: { userId } } } }) : null;
   if (action === "delete" && !target) throw new HttpError(404, "Подход не найден");
   const exercise = await tx.exercise.findFirst({ where: { id: target?.exerciseId ?? id, workout: { userId } }, include: { workout: true } });
   if (!exercise) throw new HttpError(404, "Упражнение не найдено");
   if (exercise.durationMinutes !== null) throw new HttpError(400, "Для этой записи укажите время вместо подходов");
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
 async createWorkout(userId: string, name: string, dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const dayOffset = (new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),1)).getUTCDay()+6)%7;
  const workout = await prisma.workout.create({data:{userId,name,date,month:date.getUTCMonth()+1,year:date.getUTCFullYear(),weekNumber:Math.ceil((date.getUTCDate()+dayOffset)/7)},include:{exercises:true}});
  return {...workout,date:dateKey};
 }
 async removeEmptyWorkout(userId: string, id: string) {
  return prisma.$transaction(async tx => {
   await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
   const result = await tx.workout.deleteMany({where:{id,userId,exercises:{none:{}}}});
   if (!result.count) throw new HttpError(409, "Можно удалить только свою пустую тренировку");
   return {id};
  });
 }
 async createExerciseForDay(userId: string, input: CreateExerciseInput) {
  return prisma.$transaction(async tx => {
   // All workout mutations take this lock, including set updates.
   await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
   const date = new Date(`${input.date}T00:00:00.000Z`);
   let workout = input.workoutId ? await tx.workout.findFirst({where:{id:input.workoutId,userId,date}}) : null;
   if (input.workoutId && !workout) throw new HttpError(404, "Тренировка не найдена");
   const defaultCategory = input.durationMinutes !== undefined ? "Кардио" : "Без группы";
   const category = input.categoryId && input.durationMinutes === undefined
    ? await tx.category.findFirst({where:{id:input.categoryId,OR:[{userId},{isCustom:false,userId:null}]}})
    : await tx.category.findFirst({where:{userId,isCustom:true,name:defaultCategory}}) ?? await tx.category.create({data:{userId,isCustom:true,name:defaultCategory}});
   if (!category) throw new HttpError(403, "Категория недоступна");
   if (!workout) {
    // Compatibility for earlier clients: keep their unnamed daily workout.
    workout = await tx.workout.findFirst({where:{userId,date,name:null},orderBy:{createdAt:"asc"}});
    if (!workout) {
     const dayOffset = (new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).getUTCDay() + 6) % 7;
     workout = await tx.workout.create({data:{userId,date,month:date.getUTCMonth()+1,year:date.getUTCFullYear(),weekNumber:Math.ceil((date.getUTCDate()+dayOffset)/7)}});
    }
   }
   const { date: _date, workoutId: _workoutId, sets, ...data } = input;
   return tx.exercise.create({ data: { ...data, categoryId: category.id, workoutId: workout.id, sets: { create: sets } }, include: { category: true, sets: { orderBy: { setNumber: "asc" } } } });
  });
 }
 getWorkoutWithExercises(userId: string, month: number, year: number) {
  return prisma.workout.findMany({ where: { userId, month, year }, orderBy: [{ date: "asc" }, {createdAt:"asc"}, {id:"asc"}],
   include: { exercises: { orderBy: [{ createdAt: "asc" }, { id: "asc" }], include: { category: true, sets: { orderBy: { setNumber: "asc" } } } } } });
 }
 async deleteExercise(exerciseId: string, userId: string) {
  return prisma.$transaction(async tx => {
   await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
   const exercise = await tx.exercise.findFirst({ where: { id: exerciseId, workout: { userId } }, include: { workout: true } });
   if (!exercise) throw new HttpError(404, "Упражнение не найдено");
   await tx.exercise.delete({ where: { id: exerciseId } });
   await tx.workout.deleteMany({ where: { id: exercise.workoutId, userId, name: null, exercises: { none: {} } } });
   return { exerciseId };
  });
 }
 async updateDuration(id: string, userId: string, data: {durationMinutes?: number; distanceKm?: number | null}) {
  const result = await prisma.exercise.updateMany({where:{id,workout:{userId},durationMinutes:{not:null}},data});
  if (!result.count) throw new HttpError(404, "Запись по времени не найдена");
  return {id,...data};
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
