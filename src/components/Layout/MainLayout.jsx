import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import ThemeToggle from "../Theme/ThemeToggle";
import LanguageToggle from "../Language/LanguageToggle";
import Sidebar from "./Sidebar";
import useAuthStore from "../../store/authStore";
import useLanguageStore from "../../store/languageStore";
import useActivityTracker from "../../hooks/useActivityTracker";
import { logAction, ActionTypes } from "../../services/logger";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, userData, logout } = useAuthStore();
  const { script } = useLanguageStore();
  const navigate = useNavigate();

  // Отслеживаем активность пользователя
  useActivityTracker();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    const userEmail = user?.email;
    const userRole = userData?.role;

    // Логируем выход
    await logAction(ActionTypes.USER_LOGOUT, {
      email: userEmail,
      role: userRole,
    });

    await logout();
    navigate("/login");
  };

  // Проверяем сессию при монтировании
  useState(() => {
    const checkSession = () => {
      const sessionStart = localStorage.getItem("sessionStartTime");
      const lastActivityTime = localStorage.getItem("lastActivityTime");

      if (sessionStart && lastActivityTime) {
        const currentTime = Date.now();
        const timeSinceLastActivity = currentTime - parseInt(lastActivityTime);
        const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 минут

        if (timeSinceLastActivity > SESSION_TIMEOUT) {
          logout();
          navigate("/login");
        }
      }
    };

    // Проверяем каждые 30 секунд
    const interval = setInterval(checkSession, 30000);
    return () => clearInterval(interval);
  }, [logout, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Навбар */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-30 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                {isSidebarOpen ? (
                  <FiX className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                ) : (
                  <FiMenu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                )}
              </button>

              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => navigate("/dashboard")}
              >
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">
                  GazBoshqar
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:inline">
                {user?.email} {userData?.role && `(${userData.role})`}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
              >
                {script === "latin" ? "Chiqish" : "Чиқиш"}
              </button>
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="bg-white dark:bg-gray-800 shadow-lg mt-auto transition-colors duration-300">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          © 2024 GazBoshqar -{" "}
          {script === "latin"
            ? "Barcha huquqlar himoyalangan"
            : "Барча ҳуқуқлар ҳимояланган"}
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
