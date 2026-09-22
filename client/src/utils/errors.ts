import axios from "axios";
export function getErrorMessage(error: unknown): string {
 if (axios.isAxiosError(error)) {
  const body: unknown = error.response?.data;
  if (body && typeof body === "object") {
   if ("error" in body && Array.isArray(body.error)) {
    const messages = body.error.flatMap(issue => issue && typeof issue === "object" && "message" in issue && typeof issue.message === "string" ? [issue.message] : []);
    if (messages.length) return messages.join(". ");
   }
   if ("error" in body && typeof body.error === "string" && body.error) return body.error;
   if ("message" in body && typeof body.message === "string") return body.message;
  }
  if (!error.response) return "Не удалось связаться с сервером. Проверь подключение и повтори попытку.";
  return error.message;
 }
 return error instanceof Error ? error.message : "Произошла ошибка";
}
