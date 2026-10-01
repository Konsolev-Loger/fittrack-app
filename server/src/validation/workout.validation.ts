import { z } from "zod";
export const createCategorySchema = z.object({ name: z.string().trim().min(2).max(30) });
export const setValuesSchema = z.object({ weight: z.number().min(0).max(10000), repsCount: z.number().int().min(0).max(10000) });
export const updateSetSchema = setValuesSchema.partial().strict().refine(
 data => data.weight !== undefined || data.repsCount !== undefined, "Укажите вес или повторения");
export const createExerciseSchema = z.object({
 workoutId: z.uuid().optional(), distanceKm: z.number().min(0).max(1000).optional(),
 name: z.string().trim().min(2).max(150), description: z.string().trim().max(2000).optional(),
 isCompound: z.boolean(), isFailure: z.boolean().default(false), isDropSet: z.boolean().default(false),
 durationMinutes: z.number().int().min(1).max(1440).optional(),
 categoryId: z.uuid().optional(), date: z.iso.date().refine(value => Number(value.slice(0,4)) >= 1900, "Год должен быть не раньше 1900"),
 sets: z.array(setValuesSchema.extend({ setNumber: z.number().int().min(1).max(100) })).max(100)
  .refine(sets => new Set(sets.map(s => s.setNumber)).size === sets.length, "Номера подходов должны быть уникальны"),
}).superRefine((data, ctx) => {
 if (data.durationMinutes !== undefined) {
  if (data.sets.length || data.isCompound || data.isFailure || data.isDropSet) ctx.addIssue({code:"custom", message:"Для записи по времени подходы и силовые признаки не нужны"});
 } else if (data.distanceKm !== undefined || (!data.categoryId && !data.workoutId) || !data.sets.length) ctx.addIssue({code:"custom", message:"Выберите группу мышц и добавьте подход"});
});
export const durationSchema = z.object({durationMinutes: z.number().int().min(1).max(1440).optional(), distanceKm: z.number().min(0).max(1000).nullable().optional()}).strict().refine(data => data.durationMinutes !== undefined || data.distanceKm !== undefined, "Укажите время или расстояние");
export const createWorkoutSchema = z.object({name:z.string().trim().min(2).max(100), date:z.iso.date().refine(value=>Number(value.slice(0,4))>=1900)}).strict();
export const calendarQuerySchema = z.object({ month: z.coerce.number().int().min(1).max(12), year: z.coerce.number().int().min(1900).max(9999) });
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type SetUpdateInput = z.infer<typeof updateSetSchema>;
