import { allowedOrigins } from "./environment";
const corsConfig = { origin: allowedOrigins, credentials: true, optionsSuccessStatus: 204 };
export default corsConfig;
