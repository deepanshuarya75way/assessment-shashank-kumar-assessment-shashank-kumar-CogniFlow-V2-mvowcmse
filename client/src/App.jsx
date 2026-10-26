import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { Route, Routes } from "react-router-dom";

import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ProfilePage from "./pages/ProfilePage";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  return (
    <div className="bg-[var(--bg-app)] min-h-screen text-[var(--text-primary)] transition-colors duration-150">
      <Toaster
        position="bottom-center"
        toastOptions={{
          className:
            "rounded-[10px] px-4 py-2.5 bg-[#111B21] text-white text-[14px] shadow-[var(--shadow-md)] border border-transparent font-normal",
          duration: 3500,
          success: {
            iconTheme: {
              primary: "#E06928",
              secondary: "#FFFFFF",
            },
          },
          error: {
            className:
              "rounded-[10px] px-4 py-2.5 bg-[#111B21] text-white text-[14px] shadow-[var(--shadow-md)] border-l-[3px] border-l-[#D92D20] font-normal",
            iconTheme: {
              primary: "#D92D20",
              secondary: "#FFFFFF",
            },
          },
        }}
      />

      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/auth" element={<AuthPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;