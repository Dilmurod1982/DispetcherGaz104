import React from "react";
import useLanguageStore from "../../store/languageStore";

const Dashboard = () => {
  const { script } = useLanguageStore();

  const translations = {
    title: script === "latin" ? "Boshqaruv paneli" : "Бошқарув панели",
    welcome: script === "latin" ? "Xush kelibsiz!" : "Хуш келибсиз!",
    totalRegions: script === "latin" ? "Jami viloyatlar" : "Жами вилоятлар",
    totalCities:
      script === "latin" ? "Jami shahar/tumanlar" : "Жами шаҳар/туманлар",
    totalUsers:
      script === "latin" ? "Jami foydalanuvchilar" : "Жами фойдаланувчилар",
    active: script === "latin" ? "Faol" : "Фаол",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {translations.welcome}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {translations.title}
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {translations.totalRegions}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                14
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {translations.totalCities}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                0
              </p>
            </div>
            <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-cyan-600 dark:text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {translations.totalUsers}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                0
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {translations.active}
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                12
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-purple-600 dark:text-purple-400"
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
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {script === "latin" ? "Tezkor harakatlar" : "Тезкор ҳаракатлар"}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium text-blue-700 dark:text-blue-300">
            {script === "latin" ? "Viloyat qo'shish" : "Вилоят қўшиш"}
          </button>
          <button className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors text-sm font-medium text-cyan-700 dark:text-cyan-300">
            {script === "latin" ? "Shahar qo'shish" : "Шаҳар қўшиш"}
          </button>
          <button className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm font-medium text-green-700 dark:text-green-300">
            {script === "latin"
              ? "Foydalanuvchi qo'shish"
              : "Фойдаланувчи қўшиш"}
          </button>
          <button className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium text-purple-700 dark:text-purple-300">
            {script === "latin" ? "Hisobot yaratish" : "Ҳисобот яратиш"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
