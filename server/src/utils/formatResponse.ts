export default function formatResponse<T = null>(statusCode: number, message: string, data: T | null = null,
 error: string | { field: string; message: string }[] | null = null) {
 return { statusCode, message, data, error };
}
