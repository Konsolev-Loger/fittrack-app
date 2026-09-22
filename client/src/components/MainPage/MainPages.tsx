import { useEffect, useState } from "react";
import { useWorkoutStore } from "../../store/workoutStore";
import { dateKey } from "../../utils/dates";
import { CalendarModal } from "../CalendarModal/CalendarModal"; // Импортируем модалку
import { Header } from "../Header/Headers";
import { Footer } from "../Landing/Landing";
import { SetInput } from "../SetInput/SetInput";
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

	const [collapsed, setCollapsed] = useState<string[]>([]);
	const [addingExercise, setAddingExercise] = useState(false);
	const currentWorkout = monthlyWorkouts.find((w) => w.date === dateKey(selectedDate));

	return (
		<div className={styles.wrapper}>
			<Header />

			<CalendarModal />
			<div className={styles.diaryIntro}>
				<div>
					<div className="eyebrow">Твой темп. Твой прогресс.</div>
					<h1>Дневник тренировок</h1>
					<p>Записывай сегодняшний результат. Создавай завтрашний.</p>
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

				<button type="button" className={styles.newExercise} onClick={() => setAddingExercise(true)}>
					+ Добавить упражнение
				</button>
				{addingExercise && <ExerciseModal onClose={() => setAddingExercise(false)} />}

				<section className={styles.workoutDisplay}>
					<p className="save-hint">Вес и повторения сохраняются после Enter или перехода к следующему полю.</p>
                    <h2>Тренировка · {selectedDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</h2>
					{!isLoading && !error && !currentWorkout?.exercises.length && (
						<div className={styles.emptyState}>
							<h3>Место для нового результата.</h3>
							<p>
								Нажми «Добавить упражнение» выше.
								<br />
								Подходы, вес и повторения появятся здесь.
							</p>
						</div>
					)}

					<div className={styles.exercisesList}>
						{[...(currentWorkout?.exercises || [])].reverse().map((ex) => {
							return (
								<div key={ex.id} className={`${styles.exCard} ${ex.isCompound ? styles.compound : ""}`}>
									<div className={styles.exInfo}>
										<div className={styles.exHeaderBlock}>
											<div className={styles.exTitleBtn}>
												<h4>
													{ex.name}
													<span>{ex.category.name}</span>
												</h4>
											</div>
										</div>

										<p className={styles.exDescription}>{ex.description}</p>

										<div className={styles.tags}>
											{ex.isCompound ? "Многосуставное" : "Изоляция"}
											{ex.isFailure && " · До отказа"}
											{ex.isDropSet && " · Дроп-сет"}
										</div>

										<div
											id={`sets-${ex.id}`}
											inert={collapsed.includes(ex.id)}
											aria-hidden={collapsed.includes(ex.id)}
											data-collapsed={collapsed.includes(ex.id)}
											className={styles.setsCollapseWrapper}
										>
											<div className={styles.setsClip}>
												<div className={styles.setsContainer}>
													<div className={styles.setsHeading}>
														<span>Подход</span>
														<span>Вес, кг</span>
														<span>Повторения</span>
														<span />
													</div>
													<div className={styles.setsList}>
														{ex.sets?.map((set) => (
															<div key={set.id} className={styles.setRow}>
																<span className={styles.setNumber}>#{set.setNumber}</span>
																<div className={styles.setInputs}>
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
				</section>
			</main>
			<Footer />
		</div>
	);
};

export default MainPage;
