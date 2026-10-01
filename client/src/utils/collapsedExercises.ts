export function readCollapsedExercises(userId: string): string[] {
 try {
  const value: unknown = JSON.parse(localStorage.getItem(`collapsed-exercises:${userId}`) || "[]");
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string").slice(-2000) : [];
 } catch { return []; }
}
export function saveCollapsedExercises(userId: string, ids: string[]) {
 try { localStorage.setItem(`collapsed-exercises:${userId}`, JSON.stringify(ids.slice(-2000))); }
 catch { /* Keep the toggle working when browser storage is unavailable. */ }
}
