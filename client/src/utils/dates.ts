export function dateKey(date: Date): string {
 return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}
export function localDate(value: string | Date): Date {
 if (typeof value === "string" && value.includes("T")) {
  const legacy = new Date(value);
  return Number.isNaN(legacy.getTime()) ? new Date() : legacy;
 }
 const key = value instanceof Date ? dateKey(value) : value.slice(0, 10);
 const [year, month, day] = key.split("-").map(Number);
 const date = new Date(year, month - 1, day);
 return Number.isNaN(date.getTime()) ? new Date() : date;
}
