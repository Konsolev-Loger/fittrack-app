import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useWorkoutStore } from "../../store/workoutStore";
import { dateKey } from "../../utils/dates";
import { useModalClose } from "../../utils/useModalClose";
import { matchesWorkoutSearch } from "../../utils/search";
import styles from "./CalendarModal.module.css";
export const CalendarModal = () => {
	const {
		isCalendarOpen,
		setCalendarOpen,
		calendarWorkouts,
		calendarLoading,
		error,
		selectedDate,
		setSelectedDate,
		currentMonthView,
		setCurrentMonthView,
		fetchCalendarData,
	} = useWorkoutStore();
	const dialog = useRef<HTMLDialogElement>(null);
 const [search, setSearch] = useState("");
 const animateClose = useModalClose(dialog);
	const year = currentMonthView.getFullYear(),
		month = currentMonthView.getMonth();
	useEffect(() => {
		if (!isCalendarOpen) return;
		void fetchCalendarData(month + 1, year);
	}, [isCalendarOpen, month, year, fetchCalendarData]);
	useEffect(() => {
		if (!isCalendarOpen) return;
		const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const element = dialog.current;
		element?.showModal();
		const oldOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			element?.close();
			document.body.style.overflow = oldOverflow;
			previous?.focus({ preventScroll: true });
		};
	}, [isCalendarOpen]);
	if (!isCalendarOpen) return null;
	const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
	const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
	const daysInMonth = new Date(year, month + 1, 0).getDate();
 const matchingDates = new Set(calendarWorkouts.filter(w => matchesWorkoutSearch(search,w.name || "", "") || w.exercises.some(ex => matchesWorkoutSearch(search, ex.name, ex.category.name))).map(w => w.date));
	const close = () => animateClose(() => setCalendarOpen(false));
	return createPortal(
		<dialog
			ref={dialog}
			className={styles.modalContent}
			aria-labelledby="calendar-title"
			onKeyDown={(event) => {
				if (event.key === "Escape") {
					event.preventDefault();
					close();
				}
			}}
			onCancel={(event) => {
				event.preventDefault();
				close();
			}}
			onClick={(event) => {
				if (event.target === event.currentTarget) {
					const rect = event.currentTarget.getBoundingClientRect();
					if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)
						close();
				}
			}}
		>
			<div className={styles.modalHeader}>
				<button
					type="button"
					aria-label="Предыдущий месяц"
					className={styles.arrowBtn}
					onClick={() => setCurrentMonthView(new Date(year, month - 1, 1))}
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>
				</button>
				<h3 id="calendar-title" className={styles.monthTitle}>
					{currentMonthView.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
				</h3>
				<button
					type="button"
					aria-label="Следующий месяц"
					className={styles.arrowBtn}
					onClick={() => setCurrentMonthView(new Date(year, month + 1, 1))}
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
				</button>
				<button type="button" aria-label="Закрыть календарь" className={styles.closeBtn} onClick={close}>
					✕
				</button>
			</div>
			<label className={styles.searchLabel}>Поиск в этом месяце<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Тренировка, упражнение или группа" /></label>
            {search.trim() && !calendarLoading && !error && <p role="status" className={styles.searchStatus}>{matchingDates.size ? `Дней с совпадениями: ${matchingDates.size}` : "В этом месяце совпадений нет"}</p>}
			<div style={{ minHeight: 20 }} aria-live="polite">{calendarLoading && <small>Загрузка…</small>}</div>
			{error && <small role="alert">{error}</small>}
			<div className={styles.weekdaysGrid}>
				{weekdays.map((day) => (
					<div key={day} className={styles.weekdayName}>
						{day}
					</div>
				))}
			</div>
			<div className={styles.daysGrid}>
				{Array.from({ length: 42 }, (_, index) => {
					const day = index - firstDayIndex + 1;
					const date = new Date(year, month, day),
						key = dateKey(date);
					if (day < 1 || day > daysInMonth) return <div key={key} className={styles.emptyCell} />;
					const hasWorkout = calendarWorkouts.some((w) => w.date === key);
					return (
						<button
							type="button"
							key={key}
							aria-label={`${date.toLocaleDateString("ru-RU")}${hasWorkout ? ", есть тренировка" : ""}${search.trim() && matchingDates.has(key) ? ", совпадение поиска" : ""}`}
							data-match={!!search.trim() && matchingDates.has(key)}
                            data-dimmed={!!search.trim() && !matchingDates.has(key)}
                            aria-pressed={dateKey(selectedDate) === key}
							className={`${styles.dayCard} ${dateKey(selectedDate) === key ? styles.selectedDay : ""} ${dateKey(new Date()) === key ? styles.today : ""}`}
							onClick={() => {
								setSelectedDate(date);
								close();
							}}
						>
							<span className={styles.dayNumber}>{day}</span>
							{hasWorkout && (
								<span aria-hidden="true" className={styles.badge}>
									•
								</span>
							)}
						</button>
					);
				})}
			</div>
		</dialog>,
		document.body,
	);
};
