import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiAlertCircle } from "react-icons/fi";
import { toast } from "react-toastify";
import useAuthStore from "../../store/authStore";
import useLanguageStore from "../../store/languageStore.js";
import useThemeStore from "../../store/themeStore.js";
import { logAction, ActionTypes } from "../../services/logger";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuthStore();
  const { script } = useLanguageStore();
  const { isDark } = useThemeStore();

  // Перенаправление если уже залогинен
  useEffect(() => {
    if (user && !authLoading) {
      // console.log("Пользователь уже залогинен, перенаправляем на dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Если идет проверка аутентификации, показываем загрузку
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const translations = {
    title: script === "latin" ? "Xududgaz Farg'ona" : "Ҳудудгаз Фарғона",
    subtitle:
      script === "latin" ? "Dispetcherlik xizmati" : "Диспетчерлик хизмати",
    email: script === "latin" ? "Elektron pochta" : "Электрон почта",
    password: script === "latin" ? "Parol" : "Парол",
    login: script === "latin" ? "Kirish" : "Кириш",
    error: script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
    placeholderEmail:
      script === "latin" ? "email@example.com" : "email@example.com",
    placeholderPassword:
      script === "latin" ? "Parolingizni kiriting" : "Паролингизни киритинг",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);

      if (!result.success) {
        setError(result.error);
        setLoading(false);

        // Логируем неудачную попытку входа
        await logAction(ActionTypes.USER_LOGIN, {
          email: email,
          success: false,
          error: result.error,
        });
      } else {
        // Логируем успешный вход
        await logAction(ActionTypes.USER_LOGIN, {
          email: email,
          success: true,
        });
        // При успешном входе useEffect перенаправит на dashboard
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Xatolik yuz berdi");
      setLoading(false);

      // Логируем ошибку
      await logAction(ActionTypes.USER_LOGIN, {
        email: email,
        success: false,
        error: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 relative overflow-hidden">
      {/* Декоративные элементы */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none">
        <svg className="absolute top-0 left-0 w-64 h-64" viewBox="0 0 200 200">
          <circle
            cx="30"
            cy="30"
            r="25"
            fill="#0ea5e9"
            className="dark:fill-primary-400"
          />
          <rect x="10" y="55" width="40" height="15" rx="5" fill="#f97316" />
          <rect x="25" y="70" width="10" height="30" fill="#fbbf24" />
          <circle
            cx="120"
            cy="150"
            r="20"
            fill="#0ea5e9"
            className="dark:fill-primary-400"
          />
          <rect x="100" y="170" width="40" height="10" rx="3" fill="#f97316" />
          <path
            d="M50 180 L70 160 L90 180"
            stroke="#0ea5e9"
            strokeWidth="8"
            fill="none"
            className="dark:stroke-primary-400"
          />
        </svg>
        <svg
          className="absolute bottom-0 right-0 w-96 h-96"
          viewBox="0 0 300 300"
        >
          <circle
            cx="250"
            cy="250"
            r="30"
            fill="#0ea5e9"
            className="dark:fill-primary-400"
          />
          <rect x="230" y="280" width="40" height="20" rx="5" fill="#f97316" />
          <rect x="245" y="300" width="10" height="40" fill="#fbbf24" />
          <path
            d="M50 50 C100 20, 150 80, 200 50"
            stroke="#f97316"
            strokeWidth="6"
            fill="none"
          />
          <circle cx="100" cy="100" r="15" fill="#fbbf24" />
          <circle cx="200" cy="100" r="15" fill="#fbbf24" />
        </svg>
      </div>

      {/* Изображения счетчиков */}
      <div className="absolute top-10 right-10 hidden lg:block opacity-20 dark:opacity-10">
        <div className="flex space-x-4">
          <div className="w-20 h-32 bg-gray-300 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 font-semibold">
            AutoPilot Pro
          </div>
          <div className="w-20 h-32 bg-gray-300 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 font-semibold">
            Floubox
          </div>
        </div>
      </div>

      {/* Форма входа */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 transition-all duration-300">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
              <svg
                className="w-12 h-12 text-blue-600 dark:text-blue-400"
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
            <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {translations.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              {translations.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {translations.email}
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder={translations.placeholderEmail}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {translations.password}
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder={translations.placeholderPassword}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <FiAlertCircle className="text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  {translations.error}: {error}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {script === "latin" ? "Kutilmoqda..." : "Кутилмоқда..."}
                </span>
              ) : (
                translations.login
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <span>
              {script === "latin"
                ? "Demo: demo@gazboshqar.uz / 123456"
                : "Демо: demo@gazboshqar.uz / 123456"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
