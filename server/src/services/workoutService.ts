import { workoutRepository } from "../repositories/workoutRepository";
import { createExerciseSchema, updateSetSchema } from "../validation/workout.validation";
class WorkoutService {
 getAllCategories(userId: string) { return workoutRepository.getCategories(userId); }
 addCustomCategory(name: string, userId: string) { return workoutRepository.createCategory(name, userId); }
 addExerciseToDay(userId: string, data: unknown) { return workoutRepository.createExerciseForDay(userId, createExerciseSchema.parse(data)); }
 async getMonthlyCalendar(userId: string, month: number, year: number) {
  const workouts = await workoutRepository.getWorkoutWithExercises(userId, month, year);
  return workouts.map(workout => ({ ...workout, date: workout.date.toISOString().slice(0, 10) }));
 }
 removeExercise(exerciseId: string, userId: string) { return workoutRepository.deleteExercise(exerciseId, userId); }
 updateSetProgress(setId: string, userId: string, data: unknown) { return workoutRepository.updateSet(setId, userId, updateSetSchema.parse(data)); }
}
export const workoutService = new WorkoutService();
