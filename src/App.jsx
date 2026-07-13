import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import DailyInfo from "./pages/DailyInfo/DailyInfo";
import Regions from "./pages/Regions/Regions";
import Cities from "./pages/Cities/Cities";
import Grs from "./pages/Grs/Grs";
import Nodes from "./pages/Nodes/Nodes";
import Interdistrict from "./pages/Interdistrict/Interdistrict";
import Grp from "./pages/Grp/Grp";
import ConsumersList from "./pages/Consumers/ConsumerList/ConsumerList";
import ConsumerTypes from "./pages/Consumers/ConsumerTypes/ConsumerTypes";
import Users from "./pages/Users/Users";
import Logs from "./pages/Logs/Logs";
import DataEntry from "./pages/Reports/DataEntry/DataEntry";
import ReportView from "./pages/Reports/ReportView/ReportView";
import EditPermissions from "./pages/Reports/EditPermissions/EditPermissions";
import MainLayout from "./components/Layout/MainLayout";
import ProtectedRoute from "./components/Layout/ProtectedRoute";
import useThemeStore from "./store/themeStore";
import useAuthStore from "./store/authStore";
import useLanguageStore from "./store/languageStore";
import FundBalance from "./pages/Fund/FundBalance/FundBalance";

const EmptyPage = ({ title }) => {
  const { script } = useLanguageStore();
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
      <div className="text-6xl mb-4">🚧</div>
      <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
        {title}
      </h2>
      <p className="text-gray-500 dark:text-gray-400">
        {script === "latin"
          ? "Sahifa ishlab chiqilmoqda..."
          : "Саҳифа ишлаб чиқилмоқда..."}
      </p>
    </div>
  );
};

const App = () => {
  const { isDark, setTheme } = useThemeStore();
  const { initAuth } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initAuth]);

  // Инициализация темы при загрузке
  useEffect(() => {
    // Читаем из localStorage напрямую
    const saved = localStorage.getItem("theme-storage");
    let isDarkMode = false;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.state && parsed.state.isDark !== undefined) {
          isDarkMode = parsed.state.isDark;
        }
      } catch (e) {
        console.error("Error parsing theme:", e);
      }
    }

    // Применяем тему
    setTheme(isDarkMode);
    console.log("Тема инициализирована:", isDarkMode ? "dark" : "light");
  }, [setTheme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/daily-info" element={<DailyInfo />} />

          {/* Регионы */}
          <Route path="/regions/viloyat" element={<Regions />} />
          <Route path="/regions/districts" element={<Cities />} />

          {/* Места сбора данных */}
          <Route path="/data-points/grs" element={<Grs />} />
          <Route path="/data-points/nodes" element={<Nodes />} />
          <Route
            path="/data-points/interdistrict"
            element={<Interdistrict />}
          />
          <Route path="/data-points/grp" element={<Grp />} />

          {/* Отчеты */}
          <Route path="/reports/data-entry" element={<DataEntry />} />
          <Route path="/reports/view" element={<ReportView />} />
          <Route path="/reports/view/:date/:hour" element={<ReportView />} />
          <Route
            path="/reports/edit-permissions"
            element={<EditPermissions />}
          />

          {/* Потребители */}
          <Route path="/consumers/list" element={<ConsumersList />} />
          <Route path="/consumers/types" element={<ConsumerTypes />} />

          {/* Пользователи */}
          <Route path="/users" element={<Users />} />

          {/* Фонды */}
          <Route path="/funds/balance" element={<FundBalance />} />

          {/* Логи */}
          <Route path="/logs" element={<Logs />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDark ? "dark" : "light"}
      />
    </BrowserRouter>
  );
};

export default App;
