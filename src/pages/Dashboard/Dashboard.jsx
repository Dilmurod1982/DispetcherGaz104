import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useLanguageStore from "../../store/languageStore";
import useAuthStore from "../../store/authStore";
import useReportStore from "../../store/reportStore";
import {
  MapPin,
  Users,
  FileText,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Building2,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import {
  getToday,
  formatDateDisplay,
  formatTime,
  getReportTypeByHour,
} from "../../services/reportUtils";

const Dashboard = () => {
  const { script } = useLanguageStore();
  const { user, userData } = useAuthStore();
  const { reports, loadReports } = useReportStore();
  const navigate = useNavigate();

  const [assignedCities, setAssignedCities] = useState([]);
  const [assignedCitiesData, setAssignedCitiesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailyReports, setDailyReports] = useState([]);
  const [previousDailyReports, setPreviousDailyReports] = useState([]);
  const [reportDifferences, setReportDifferences] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const translations = {
    title: script === "latin" ? "Boshqaruv paneli" : "Бошқарув панели",
    welcome: script === "latin" ? "Xush kelibsiz!" : "Хуш келибсиз!",
    totalCities: script === "latin" ? "Shahar/tumanlar" : "Шаҳар/туманлар",
    totalObjects: script === "latin" ? "Jami obyektlar" : "Жами объектлар",
    totalReports: script === "latin" ? "Hisobotlar" : "Ҳисоботлар",
    lastReport: script === "latin" ? "Oxirgi hisobot" : "Охирги ҳисобот",
    noReports:
      script === "latin" ? "Hisobot mavjud emas" : "Ҳисобот мавжуд эмас",
    assignedCities:
      script === "latin"
        ? "Menga biriktirilgan shahar/tumanlar"
        : "Менга бириктирилган шаҳар/туманлар",
    viewReport: script === "latin" ? "Hisobotni ko'rish" : "Ҳисоботни кўриш",
    goToReports:
      script === "latin" ? "Hisobotlarga o'tish" : "Ҳисоботларга ўтиш",
    reportDate: script === "latin" ? "Sana" : "Сана",
    reportTime: script === "latin" ? "Vaqt" : "Вақт",
    status: script === "latin" ? "Holat" : "Ҳолат",
    completed: script === "latin" ? "To'ldirilgan" : "Тўлдирилган",
    pending: script === "latin" ? "Kutilmoqda" : "Кутилмоқда",
    active: script === "latin" ? "Faol" : "Фаол",
    today: script === "latin" ? "Bugun" : "Бугун",
    noAssignedCities:
      script === "latin"
        ? "Sizga biriktirilgan shahar/tumanlar mavjud emas"
        : "Сизга бириктирилган шаҳар/туманлар мавжуд эмас",
    quickActions:
      script === "latin" ? "Tezkor harakatlar" : "Тезкор ҳаракатлар",
    enterData: script === "latin" ? "Ma'lumot kiritish" : "Маълумот киритиш",
    viewAllReports:
      script === "latin" ? "Barcha hisobotlar" : "Барча ҳисоботлар",
    loadingText: script === "latin" ? "Yuklanmoqda..." : "Юкланмоқда...",
    dailyReportDifference:
      script === "latin"
        ? "Kunlik hisobotlar farqi"
        : "Кунлик ҳисоботлар фарқи",
    previousDay: script === "latin" ? "Oldingi kun" : "Олдинги кун",
    currentDay: script === "latin" ? "Joriy kun" : "Жорий кун",
    difference: script === "latin" ? "Farq" : "Фарқ",
    object: script === "latin" ? "Obyekt" : "Объект",
    flow: script === "latin" ? "Sarfi (m³)" : "Сарфи (м³)",
    pressureIn: script === "latin" ? "Kirish bosimi" : "Кириш босими",
    pressureOut: script === "latin" ? "Chiqish bosimi" : "Чиқиш босими",
    noData:
      script === "latin" ? "Ma'lumot mavjud emas" : "Маълумот мавжуд эмас",
    category: script === "latin" ? "Turi" : "Тури",
    grs: "ГТШ",
    nodes: script === "latin" ? "Tugunlar" : "Тугунлар",
    interdistrict: script === "latin" ? "Tumanlararo" : "Туманлараро",
    consumers: script === "latin" ? "Iste'molchilar" : "Истеъмолчилар",
    grp: "ГТҚ",
  };

  // Роли, для которых показываем разницу отчетов
  const reportRoles = ["ray_disp", "tuman_bosh", "tuman_metrolog"];

  // Загрузка данных о прикрепленных городах
  const loadAssignedCitiesData = async () => {
    setLoading(true);
    try {
      const assignedCitiesIds = userData?.assignedCities || [];

      if (assignedCitiesIds.length === 0) {
        setAssignedCitiesData([]);
        setAssignedCities([]);
        setLoading(false);
        return;
      }

      setAssignedCities(assignedCitiesIds);

      const citiesData = [];
      let totalObjects = 0;

      for (const cityId of assignedCitiesIds) {
        try {
          const cityDocRef = doc(db, "cities", cityId);
          const cityDoc = await getDoc(cityDocRef);

          if (cityDoc.exists()) {
            const cityData = {
              id: cityDoc.id,
              ...cityDoc.data(),
            };

            let cityObjects = 0;
            const collections = [
              "grs",
              "nodes",
              "interdistrict",
              "consumers",
              "grp",
            ];

            for (const collName of collections) {
              try {
                const q = query(
                  collection(db, collName),
                  where("locationId", "==", cityId),
                );
                const snapshot = await getDocs(q);
                cityObjects += snapshot.size;
              } catch (err) {
                console.log(`Collection ${collName} not found or error:`, err);
              }
            }

            cityData.objectCount = cityObjects;
            totalObjects += cityObjects;
            citiesData.push(cityData);
          } else {
            citiesData.push({
              id: cityId,
              name: `${script === "latin" ? "Noma'lum shahar" : "Номаълум шаҳар"}`,
              objectCount: 0,
            });
          }
        } catch (err) {
          console.error(`Error loading city ${cityId}:`, err);
          citiesData.push({
            id: cityId,
            name: `${script === "latin" ? "Xatolik" : "Хатолик"}`,
            objectCount: 0,
          });
        }
      }

      setAssignedCitiesData(citiesData);
    } catch (error) {
      console.error("Error loading assigned cities:", error);
      toast.error(
        script === "latin"
          ? "Ma'lumotlarni yuklashda xatolik"
          : "Маълумотларни юклашда хатолик",
      );
    } finally {
      setLoading(false);
    }
  };

  // Загрузка суточных отчетов
  const loadDailyReports = async () => {
    if (!reportRoles.includes(userData?.role)) return;

    setLoadingReports(true);
    try {
      const regionId = userData?.assignedCities?.[0];
      if (!regionId) {
        setLoadingReports(false);
        return;
      }

      const today = getToday();

      // Получаем дату предыдущего дня
      const prevDate = new Date();
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDay = prevDate.toISOString().split("T")[0];

      // Загружаем отчеты за сегодня и вчера
      await loadReports(today);
      await loadReports(prevDay);

      // Находим суточные отчеты (hour === 0)
      const todayDaily = reports.filter(
        (r) => r.date === today && r.hour === 0,
      );
      const prevDaily = reports.filter(
        (r) => r.date === prevDay && r.hour === 0,
      );

      setDailyReports(todayDaily);
      setPreviousDailyReports(prevDaily);

      // Вычисляем разницу
      calculateDifferences(todayDaily, prevDaily);
    } catch (error) {
      console.error("Error loading daily reports:", error);
      toast.error(
        script === "latin"
          ? "Hisobotlarni yuklashda xatolik"
          : "Ҳисоботларни юклашда хатолик",
      );
    } finally {
      setLoadingReports(false);
    }
  };

  // Вычисление разницы между отчетами
  const calculateDifferences = (todayReports, prevReports) => {
    const differences = [];

    // Получаем все объекты из сегодняшних отчетов
    const todayData = {};
    todayReports.forEach((report) => {
      const data = report.data || {};
      const categories = ["grs", "nodes", "interdistrict", "consumers", "grp"];

      categories.forEach((cat) => {
        if (data[cat]) {
          Object.keys(data[cat]).forEach((id) => {
            const key = `${cat}_${id}`;
            todayData[key] = {
              category: cat,
              id: id,
              displayName:
                data[cat][id].displayName || data[cat][id].name || id,
              flow: data[cat][id].flow || 0,
              pressureIn: data[cat][id].pressureIn || 0,
              pressureOut: data[cat][id].pressureOut || 0,
            };
          });
        }
      });
    });

    // Получаем все объекты из вчерашних отчетов
    const prevData = {};
    prevReports.forEach((report) => {
      const data = report.data || {};
      const categories = ["grs", "nodes", "interdistrict", "consumers", "grp"];

      categories.forEach((cat) => {
        if (data[cat]) {
          Object.keys(data[cat]).forEach((id) => {
            const key = `${cat}_${id}`;
            prevData[key] = {
              category: cat,
              id: id,
              displayName:
                data[cat][id].displayName || data[cat][id].name || id,
              flow: data[cat][id].flow || 0,
              pressureIn: data[cat][id].pressureIn || 0,
              pressureOut: data[cat][id].pressureOut || 0,
            };
          });
        }
      });
    });

    // Объединяем все ключи
    const allKeys = new Set([
      ...Object.keys(todayData),
      ...Object.keys(prevData),
    ]);

    allKeys.forEach((key) => {
      const today = todayData[key];
      const prev = prevData[key];

      if (today && prev) {
        // Объект есть в обоих отчетах
        differences.push({
          key,
          category: today.category,
          id: today.id,
          displayName: today.displayName,
          todayFlow: today.flow,
          prevFlow: prev.flow,
          flowDiff: today.flow - prev.flow,
          todayPressureIn: today.pressureIn,
          prevPressureIn: prev.pressureIn,
          pressureInDiff: today.pressureIn - prev.pressureIn,
          todayPressureOut: today.pressureOut,
          prevPressureOut: prev.pressureOut,
          pressureOutDiff: today.pressureOut - prev.pressureOut,
          status: "both",
        });
      } else if (today && !prev) {
        // Только в сегодняшнем отчете
        differences.push({
          key,
          category: today.category,
          id: today.id,
          displayName: today.displayName,
          todayFlow: today.flow,
          prevFlow: 0,
          flowDiff: today.flow,
          todayPressureIn: today.pressureIn,
          prevPressureIn: 0,
          pressureInDiff: today.pressureIn,
          todayPressureOut: today.pressureOut,
          prevPressureOut: 0,
          pressureOutDiff: today.pressureOut,
          status: "new",
        });
      } else if (!today && prev) {
        // Только во вчерашнем отчете
        differences.push({
          key,
          category: prev.category,
          id: prev.id,
          displayName: prev.displayName,
          todayFlow: 0,
          prevFlow: prev.flow,
          flowDiff: -prev.flow,
          todayPressureIn: 0,
          prevPressureIn: prev.pressureIn,
          pressureInDiff: -prev.pressureIn,
          todayPressureOut: 0,
          prevPressureOut: prev.pressureOut,
          pressureOutDiff: -prev.pressureOut,
          status: "removed",
        });
      }
    });

    // Сортируем по категории и имени
    differences.sort((a, b) => {
      if (a.category !== b.category)
        return a.category.localeCompare(b.category);
      return a.displayName.localeCompare(b.displayName);
    });

    setReportDifferences(differences);
  };

  // Получение названия категории
  const getCategoryLabel = (category) => {
    const map = {
      grs: translations.grs,
      nodes: translations.nodes,
      interdistrict: translations.interdistrict,
      consumers: translations.consumers,
      grp: translations.grp,
    };
    return map[category] || category;
  };

  // Получение цвета для разницы
  const getDiffColor = (diff) => {
    if (diff > 0) return "text-green-600 dark:text-green-400";
    if (diff < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-500 dark:text-gray-400";
  };

  // Получение иконки для разницы
  const getDiffIcon = (diff) => {
    if (diff > 0) return <TrendingUp className="w-4 h-4" />;
    if (diff < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  useEffect(() => {
    if (user?.uid) {
      loadAssignedCitiesData();
      if (reportRoles.includes(userData?.role)) {
        loadDailyReports();
      }
    }
  }, [user, userData]);

  // Обновляем отчеты при изменении reports
  useEffect(() => {
    if (reportRoles.includes(userData?.role) && reports.length > 0) {
      const today = getToday();
      const prevDate = new Date();
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDay = prevDate.toISOString().split("T")[0];

      const todayDaily = reports.filter(
        (r) => r.date === today && r.hour === 0,
      );
      const prevDaily = reports.filter(
        (r) => r.date === prevDay && r.hour === 0,
      );

      setDailyReports(todayDaily);
      setPreviousDailyReports(prevDaily);
      calculateDifferences(todayDaily, prevDaily);
    }
  }, [reports]);

  // Проверка, является ли пользователь ray_disp
  const isRayDisp = userData?.role === "ray_disp";

  // Проверка, нужно ли показывать разницу отчетов
  const showReportDifference = reportRoles.includes(userData?.role);

  // Проверка, есть ли прикрепленные города
  const hasAssignedCities = assignedCitiesData.length > 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {translations.welcome}
        </h1>

        {userData?.assignedCitiesNames &&
          userData.assignedCitiesNames.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {script === "latin"
                ? "Biriktirilgan shahar/tumanlar: "
                : "Бириктирилган шаҳар/туманлар: "}
              {userData.assignedCitiesNames.join(", ")}
            </p>
          )}
      </div>

      {/* Разница суточных отчетов */}
      {showReportDifference && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            {translations.dailyReportDifference}
          </h2>

          {loadingReports ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {translations.loadingText}
              </p>
            </div>
          ) : reportDifferences.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {translations.category}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {translations.object}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {translations.previousDay}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {translations.currentDay}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {translations.difference}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {reportDifferences.map((item) => (
                      <tr
                        key={item.key}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {getCategoryLabel(item.category)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {item.displayName}
                          {item.status === "new" && (
                            <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                              {script === "latin" ? "Yangi" : "Янги"}
                            </span>
                          )}
                          {item.status === "removed" && (
                            <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
                              {script === "latin" ? "O'chirilgan" : "Ўчирилган"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                          {item.prevFlow > 0 ? item.prevFlow.toFixed(2) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                          {item.todayFlow > 0 ? item.todayFlow.toFixed(2) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div
                            className={`flex items-center justify-center gap-1 font-semibold ${getDiffColor(item.flowDiff)}`}
                          >
                            {getDiffIcon(item.flowDiff)}
                            <span>
                              {item.flowDiff !== 0
                                ? item.flowDiff.toFixed(2)
                                : "0"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {translations.noData}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Быстрые действия */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {translations.quickActions}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Для ray_disp показываем кнопку "Ma'lumot kiritish" */}
          {isRayDisp && (
            <button
              onClick={() => navigate("/reports/data-entry")}
              className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {translations.enterData}
            </button>
          )}

          {/* Для всех ролей показываем кнопку "Barcha hisobotlar" */}
          <button
            onClick={() => navigate("/reports/view")}
            className={`p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm font-medium text-green-700 dark:text-green-300 flex items-center justify-center gap-2 ${
              isRayDisp ? "" : "col-span-2 sm:col-span-1"
            }`}
          >
            <Activity className="w-4 h-4" />
            {translations.viewAllReports}
          </button>

          {/* Дополнительные кнопки для не-ray_disp */}
          {!isRayDisp && showReportDifference && (
            <>
              <button
                onClick={() => navigate("/reports")}
                className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                {script === "latin" ? "Hisobotlar" : "Ҳисоботлар"}
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors text-sm font-medium text-cyan-700 dark:text-cyan-300 flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                {script === "latin" ? "Profil" : "Профил"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
