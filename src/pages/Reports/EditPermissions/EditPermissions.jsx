import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebase/config";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Search,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import useLanguageStore from "../../../store/languageStore";
import useAuthStore from "../../../store/authStore";
import useLogger from "../../../hooks/useLogger";
import { ActionTypes } from "../../../services/logger";
import { toast } from "react-toastify";

const EditPermissions = () => {
  const { script } = useLanguageStore();
  const { user, userData } = useAuthStore();
  const { log } = useLogger();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [permissions, setPermissions] = useState({});

  const translations = {
    title:
      script === "latin"
        ? "Hisobotlarni tahrirlash uchun ruxsatlar"
        : "Ҳисоботларни таҳрирлаш учун рухсатлар",
    subtitle:
      script === "latin"
        ? "Kunlik hisobotlarni tahrirlashga ruxsat berish"
        : "Кунлик ҳисоботларни таҳрирлашга рухсат бериш",
    date: script === "latin" ? "Sana" : "Сана",
    region: script === "latin" ? "Hudud" : "Ҳудуд",
    user: script === "latin" ? "Foydalanuvchi" : "Фойдаланувчи",
    status: script === "latin" ? "Holat" : "Ҳолат",
    allow: script === "latin" ? "Ruxsat berish" : "Рухсат бериш",
    alreadyAllowed: script === "latin" ? "Ruxsat berilgan" : "Рухсат берилган",
    noReports:
      script === "latin" ? "Hisobotlar topilmadi" : "Ҳисоботлар топилмади",
    search: script === "latin" ? "Qidirish..." : "Қидириш...",
    daily: script === "latin" ? "Kunlik" : "Кунлик",
    allowed: script === "latin" ? "Ruxsat berilgan" : "Рухсат берилган",
    notAllowed: script === "latin" ? "Ruxsat berilmagan" : "Рухсат берилмаган",
    allowEdit:
      script === "latin"
        ? "Tahrirlashga ruxsat berish"
        : "Таҳрирлашга рухсат бериш",
    permissionGranted:
      script === "latin"
        ? "Tahrirlash uchun ruxsat berildi"
        : "Таҳрирлаш учун рухсат берилди",
    permissionAlreadyGranted:
      script === "latin"
        ? "Bu hisobotga allaqachon ruxsat berilgan"
        : "Бу ҳисоботга аллақачон рухсат берилган",
    noPermission:
      script === "latin"
        ? "Faqat viloyat dispetcherlari ruxsat berishi mumkin"
        : "Фақат вилоят диспетчерлари рухсат бериши мумкин",
  };

  useEffect(() => {
    loadReports();
  }, [selectedDate]);

  // Загрузка отчетов за выбранную дату
  const loadReports = async () => {
    setLoading(true);
    try {
      // Загружаем все отчеты за день
      const reportsRef = collection(db, "reports");
      const q = query(reportsRef, where("date", "==", selectedDate));
      const snapshot = await getDocs(q);
      const reportsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Группируем по регионам
      const groupedByRegion = {};
      reportsData.forEach((report) => {
        const key = report.regionId;
        if (!groupedByRegion[key]) {
          groupedByRegion[key] = {
            regionId: report.regionId,
            regionName: report.regionName || key,
            reports: [],
          };
        }
        groupedByRegion[key].reports.push(report);
      });

      setReports(Object.values(groupedByRegion));

      // Загружаем существующие разрешения
      await loadPermissions();
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error(
        script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
      );
    } finally {
      setLoading(false);
    }
  };

  // Загрузка разрешений
  const loadPermissions = async () => {
    try {
      const permissionsRef = collection(db, "report_edit_permissions");
      const q = query(permissionsRef, where("date", "==", selectedDate));
      const snapshot = await getDocs(q);
      const perms = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        perms[data.reportId] = {
          id: doc.id,
          ...data,
        };
      });
      setPermissions(perms);
    } catch (error) {
      console.error("Error loading permissions:", error);
    }
  };

  // Выдача разрешения на редактирование
  const grantPermission = async (report) => {
    // Проверка прав - только областной диспетчер
    if (userData?.role !== "vil_disp") {
      toast.warning(translations.noPermission);
      return;
    }

    // Проверяем, есть ли уже разрешение
    if (permissions[report.id]) {
      toast.warning(translations.permissionAlreadyGranted);
      return;
    }

    try {
      // Создаем разрешение
      const permissionData = {
        reportId: report.id,
        date: report.date,
        hour: report.hour,
        regionId: report.regionId,
        regionName: report.regionName,
        userId: report.userId,
        userName: report.userName,
        grantedBy: user.uid,
        grantedByEmail: user.email,
        grantedAt: serverTimestamp(),
        isUsed: false,
        expiresAt: new Date(
          new Date(`${report.date}T04:00:00`).getTime() + 24 * 60 * 60 * 1000,
        ),
      };

      await addDoc(collection(db, "report_edit_permissions"), permissionData);

      // Логируем
      await log(ActionTypes.REPORT_PERMISSION_GRANTED, {
        reportId: report.id,
        reportDate: report.date,
        reportHour: report.hour,
        regionName: report.regionName,
        userName: report.userName,
        grantedBy: user.email,
      });

      toast.success(translations.permissionGranted);
      await loadPermissions();
    } catch (error) {
      console.error("Error granting permission:", error);
      toast.error(
        script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
      );
    }
  };

  // Фильтрация по поиску
  const filteredReports = reports.filter(
    (item) =>
      item.regionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reports.some((r) =>
        r.userName?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Проверка роли
  const isVilDisp =
    userData?.role === "vil_disp" || userData?.role === "vil_disp";

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {translations.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {translations.subtitle}
        </p>
      </div>

      {/* Фильтры */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {translations.date}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {translations.search}
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder={translations.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Таблица */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.region}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.user}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.status}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.daily}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.allow}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReports.length > 0 ? (
                filteredReports.map((region) => {
                  // Находим суточный отчет (hour === 0)
                  const dailyReport = region.reports.find((r) => r.hour === 0);

                  if (!dailyReport) {
                    return (
                      <tr key={region.regionId}>
                        <td
                          colSpan="5"
                          className="px-4 py-4 text-center text-gray-500 dark:text-gray-400"
                        >
                          {translations.noReports}
                        </td>
                      </tr>
                    );
                  }

                  const hasPermission = !!permissions[dailyReport.id];
                  const canGrant = isVilDisp && !hasPermission;

                  return (
                    <tr
                      key={region.regionId}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {region.regionName}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {dailyReport.userName || dailyReport.userId}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            hasPermission
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}
                        >
                          {hasPermission
                            ? translations.allowed
                            : translations.notAllowed}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                          <Calendar className="w-4 h-4" />
                          <span>{dailyReport.date}</span>
                          <span className="mx-1">|</span>
                          <Clock className="w-4 h-4" />
                          <span>00:00</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {canGrant ? (
                          <button
                            onClick={() => grantPermission(dailyReport)}
                            className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-1 ml-auto"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {translations.allow}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">
                            {hasPermission ? translations.alreadyAllowed : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    {translations.noReports}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EditPermissions;
