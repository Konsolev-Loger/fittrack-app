import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "./theme.css";


const container = document.getElementById("root");

if (container) {
	createRoot(container).render(<App />);
}
