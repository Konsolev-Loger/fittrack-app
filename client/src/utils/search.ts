export function matchesWorkoutSearch(query: string, name: string, category: string) {
 const normalize = (value: string) => value.toLocaleLowerCase("ru-RU").replaceAll("ё", "е");
 const text = normalize(`${name} ${category}`);
 return normalize(query).trim().split(/\s+/u).every(word => text.includes(word));
}
