import { z } from "zod";
export const createCategorySchema = z.object({ name: z.string().trim().min(2).max(30) });
export const setValuesSchema = z.object({ weight: z.number().min(0).max(10000), repsCount: z.number().int().min(0).max(10000) });
export const updateSetSchema = setValuesSchema.partial().strict().refine(
 data => data.weight !== undefined || data.repsCount !== undefined, "Укажите вес или повторения");
export const createExerciseSchema = z.object({
 name: z.string().trim().min(2).max(150), description: z.string().trim().max(2000).optional(),
 isCompound: z.boolean(), isFailure: z.boolean().default(false), isDropSet: z.boolean().default(false),
 categoryId: z.uuid(), date: z.iso.date().refine(value => Number(value.slice(0,4)) >= 1900, "Год должен быть не раньше 1900"),
 sets: z.array(setValuesSchema.extend({ setNumber: z.number().int().min(1).max(100) })).min(1).max(100)
  .refine(sets => new Set(sets.map(s => s.setNumber)).size === sets.length, "Номера подходов должны быть уникальны"),
});
export const calendarQuerySchema = z.object({ month: z.coerce.number().int().min(1).max(12), year: z.coerce.number().int().min(1900).max(9999) });
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type SetUpdateInput = z.infer<typeof updateSetSchema>;
