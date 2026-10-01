import { Router } from "express";
import { z } from "zod";
import { workoutRepository } from "../repositories/workoutRepository";
import formatResponse from "../utils/formatResponse";
import { workoutController as controller } from "../controllers/workoutController";
import { validate } from "../middlewares/validate";
import { verifyAccessToken } from "../tokens/veryfyToken";
import {
	createWorkoutSchema,
	durationSchema,
	createExerciseSchema,
	updateSetSchema,
} from "../validation/workout.validation";

const router = Router();
router.use(verifyAccessToken);
router.get("/categories", controller.getCategories);
router.delete("/sets/:setId", async (req, res) => {
 res.json(formatResponse(200, "Подход удалён", await workoutRepository.changeSets(res.locals.userId, z.uuid().parse(req.params.setId), "delete")));
});
router.post("/exercises/:id/sets", async (req, res) => {
 res.status(201).json(formatResponse(201, "Подход добавлен", await workoutRepository.changeSets(res.locals.userId, z.uuid().parse(req.params.id), "add")));
});
router.patch("/exercises/:id/duration", validate(durationSchema), async (req, res) => {
 res.json(formatResponse(200, "Время сохранено", await workoutRepository.updateDuration(z.uuid().parse(req.params.id), res.locals.userId, req.body)));
});
router.post("/sessions", validate(createWorkoutSchema), async (req,res) => {
 res.status(201).json(formatResponse(201,"Тренировка добавлена",await workoutRepository.createWorkout(res.locals.userId,req.body.name,req.body.date)));
});
router.delete("/sessions/:id", async (req,res) => {
 res.json(formatResponse(200,"Тренировка удалена",await workoutRepository.removeEmptyWorkout(res.locals.userId,z.uuid().parse(req.params.id))));
});
router.post("/exercises", validate(createExerciseSchema), controller.addExercise);
router.get("/calendar", controller.getMonthData);
router.delete("/exercises/:id", controller.deleteExercise);
router.patch("/sets/:setId", validate(updateSetSchema), controller.updateSet);
export default router;
