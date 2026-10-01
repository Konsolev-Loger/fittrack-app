import { useEffect, useState } from "react";
import { useWorkoutStore } from "../../store/workoutStore";
import { useAuthStore } from "../../store/authStore";
import { readCollapsedExercises, saveCollapsedExercises } from "../../utils/collapsedExercises";
import { dateKey } from "../../utils/dates";
import { CalendarModal } from "../CalendarModal/CalendarModal"; // Импортируем модалку
import { Footer } from "../Landing/Landing";
import { Header } from "../Header/Headers";
import { SetInput } from "../SetInput/SetInput";
import { TrainingModal } from "./TrainingModal";
import { ExerciseModal } from "./ExerciseModal";
import styles from "./MainPages.module.css";
import { WeekStrip } from "./WeekStrip";

export const MainPage = () => {
	const {
		monthlyWorkouts,
		fetchMonthlyData,
		selectedDate,
		fetchCategories,
		deleteExercise,
		updateSetData,
        updateDuration, updateDistance, deleteEmptyWorkout,
		changeSets,
		isSaving,
		isLoading,
		error,
	} = useWorkoutStore();

	useEffect(() => {
		const month = selectedDate.getMonth() + 1;
		const year = selectedDate.getFullYear();
		fetchMonthlyData(month, year);
		fetchCategories();
	}, [fetchCategories, fetchMonthlyData, selectedDate]);

	const userId = useAuthStore(state=>state.user?.id || "");
 const [collapsed, setCollapsed] = useState<string[]>(()=>readCollapsedExercises(userId));
 useEffect(()=>{if(userId)saveCollapsedExercises(userId,collapsed);},[userId,collapsed]);
	const [addingExercise, setAddingExercise] = useState<string | null>(null);
 const [addingWorkout, setAddingWorkout] = useState(false);
	const dayWorkouts = monthlyWorkouts.filter((w) => w.date === dateKey(selectedDate));

	return (
		<div className={styles.wrapper}>
			<Header />

			<CalendarModal />
			<div className={styles.diaryIntro}>
				<div>

					<h1>Дневник</h1>

				</div>
				<button type="button" className={styles.dateButton} onClick={() => useWorkoutStore.getState().setCalendarOpen(true)}>
					{selectedDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}{" "}
					<span aria-hidden="true">↓</span>
				</button>
			</div>

			<main className={styles.mainContent}>
				<WeekStrip />
				{error && <div className="notice-error" role="alert">{error}<button type="button" disabled={isLoading} onClick={() => void fetchMonthlyData(selectedDate.getMonth() + 1, selectedDate.getFullYear())}>Повторить загрузку</button></div>}
				{isLoading && <p role="status">Загрузка тренировок…</p>}

				<button type="button" className={styles.newExercise} onClick={() => setAddingWorkout(true)}>
					+ Добавить тренировку
				</button>
				{addingWorkout && <TrainingModal onClose={() => setAddingWorkout(false)} />}
                {addingExercise && <ExerciseModal workoutId={addingExercise} onClose={() => setAddingExercise(null)} onAdded={() => {
                    setAddingExercise(null);
                    requestAnimationFrame(() => document.getElementById(`workout-${addingExercise}`)?.querySelector<HTMLInputElement>(`[data-first-weight] input, [data-duration] input`)?.focus());
                }} />}

				<section className={styles.workoutDisplay} aria-label="Упражнения и подходы">


					{!isLoading && !error && !dayWorkouts.length && (
						<div className={styles.emptyState}>
							<h3>Пока нет тренировок</h3>
							<p>
								Добавь тренировку и дай ей название, например «Грудь».
							</p>
						</div>
					)}

					{dayWorkouts.map(currentWorkout => <section key={currentWorkout.id} id={`workout-${currentWorkout.id}`} className={styles.trainingCard}>
                        <header className={styles.trainingHeader}><h2>{currentWorkout.name || "Тренировка"}</h2><div>
                        {!currentWorkout.exercises.length && <button type="button" className={styles.deleteExBtn} aria-label={`Удалить пустую тренировку ${currentWorkout.name || "Тренировка"}`} onClick={() => void deleteEmptyWorkout(currentWorkout.id)}>×</button>}
                        <button type="button" className={styles.trainingAdd} aria-label={`Добавить упражнение в тренировку ${currentWorkout.name || "Тренировка"}`} onClick={() => setAddingExercise(currentWorkout.id)}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></button></div></header>
                        {!currentWorkout.exercises.length && <p className={styles.trainingEmpty}>Нажми «+», чтобы добавить упражнение.</p>}
                        <div className={styles.exercisesList}>
						{[...(currentWorkout?.exercises || [])].reverse().map((ex) => {
							return (
								<div key={ex.id} className={`${styles.exCard} ${ex.isCompound ? styles.compound : ""}`}>
									<div className={styles.exInfo}>
										<div className={styles.exHeaderBlock}>
											<div className={styles.exTitleBtn}>
												<h4>
													{ex.name}
													{ex.category.name !== "Без группы" && <span>{ex.category.name}</span>}
												</h4>
											</div>
										</div>

                                        {(ex.description || ex.isCompound || ex.isFailure || ex.isDropSet) && <details className={styles.exerciseDetails}>
                                            <summary>Подробнее</summary>
                                            {ex.description && <p className={styles.exDescription}>{ex.description}</p>}
                                            <div className={styles.tags}>{[ex.isCompound && "Многосуставное", ex.isFailure && "До отказа", ex.isDropSet && "Дроп-сет"].filter(Boolean).join(" · ")}</div>
                                        </details>}

										<div
											id={`sets-${ex.id}`}
											inert={collapsed.includes(ex.id)}
											aria-hidden={collapsed.includes(ex.id)}
											data-collapsed={collapsed.includes(ex.id)}
											className={styles.setsCollapseWrapper}
										>
											<div className={styles.setsClip}>
												<div className={styles.setsContainer}>
													{ex.durationMinutes == null && <div className={styles.setsHeading}>
														<span>Подход</span>
														<span>Вес, кг</span>
														<span>Повторения</span>
														<span />
													</div>}
													<div className={styles.setsList}>
														{ex.durationMinutes != null ? <div className={styles.cardioMetrics}><label data-duration className={styles.durationField}>Длительность, мин<SetInput key={`duration-${ex.id}-${ex.durationMinutes}`} value={ex.durationMinutes} label={`Длительность: ${ex.name}`} integer min={1} max={1440} className={styles.setInput} save={value => updateDuration(ex.id, value)} /></label><label className={styles.durationField}>Расстояние, км<SetInput key={`distance-${ex.id}-${ex.distanceKm}`} value={ex.distanceKm ?? 0} label={`Расстояние: ${ex.name}`} min={0} max={1000} className={styles.setInput} save={value => updateDistance(ex.id,value)} /></label></div> : ex.sets?.map((set) => (
															<div key={set.id} className={styles.setRow}>
																<span className={styles.setNumber}>#{set.setNumber}</span>
																<div className={styles.setInputs} data-first-weight={set.setNumber === 1 ? "" : undefined}>
																	<SetInput
																		key={`weight-${set.id}-${set.weight}`}
																		value={set.weight}
																		label={`Вес, подход ${set.setNumber}`}
																		disabled={isSaving}
																		className={styles.setInput}
																		save={(value) => updateSetData(set.id, ex.id, { weight: value })}
																	/>

																	<SetInput
																		key={`reps-${set.id}-${set.repsCount}`}
																		value={set.repsCount}
																		label={`Повторения, подход ${set.setNumber}`}
																		integer
																		disabled={isSaving}
																		className={styles.setInput}
																		save={(value) => updateSetData(set.id, ex.id, { repsCount: value })}
																	/>
																	{
																		<button
																			className={styles.deleteSetBtn}
																			title="Удалить подход"
																			type="button"
																			disabled={isSaving}
																			aria-label={`Удалить подход ${set.setNumber}: ${ex.name}`}
																			onClick={() => void changeSets(set.id, "delete")}
																		>
																			×
																		</button>
																	}
																</div>
															</div>
														))}
														{
															<button
																hidden={ex.durationMinutes != null}
                                                        className={styles.addSetBtn}
																type="button"
																disabled={isSaving || ex.sets.length >= 100}
																onClick={() => void changeSets(ex.id, "add")}
															>
																<span aria-hidden="true">+</span> Добавить подход
															</button>
														}
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className={styles.exRightSide}>
										<button
											type="button"
											className={styles.collapseButton}
											aria-expanded={!collapsed.includes(ex.id)}
											aria-controls={`sets-${ex.id}`}
											aria-label={`${collapsed.includes(ex.id) ? "Показать" : "Скрыть"} подходы: ${ex.name}`}
											onClick={() =>
												setCollapsed((items) => (items.includes(ex.id) ? items.filter((id) => id !== ex.id) : [...items, ex.id]))
											}
										>
											<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
												<path
													d="m6 9 6 6 6-6"
													stroke="currentColor"
													strokeWidth="1.7"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</button>
										{
											<button
												type="button"
												className={styles.deleteExBtn}
												aria-label={`Удалить упражнение ${ex.name}`}
												onClick={() => {
													if (window.confirm("Удалить это упражнение?")) {
														deleteExercise(ex.id);
													}
												}}
											>
												×
											</button>
										}
									</div>
								</div>
							);
						})}
					</div>
                    </section>)}
				</section>
			</main>
            <Footer showDownload={false} />

		</div>
	);
};

export default MainPage;
