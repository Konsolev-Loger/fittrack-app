import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useWorkoutStore } from "../../store/workoutStore";
import { dateKey } from "../../utils/dates";
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
	const close = () => setCalendarOpen(false);
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
					◀
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
					▶
				</button>
				<button type="button" aria-label="Закрыть календарь" className={styles.closeBtn} onClick={close}>
					✕
				</button>
			</div>
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
							aria-label={`${date.toLocaleDateString("ru-RU")}${hasWorkout ? ", есть тренировка" : ""}`}
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
