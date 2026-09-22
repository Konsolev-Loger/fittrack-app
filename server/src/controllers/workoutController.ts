import type { Request, Response } from "express";
import { z } from "zod";
import { workoutService } from "../services/workoutService";
import { calendarQuerySchema } from "../validation/workout.validation";
import formatResponse from "../utils/formatResponse";
class WorkoutController {
 async getCategories(_req: Request, res: Response) {
  res.json(formatResponse(200, "Категории загружены", await workoutService.getAllCategories(res.locals.userId)));
 }
 async createCategory(req: Request, res: Response) {
  res.status(201).json(formatResponse(201, "Категория добавлена", await workoutService.addCustomCategory(req.body.name, res.locals.userId)));
 }
 async addExercise(req: Request, res: Response) {
  res.status(201).json(formatResponse(201, "Упражнение добавлено", await workoutService.addExerciseToDay(res.locals.userId, req.body)));
 }
 async getMonthData(req: Request, res: Response) {
  const { month, year } = calendarQuerySchema.parse(req.query);
  res.json(formatResponse(200, "Данные за месяц получены", await workoutService.getMonthlyCalendar(res.locals.userId, month, year)));
 }
 async deleteExercise(req: Request, res: Response) {
  const id = z.uuid().parse(req.params.id);
  res.json(formatResponse(200, "Упражнение удалено", await workoutService.removeExercise(id, res.locals.userId)));
 }
 async updateSet(req: Request, res: Response) {
  const id = z.uuid().parse(req.params.setId);
  res.json(formatResponse(200, "Подход обновлён", await workoutService.updateSetProgress(id, res.locals.userId, req.body)));
 }
}
export const workoutController = new WorkoutController();
