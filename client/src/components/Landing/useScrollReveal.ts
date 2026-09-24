import { useEffect, useRef } from "react";

export function useScrollReveal() {
	const root = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = root.current;
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (!container || !window.IntersectionObserver || reducedMotion.matches) return;

		const elements = container.querySelectorAll<HTMLElement>("[data-reveal]");
		const reveal = (element: HTMLElement) => {
			element.classList.remove("reveal-pending");
			observer.unobserve(element);
		};
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) reveal(entry.target as HTMLElement);
			});
		}, { threshold: 0, rootMargin: "0px 0px -32px 0px" });

		// Keep initially visible content readable, including direct anchor links.
		elements.forEach((element) => {
			if (element.getBoundingClientRect().top >= window.innerHeight) {
				element.classList.add("reveal-pending");
				observer.observe(element);
			}
		});
		const showAll = () => {
			if (reducedMotion.matches) elements.forEach(reveal);
		};
		const onFocus = (event: FocusEvent) => {
			if (event.target instanceof Element) {
				const element = event.target.closest<HTMLElement>("[data-reveal]");
				if (element) reveal(element);
			}
		};
		reducedMotion.addEventListener("change", showAll);
		container.addEventListener("focusin", onFocus);
		return () => {
			observer.disconnect();
			elements.forEach((element) => element.classList.remove("reveal-pending"));
			reducedMotion.removeEventListener("change", showAll);
			container.removeEventListener("focusin", onFocus);
		};
	}, []);

	return root;
}
