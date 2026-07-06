import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  Clock,
  FileText,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Printer,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  X,
  RefreshCw,
  Search,
} from "lucide-react";
import useLanguageStore from "../../../store/languageStore";
import useAuthStore from "../../../store/authStore";
import useReportStore from "../../../store/reportStore";
import {
  formatDateDisplay,
  formatTime,
  getReportTypeByHour,
} from "../../../services/reportUtils";
import { toast } from "react-toastify";

const ReportView = () => {
  const { script } = useLanguageStore();
  const { user, userData } = useAuthStore();
  const {
    reports,
    loading,
    loadReports,
    userAssignedItems,
    loadUserAssignedItems,
  } = useReportStore();

  const navigate = useNavigate();
  const { date, hour } = useParams();

  const [selectedDate, setSelectedDate] = useState(
    date || new Date().toISOString().split("T")[0],
  );
  const [selectedHour, setSelectedHour] = useState(
    hour ? parseInt(hour) : null,
  );
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportHours, setReportHours] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const translations = {
    title: script === "latin" ? "Hisobotni ko'rish" : "Ҳисоботни кўриш",
    subtitle:
      script === "latin"
        ? "Gaz hisoblagichlari hisobotlari"
        : "Газ ҳисоблагичлари ҳисоботлари",
    noReport:
      script === "latin"
        ? "Bu vaqt uchun hisobot mavjud emas"
        : "Бу вақт учун ҳисобот мавжуд эмас",
    selectDate: script === "latin" ? "Sana tanlang" : "Сана танланг",
    selectTime: script === "latin" ? "Vaqt tanlang" : "Вақт танланг",
    reportDetails:
      script === "latin" ? "Hisobot tafsilotlari" : "Ҳисобот тафсилотлари",
    generalInfo:
      script === "latin" ? "Umumiy ma'lumotlar" : "Умумий маълумотлар",
    reportType: script === "latin" ? "Hisobot turi" : "Ҳисобот тури",
    date: script === "latin" ? "Sana" : "Сана",
    time: script === "latin" ? "Vaqt" : "Вақт",
    region: script === "latin" ? "Hudud" : "Ҳудуд",
    user: script === "latin" ? "Foydalanuvchi" : "Фойдаланувчи",
    download: script === "latin" ? "Yuklab olish" : "Юклаб олиш",
    print: script === "latin" ? "Chop etish" : "Чоп этиш",
    close: script === "latin" ? "Yopish" : "Ёпиш",
    grs: "ГТШ",
    nodes: script === "latin" ? "Tugunlar" : "Тугунлар",
    interdistrict:
      script === "latin"
        ? "Tumanlararo hisoblagichlar"
        : "Туманлараро ҳисоблагичлар",
    consumers: script === "latin" ? "Iste'molchilar" : "Истеъмолчилар",
    grp: "ГТҚ",
    flow: script === "latin" ? "Sarfi (m³)" : "Сарфи (м³)",
    pressure: script === "latin" ? "Bosim (kgc/s²)" : "Босим (кгс/с²)",
    totalPopulation:
      script === "latin" ? "Aholi umumiy sarfi" : "Аҳоли умумий сарфи",
    totalWholesale:
      script === "latin" ? "Ulgurji umumiy sarfi" : "Улгуржи умумий сарфи",
    losses: script === "latin" ? "Yo'qotishlar" : "Йўқотишлар",
    daily: script === "latin" ? "Kunlik hisobot" : "Кунлик ҳисобот",
    sixHour: script === "latin" ? "6 soatlik hisobot" : "6 соатлик ҳисобот",
    twoHour: script === "latin" ? "2 soatlik hisobot" : "2 соатлик ҳисобот",
    back: script === "latin" ? "Ortga" : "Ортга",
    noData: script === "latin" ? "Ma'lumot yo'q" : "Маълумот йўқ",
    total: script === "latin" ? "Jami" : "Жами",
    average: script === "latin" ? "O'rtacha" : "Ўртача",
    created: script === "latin" ? "Yaratilgan" : "Яратилган",
    updated: script === "latin" ? "Yangilangan" : "Янгиланган",
    exportCSV:
      script === "latin"
        ? "CSV formatida yuklab olish"
        : "CSV форматида юклаб олиш",
    name: script === "latin" ? "Nomi" : "Номи",
    object: script === "latin" ? "Obyekt" : "Объект",
    search: script === "latin" ? "Qidirish..." : "Қидириш...",
    totalFlow: script === "latin" ? "Umumiy sarfi" : "Умумий сарфи",
    avgPressure: script === "latin" ? "O'rtacha bosim" : "Ўртача босим",
  };

  useEffect(() => {
    if (user?.uid) {
      loadUserAssignedItems(user.uid);
    }
  }, [user]);

  useEffect(() => {
    if (selectedDate) {
      loadReports(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedHour !== null && reports.length > 0) {
      const report = reports.find((r) => r.hour === selectedHour);
      setSelectedReport(report || null);
    } else if (selectedHour === null && reports.length > 0) {
      const lastReport = reports[reports.length - 1];
      if (lastReport) {
        setSelectedReport(lastReport);
        setSelectedHour(lastReport.hour);
      }
    }
  }, [reports, selectedHour]);

  useEffect(() => {
    const hours = [];
    for (let h = 0; h <= 22; h += 2) {
      hours.push(h);
    }
    setReportHours(hours);
  }, []);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedHour(null);
    setSelectedReport(null);
  };

  const handleHourSelect = (hour) => {
    setSelectedHour(hour);
    const report = reports.find((r) => r.hour === hour);
    setSelectedReport(report || null);
  };

  const getReportTypeLabel = (hour) => {
    const type = getReportTypeByHour(hour);
    switch (type) {
      case "daily":
        return translations.daily;
      case "six_hour":
        return translations.sixHour;
      case "two_hour":
        return translations.twoHour;
      default:
        return "";
    }
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return "—";
    return Number(num).toFixed(2);
  };

  // Получение всех объектов из отчета с категориями и отображением
  const getReportItems = () => {
    if (!selectedReport) return [];

    const items = [];
    const data = selectedReport.data || {};

    // Категории с их данными
    const categories = [
      { key: "grs", label: translations.grs },
      { key: "nodes", label: translations.nodes },
      { key: "interdistrict", label: translations.interdistrict },
      { key: "consumers", label: translations.consumers },
      { key: "grp", label: translations.grp },
    ];

    categories.forEach((cat) => {
      const categoryData = data[cat.key] || {};
      Object.keys(categoryData).forEach((id) => {
        const item = categoryData[id];

        // Используем displayName если есть, иначе name, иначе id
        let displayName = item.displayName || item.name || id;

        // Если это узел и есть grsName, добавляем его
        if (cat.key === "nodes" && item.grsName && !item.displayName) {
          displayName = `${item.name || id} (ГТШ: ${item.grsName})`;
        }

        items.push({
          id,
          category: cat.key,
          categoryLabel: cat.label,
          name: displayName,
          flow: item.flow || null,
          pressure: item.pressure || null,
        });
      });
    });

    return items;
  };

  // Фильтрация по поиску
  const filteredItems = getReportItems().filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoryLabel.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Подсчет итогов
  const calculateTotals = (items) => {
    let totalFlow = 0;
    let totalPressure = 0;
    let pressureCount = 0;

    items.forEach((item) => {
      if (item.flow) totalFlow += parseFloat(item.flow) || 0;
      if (item.pressure) {
        totalPressure += parseFloat(item.pressure) || 0;
        pressureCount++;
      }
    });

    return {
      totalFlow,
      avgPressure: pressureCount > 0 ? totalPressure / pressureCount : 0,
      count: items.length,
    };
  };

  const totals = calculateTotals(filteredItems);

  const downloadCSV = () => {
    if (!selectedReport) return;

    const items = getReportItems();
    const headers = ["Категория", "Объект", "Расход (м³)", "Давление (кгс/с²)"];
    const csv = [
      headers.join(","),
      ...items.map((item) =>
        [
          item.categoryLabel,
          item.name,
          item.flow || "—",
          item.pressure || "—",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report_${selectedDate}_${selectedHour}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast.success(translations.exportCSV);
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-full mx-auto print:max-w-full print:p-0">
      {/* Заголовок */}
      <div className="mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {translations.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {translations.subtitle}
            </p>
          </div>
          <button
            onClick={() => navigate("/reports/data-entry")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            {translations.back}
          </button>
        </div>
      </div>

      {/* Выбор даты и времени */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {translations.selectDate}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {translations.selectTime}
            </label>
            <div className="grid grid-cols-4 gap-1">
              {reportHours.map((hour) => {
                const isActive = selectedHour === hour;
                const hasReport = reports.some((r) => r.hour === hour);

                let bgColor =
                  "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600";
                let textColor = "text-gray-700 dark:text-gray-300";

                if (isActive) {
                  bgColor = "bg-blue-500 hover:bg-blue-600";
                  textColor = "text-white";
                } else if (hasReport) {
                  bgColor =
                    "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50";
                  textColor = "text-green-700 dark:text-green-300";
                }

                return (
                  <button
                    key={hour}
                    onClick={() => handleHourSelect(hour)}
                    className={`p-1.5 text-xs rounded-lg transition-all duration-200 relative ${bgColor} ${textColor}`}
                  >
                    <span>{formatTime(hour)}</span>
                    {hasReport && !isActive && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-500 dark:text-gray-400">
                  {script === "latin" ? "Hisobot bor" : "Ҳисобот бор"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-gray-500 dark:text-gray-400">
                  {script === "latin" ? "Ko'rilmoqda" : "Кўрилмоқда"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {translations.reportType}
            </label>
            <div className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              {selectedHour !== null ? (
                <>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      getReportTypeByHour(selectedHour) === "daily"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                        : getReportTypeByHour(selectedHour) === "six_hour"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    }`}
                  >
                    {getReportTypeLabel(selectedHour)}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(selectedHour)}
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-400">
                  {script === "latin" ? "Vaqt tanlanmagan" : "Вақт танланмаган"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Отчет - табличный вид */}
      {selectedReport ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden print:border-0 print:shadow-none">
          {/* Заголовок отчета */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 print:bg-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  {translations.reportDetails}
                </h2>
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDateDisplay(selectedReport.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(selectedReport.hour)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        selectedReport.type === "daily"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          : selectedReport.type === "six_hour"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      }`}
                    >
                      {getReportTypeLabel(selectedReport.hour)}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">
                      {translations.region}: {selectedReport.regionName || "—"}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex gap-2 print:hidden">
                <button
                  onClick={downloadCSV}
                  className="px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  {translations.download}
                </button>
                <button
                  onClick={printReport}
                  className="px-3 py-1.5 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  <Printer className="w-4 h-4" />
                  {translations.print}
                </button>
              </div>
            </div>
          </div>

          {/* Поиск */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 print:hidden">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder={translations.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          {/* Таблица данных */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                    {translations.name}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">
                    {translations.object}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                    {translations.flow}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                    {translations.pressure}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <tr
                      key={`${item.category}_${item.id}_${index}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.categoryLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {item.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {formatNumber(item.flow)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-sm font-medium ${
                            item.pressure > 3.0
                              ? "text-red-500"
                              : item.pressure > 2.5
                                ? "text-yellow-500"
                                : "text-green-500"
                          }`}
                        >
                          {formatNumber(item.pressure)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      {translations.noData}
                    </td>
                  </tr>
                )}
              </tbody>
              {/* Итоговая строка */}
              {filteredItems.length > 0 && (
                <tfoot className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <td
                      colSpan="2"
                      className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      {translations.total}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {formatNumber(totals.totalFlow)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatNumber(totals.avgPressure)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Суточные итоги */}
          {selectedReport.type === "daily" && selectedReport.data?.totals && (
            <div className="p-4 border-t border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {translations.totalPopulation}
                  </p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatNumber(selectedReport.data.totals.totalPopulation)}{" "}
                    м³
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {translations.totalWholesale}
                  </p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatNumber(selectedReport.data.totals.totalWholesale)} м³
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {translations.losses}
                  </p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {formatNumber(selectedReport.data.totals.losses)} м³
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {translations.noReport}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {script === "latin"
              ? "Bu vaqt uchun hisobot topilmadi. Iltimos, boshqa vaqtni tanlang"
              : "Бу вақт учун ҳисобот топилмади. Илтимос, бошқа вақтни танланг"}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportView;
