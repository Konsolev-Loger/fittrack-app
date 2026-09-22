import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import MainPages from "./components/MainPage/MainPages";
import { Landing, Brand } from "./components/Landing/Landing";
import { AuthDialog } from "./components/Auth/AuthDialog";
import { useAuthStore } from "./store/authStore";
import { ProfilePage } from "./components/Profile/ProfilePage";
import { DownloadPage } from "./components/Profile/DownloadPage";
import { AccountPage } from "./components/Auth/AccountPage";
import { emailAuthEnabled } from "./emailFeature";
function App() {
 const { isAuthenticated, isInitialized, refreshTokens } = useAuthStore();
 useEffect(() => { void refreshTokens(); }, [refreshTokens]);
 if (!isInitialized) return <div className="loading-screen"><Brand/><p role="status" className="muted">Открываем дневник…</p></div>;
 return <BrowserRouter><Routes>
  <Route path="/" element={<Landing/>}/>
  {emailAuthEnabled && (["verify-email", "reset-password", "forgot-password", "check-email"] as const).map(mode => <Route key={mode} path={`/${mode}`} element={<AccountPage key={mode} mode={mode}/>}/>)}
  <Route path="/profile" element={isAuthenticated ? <ProfilePage/> : <Navigate to="/login" replace/>}/>
  <Route path="/download" element={<DownloadPage/>}/>
  <Route path="/diary" element={isAuthenticated ? <MainPages/> : <Navigate to="/login" replace/>}/>
  <Route path="/login" element={isAuthenticated ? <Navigate to="/diary" replace/> : <><Landing/><AuthDialog mode="login"/></>}/>
  <Route path="/register" element={isAuthenticated ? <Navigate to="/diary" replace/> : <><Landing/><AuthDialog mode="register"/></>}/>
  <Route path="*" element={<Navigate to="/" replace/>}/>
 </Routes></BrowserRouter>;
}
export default App;
