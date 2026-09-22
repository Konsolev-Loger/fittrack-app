import { Router } from "express";
import { z } from "zod";
import { workoutRepository } from "../repositories/workoutRepository";
import formatResponse from "../utils/formatResponse";
import { workoutController as controller } from "../controllers/workoutController";
import { validate } from "../middlewares/validate";
import { verifyAccessToken } from "../tokens/veryfyToken";
import {
	createCategorySchema,
	createExerciseSchema,
	updateSetSchema,
} from "../validation/workout.validation";

const router = Router();
router.use(verifyAccessToken);
router.get("/categories", controller.getCategories);
router.post("/categories", validate(createCategorySchema), controller.createCategory);
router.patch("/categories/:id", validate(createCategorySchema), async (req, res) => {
 res.json(formatResponse(200, "Категория переименована", await workoutRepository.renameCategory(z.uuid().parse(req.params.id), res.locals.userId, req.body.name)));
});
router.delete("/categories/:id", async (req, res) => {
 const { replacementCategoryId } = z.object({ replacementCategoryId: z.uuid().optional() }).strict().parse(req.body ?? {});
 res.json(formatResponse(200, "Категория удалена", await workoutRepository.deleteCategory(z.uuid().parse(req.params.id), res.locals.userId, replacementCategoryId)));
});
router.delete("/sets/:setId", async (req, res) => {
 res.json(formatResponse(200, "Подход удалён", await workoutRepository.changeSets(res.locals.userId, z.uuid().parse(req.params.setId), "delete")));
});
router.post("/exercises/:id/sets", async (req, res) => {
 res.status(201).json(formatResponse(201, "Подход добавлен", await workoutRepository.changeSets(res.locals.userId, z.uuid().parse(req.params.id), "add")));
});
router.post("/exercises", validate(createExerciseSchema), controller.addExercise);
router.get("/calendar", controller.getMonthData);
router.delete("/exercises/:id", controller.deleteExercise);
router.patch("/sets/:setId", validate(updateSetSchema), controller.updateSet);
export default router;
