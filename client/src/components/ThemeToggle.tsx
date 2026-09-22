import { useSyncExternalStore } from "react";

const eventName = "fittrack-theme-change";
const subscribe = (callback: () => void) => {
 window.addEventListener(eventName, callback);
 return () => window.removeEventListener(eventName, callback);
};
export function ThemeToggle() {
 const light = useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme === "light", () => false);
 const label = light ? "Включить ночную тему" : "Включить дневную тему";
 function toggle() {
  const theme = light ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", light ? "#013E37" : "#FFEFB3");
  try { localStorage.setItem("fittrack-theme", theme); } catch { /* Theme still works when storage is unavailable. */ }
  window.dispatchEvent(new Event(eventName));
 }
 return <button className="theme-toggle" type="button" onClick={toggle} aria-label={label} title={label}>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
   {light ? <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/> : <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>}
  </svg>
 </button>;
}
