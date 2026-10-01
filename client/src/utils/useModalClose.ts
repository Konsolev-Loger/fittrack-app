import { useCallback, useEffect, useRef, type RefObject } from "react";

export function useModalClose(ref: RefObject<HTMLDialogElement | null>) {
 const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
 useEffect(() => () => {
  if (timer.current) clearTimeout(timer.current);
  timer.current = null;
 }, []);
 return useCallback((done: () => void) => {
  const element = ref.current;
  if (!element || timer.current) return;
  element.dataset.closing = "true";
  element.inert = true;
  const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 200;
  timer.current = setTimeout(() => {
   timer.current = null;
   done();
   delete element.dataset.closing;
   element.inert = false;
  }, duration);
 }, [ref]);
}
