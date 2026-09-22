// Run before styles and React to avoid a flash of the wrong saved theme.
try {
 const theme = localStorage.getItem("fittrack-theme") === "light" ? "light" : "dark";
 document.documentElement.dataset.theme = theme;
 document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#FFEFB3" : "#013E37");
} catch { document.documentElement.dataset.theme = "dark"; }
