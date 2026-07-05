import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Gauge,
  Zap,
  Droplet,
  Thermometer,
  Clock,
} from "lucide-react";
import useLanguageStore from "../../store/languageStore";

const DailyInfo = () => {
  const { script } = useLanguageStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGrs: 0,
    totalNodes: 0,
    totalInterdistrict: 0,
    totalGrp: 0,
    activeToday: 0,
  });
  const [lastUpdate, setLastUpdate] = useState(null);

  const translations = {
    title: script === "latin" ? "Kunlik ma'lumotlar" : "Кунлик маълумотлар",
    subtitle:
      script === "latin" ? "Bugungi tizim holati" : "Бугунги тизим ҳолати",
    totalGrs: script === "latin" ? "GTS (GRS)" : "ГТШ (ГРС)",
    totalNodes: script === "latin" ? "Tugunlar" : "Тугунлар",
    totalInterdistrict:
      script === "latin"
        ? "Tumanlararo hisoblagichlar"
        : "Туманлараро ҳисоблагичлар",
    totalGrp: script === "latin" ? "GTQ (GRP)" : "ГТҚ (ГРП)",
    activeToday: script === "latin" ? "Bugun faol" : "Бугун фаол",
    lastUpdate: script === "latin" ? "Oxirgi yangilanish" : "Охирги янгиланиш",
    notAvailable:
      script === "latin" ? "Ma'lumot mavjud emas" : "Маълумот мавжуд эмас",
    pressure: script === "latin" ? "Bosim" : "Босим",
    temperature: script === "latin" ? "Harorat" : "Ҳарорат",
    flow: script === "latin" ? "Oqim" : "Оқим",
    status: script === "latin" ? "Holat" : "Ҳолат",
    normal: script === "latin" ? "Normal" : "Нормал",
    warning: script === "latin" ? "Ogohlantirish" : "Огоҳлантириш",
    critical: script === "latin" ? "Kritik" : "Критик",
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Загрузка статистики из разных коллекций
      const grsSnapshot = await getDocs(collection(db, "grs"));
      const nodesSnapshot = await getDocs(collection(db, "nodes"));
      const interdistrictSnapshot = await getDocs(
        collection(db, "interdistrict"),
      );
      const grpSnapshot = await getDocs(collection(db, "grp"));

      setStats({
        totalGrs: grsSnapshot.size,
        totalNodes: nodesSnapshot.size,
        totalInterdistrict: interdistrictSnapshot.size,
        totalGrp: grpSnapshot.size,
        activeToday: Math.floor(Math.random() * 20) + 5, // Демо-данные
      });

      setLastUpdate(new Date().toLocaleString());
    } catch (error) {
      console.error("Error loading daily info:", error);
    } finally {
      setLoading(false);
    }
  };

  // Демо-данные для показателей
  const metrics = [
    {
      label: translations.pressure,
      value: "2.4",
      unit: "MPa",
      status: "normal",
      icon: Gauge,
      change: "+0.2",
    },
    {
      label: translations.temperature,
      value: "18",
      unit: "°C",
      status: "normal",
      icon: Thermometer,
      change: "-1.5",
    },
    {
      label: translations.flow,
      value: "1,247",
      unit: "м³/соат",
      status: "warning",
      icon: Droplet,
      change: "+12.3",
    },
  ];

  const statusColors = {
    normal: "text-green-500 dark:text-green-400",
    warning: "text-yellow-500 dark:text-yellow-400",
    critical: "text-red-500 dark:text-red-400",
  };

  const statusBgColors = {
    normal:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    warning:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    critical: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {translations.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {translations.lastUpdate}: {lastUpdate || translations.notAvailable}
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
            {translations.totalGrs}
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stats.totalGrs}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
            {translations.totalNodes}
          </p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {stats.totalNodes}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
            {translations.totalInterdistrict}
          </p>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            {stats.totalInterdistrict}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
            {translations.totalGrp}
          </p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {stats.totalGrp}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
            {translations.activeToday}
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {stats.activeToday}
          </p>
        </div>
      </div>

      {/* Показатели */}
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        {translations.status}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className={`rounded-lg border p-4 ${statusBgColors[metric.status]} transition-colors duration-200`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${statusBgColors[metric.status]}`}
                  >
                    <Icon
                      className={`w-5 h-5 ${statusColors[metric.status]}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {metric.label}
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {metric.value} {metric.unit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {metric.change.startsWith("+") ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      metric.change.startsWith("+")
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {metric.change}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Быстрые действия */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {script === "latin" ? "Tezkor harakatlar" : "Тезкор ҳаракатлар"}
        </h3>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            {script === "latin" ? "Hisobot yaratish" : "Ҳисобот яратиш"}
          </button>
          <button className="px-3 py-1.5 text-sm bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
            {script === "latin"
              ? "Ma'lumotlarni yangilash"
              : "Маълумотларни янгилаш"}
          </button>
          <button className="px-3 py-1.5 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
            {script === "latin" ? "Eksport qilish" : "Экспорт қилиш"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyInfo;
