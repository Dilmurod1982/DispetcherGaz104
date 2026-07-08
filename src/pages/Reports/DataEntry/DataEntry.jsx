import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Calendar,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  FileText,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Search,
} from "lucide-react";
import useLanguageStore from "../../../store/languageStore";
import useAuthStore from "../../../store/authStore";
import useReportStore from "../../../store/reportStore";
import useLogger from "../../../hooks/useLogger";
import { ActionTypes } from "../../../services/logger";
import {
  getToday,
  getCurrentHour,
  formatDateDisplay,
  formatTime,
  getReportTypeByHour,
} from "../../../services/reportUtils";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { toast } from "react-toastify";
import EditReportModal from "../../../components/Reports/EditReportModal.jsx";

const DataEntry = () => {
  const { script } = useLanguageStore();
  const { user, userData } = useAuthStore();
  const { log } = useLogger();
  const {
    reports,
    loading,
    loadReports,
    createReport,
    updateReport,
    getReportByTime,
    userAssignedItems,
    loadUserAssignedItems,
  } = useReportStore();

  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedHour, setSelectedHour] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [existingReport, setExistingReport] = useState(null);
  const [reportHours, setReportHours] = useState([]);
  const [assignedObjects, setAssignedObjects] = useState({
    grs: [],
    nodes: [],
    interdistrict: [],
    consumers: [],
    grp: [],
  });
  const [loadingObjects, setLoadingObjects] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isReportSaved, setIsReportSaved] = useState(false);

  const translations = {
    title:
      script === "latin" ? "Ma'lumotlarni kiritish" : "Маълумотларни киритиш",
    subtitle:
      script === "latin"
        ? "Gaz hisoblagichlari ma'lumotlarini kiritish"
        : "Газ ҳисоблагичлари маълумотларини киритиш",
    selectDate: script === "latin" ? "Sana tanlang" : "Сана танланг",
    selectTime: script === "latin" ? "Vaqt tanlang" : "Вақт танланг",
    save: script === "latin" ? "Saqlash" : "Сақлаш",
    saving: script === "latin" ? "Saqlanmoqda..." : "Сақланмоқда...",
    edit: script === "latin" ? "Tahrirlash" : "Таҳрирлаш",
    cancel: script === "latin" ? "Bekor qilish" : "Бекор қилиш",
    delete: script === "latin" ? "O'chirish" : "Ўчириш",
    noData:
      script === "latin" ? "Ma'lumot mavjud emas" : "Маълумот мавжуд эмас",
    enterData:
      script === "latin" ? "Ma'lumotlarni kiriting" : "Маълумотларни киритинг",
    reportExists:
      script === "latin"
        ? "Bu vaqt uchun hisobot mavjud"
        : "Бу вақт учун ҳисобот мавжуд",
    reportNotExists:
      script === "latin"
        ? "Bu vaqt uchun hisobot mavjud emas"
        : "Бу вақт учун ҳисобот мавжуд эмас",
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
    reportType: script === "latin" ? "Hisobot turi" : "Ҳисобот тури",
    daily: script === "latin" ? "Kunlik" : "Кунлик",
    sixHour: script === "latin" ? "6 soatlik" : "6 соатлик",
    twoHour: script === "latin" ? "2 soatlik" : "2 соатлик",
    assignedItems:
      script === "latin"
        ? "Sizga biriktirilgan obyektlar"
        : "Сизга бириктирилган объектлар",
    noAssignedItems:
      script === "latin"
        ? "Sizga hech qanday obyekt biriktirilmagan"
        : "Сизга ҳеч қандай объект бириктирилмаган",
    enterValue: script === "latin" ? "Qiymat kiriting" : "Қиймат киритинг",
    loadingObjects:
      script === "latin"
        ? "Obyektlar yuklanmoqda..."
        : "Объектлар юкланмоқда...",
    name: script === "latin" ? "Nomi" : "Номи",
    total: script === "latin" ? "Jami" : "Жами",
    object: script === "latin" ? "Obyekt" : "Объект",
    search: script === "latin" ? "Qidirish..." : "Қидириш...",
    fillRequired:
      script === "latin"
        ? "Iltimos, barcha maydonlarni to'ldiring"
        : "Илтимос, барча майдонларни тўлдиринг",
  };

  // Загрузка прикрепленных объектов
  const loadAssignedObjects = async () => {
    setLoadingObjects(true);
    try {
      const assignedCities = userData?.assignedCities || [];

      if (assignedCities.length === 0) {
        setLoadingObjects(false);
        return;
      }

      const objects = {
        grs: [],
        nodes: [],
        interdistrict: [],
        consumers: [],
        grp: [],
      };

      // Загрузка ГРС
      const grsQuery = query(
        collection(db, "grs"),
        where("locationId", "in", assignedCities),
      );
      const grsSnapshot = await getDocs(grsQuery);
      grsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        objects.grs.push({
          id: doc.id,
          ...data,
          category: "grs",
          displayName: data.name || data.id,
        });
      });

      // Загрузка узлов (nodes)
      const nodesQuery = query(
        collection(db, "nodes"),
        where("cityId", "in", assignedCities),
      );
      const nodesSnapshot = await getDocs(nodesQuery);
      nodesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        objects.nodes.push({
          id: doc.id,
          ...data,
          category: "nodes",
          displayName: `${data.name || data.id} (ГТШ: ${data.grsName || "—"})`,
        });
      });

      // Загрузка межрайонных счетчиков
      const interQuery = query(
        collection(db, "interdistrict"),
        where("supplierId", "in", assignedCities),
      );
      const interSnapshot = await getDocs(interQuery);
      interSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        objects.interdistrict.push({
          id: doc.id,
          ...data,
          category: "interdistrict",
          displayName: data.name || data.id,
        });
      });

      // Загрузка потребителей
      const consumersQuery = query(
        collection(db, "consumers"),
        where("locationId", "in", assignedCities),
      );
      const consumersSnapshot = await getDocs(consumersQuery);
      consumersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        objects.consumers.push({
          id: doc.id,
          ...data,
          category: "consumers",
          displayName: data.name || data.id,
        });
      });

      // Загрузка ГРП
      const grpQuery = query(
        collection(db, "grp"),
        where("locationId", "in", assignedCities),
      );
      const grpSnapshot = await getDocs(grpQuery);
      grpSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        objects.grp.push({
          id: doc.id,
          ...data,
          category: "grp",
          displayName: data.name || data.id,
        });
      });

      setAssignedObjects(objects);
    } catch (error) {
      console.error("Error loading assigned objects:", error);
      toast.error(
        script === "latin"
          ? "Obyektlarni yuklashda xatolik"
          : "Объектларни юклашда хатолик",
      );
    } finally {
      setLoadingObjects(false);
    }
  };

  // Загрузка данных пользователя
  useEffect(() => {
    if (user?.uid) {
      loadUserAssignedItems(user.uid);
      loadAssignedObjects();
    }
  }, [user]);

  // Загрузка отчетов при изменении даты
  useEffect(() => {
    if (selectedDate) {
      loadReports(selectedDate);
    }
  }, [selectedDate]);

  // Определение часов для отчетов
  useEffect(() => {
    const hours = [];
    for (let h = 0; h <= 22; h += 2) {
      hours.push(h);
    }
    setReportHours(hours);
  }, []);

  // Проверка существования отчета при выборе времени
  useEffect(() => {
    if (selectedHour !== null && selectedDate) {
      checkExistingReport();
    }
  }, [selectedHour, selectedDate]);

  const checkExistingReport = async () => {
    const regionId = userData?.assignedCities?.[0];
    if (!regionId) return;

    const result = await getReportByTime(selectedDate, selectedHour, regionId);
    if (result.success && result.report) {
      setExistingReport(result.report);
      setFormData(result.report.data || {});
      setIsEditing(true);
      setIsReportSaved(true);
    } else {
      setExistingReport(null);
      setFormData({});
      setIsEditing(false);
      setIsReportSaved(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedHour(null);
    setIsEditing(false);
    setExistingReport(null);
    setIsReportSaved(false);
    setFormData({});
  };

  const handleHourSelect = (hour) => {
    setSelectedHour(hour);
    setIsReportSaved(false);
  };

  const handleInputChange = (category, id, field, value) => {
    // Если значение пустая строка - оставляем как есть
    // Если число - сохраняем (0 разрешен)
    const processedValue = value === "" ? "" : parseFloat(value);
    // Если после парсинга получилось NaN, ставим 0
    const finalValue = isNaN(processedValue) ? 0 : processedValue;

    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [id]: {
          ...prev[category]?.[id],
          [field]: finalValue,
        },
      },
    }));
  };

  // Получение полей для категории
  const getFieldsForCategory = (category) => {
    const fields = {
      grs: ["flow", "pressure"],
      nodes: ["flow", "pressure"],
      interdistrict: ["flow", "pressure"],
      consumers: ["flow"],
      grp: ["pressure"],
    };
    return fields[category] || [];
  };

  // Получение всех объектов в едином массиве для таблицы
  const getAllItems = () => {
    const items = [];

    assignedObjects.grs.forEach((item) => {
      items.push({ ...item, category: "grs", categoryLabel: translations.grs });
    });

    assignedObjects.nodes.forEach((item) => {
      items.push({
        ...item,
        category: "nodes",
        categoryLabel: translations.nodes,
      });
    });

    assignedObjects.interdistrict.forEach((item) => {
      items.push({
        ...item,
        category: "interdistrict",
        categoryLabel: translations.interdistrict,
      });
    });

    assignedObjects.consumers.forEach((item) => {
      items.push({
        ...item,
        category: "consumers",
        categoryLabel: translations.consumers,
      });
    });

    assignedObjects.grp.forEach((item) => {
      items.push({ ...item, category: "grp", categoryLabel: translations.grp });
    });

    return items;
  };

  // Проверка, все ли поля заполнены (0 считается валидным значением)
  const hasAllFieldsFilled = () => {
    const allItems = getAllItems();
    if (allItems.length === 0) return false;

    let allFilled = true;
    allItems.forEach((item) => {
      const itemData = formData[item.category]?.[item.id] || {};
      const fields = getFieldsForCategory(item.category);

      fields.forEach((field) => {
        const value = itemData[field];
        // Проверяем только на undefined, null и пустую строку
        // 0 - валидное значение (означает что объект не работает/на ремонте)
        if (value === undefined || value === null || value === "") {
          allFilled = false;
        }
      });
    });

    return allFilled;
  };

  const handleSave = async () => {
    if (selectedHour === null) {
      toast.warning(
        script === "latin"
          ? "Iltimos, vaqtni tanlang"
          : "Илтимос, вақтни танланг",
      );
      return;
    }

    // Проверяем, все ли поля заполнены
    if (!hasAllFieldsFilled()) {
      toast.warning(translations.fillRequired);
      return;
    }

    const regionId = userData?.assignedCities?.[0];
    const regionName = userData?.assignedCitiesNames?.[0];

    if (!regionId) {
      toast.warning(
        script === "latin"
          ? "Sizga biriktirilgan region topilmadi"
          : "Сизга бириктирилган регион топилмади",
      );
      return;
    }

    const reportType = getReportTypeByHour(selectedHour);

    // Создаем копию данных с добавлением displayName
    const dataWithNames = {};
    const categories = ["grs", "nodes", "interdistrict", "consumers", "grp"];

    categories.forEach((cat) => {
      dataWithNames[cat] = {};
      const categoryData = formData[cat] || {};

      Object.keys(categoryData).forEach((id) => {
        const objectData = assignedObjects[cat]?.find((item) => item.id === id);
        const displayName = objectData?.displayName || objectData?.name || id;

        dataWithNames[cat][id] = {
          ...categoryData[id],
          displayName: displayName,
          name: objectData?.name || id,
          ...(cat === "nodes" && objectData?.grsName
            ? { grsName: objectData.grsName }
            : {}),
        };
      });
    });

    const reportData = {
      type: reportType,
      regionId,
      regionName,
      userId: user.uid,
      userName: userData?.displayName || user.email,
      date: selectedDate,
      hour: selectedHour,
      data: dataWithNames,
      ...(reportType === "daily" && {
        totals: {
          totalPopulation: formData.totals?.totalPopulation || 0,
          totalWholesale: formData.totals?.totalWholesale || 0,
          losses: formData.totals?.losses || 0,
        },
      }),
    };

    let result;
    if (isEditing && existingReport) {
      result = await updateReport(existingReport.id, reportData);
    } else {
      result = await createReport(reportData);
    }

    if (result.success) {
      toast.success(
        script === "latin"
          ? "Hisobot muvaffaqiyatli saqlandi"
          : "Ҳисобот муваффақиятли сақланди",
      );
      setIsReportSaved(true);
      setIsEditing(true);
      await loadReports(selectedDate);

      // Обновляем existingReport
      const updated = await getReportByTime(
        selectedDate,
        selectedHour,
        regionId,
      );
      if (updated.success && updated.report) {
        setExistingReport(updated.report);
        setFormData(updated.report.data || {});
      }
    } else {
      toast.error(
        result.error ||
          (script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди"),
      );
    }
  };

  // Открытие модального окна редактирования
  const handleEditClick = () => {
    if (existingReport) {
      setEditingReport(existingReport);
      setIsEditModalOpen(true);
    }
  };

  // Сохранение отредактированного отчета
  const handleEditSave = async (updatedData) => {
    setIsSavingEdit(true);
    try {
      const regionId = userData?.assignedCities?.[0];
      const regionName = userData?.assignedCitiesNames?.[0];

      const reportType = getReportTypeByHour(selectedHour);

      // Сохраняем старые данные для логирования
      const oldData = existingReport?.data || {};

      const reportData = {
        type: reportType,
        regionId,
        regionName,
        userId: user.uid,
        userName: userData?.displayName || user.email,
        date: selectedDate,
        hour: selectedHour,
        data: updatedData,
        ...(reportType === "daily" && {
          totals: {
            totalPopulation: updatedData.totals?.totalPopulation || 0,
            totalWholesale: updatedData.totals?.totalWholesale || 0,
            losses: updatedData.totals?.losses || 0,
          },
        }),
      };

      const result = await updateReport(existingReport.id, reportData);

      if (result.success) {
        // Логируем редактирование отчета
        await log(ActionTypes.REPORT_EDITED, {
          reportId: existingReport.id,
          reportDate: selectedDate,
          reportHour: selectedHour,
          reportType: reportType,
          regionName: regionName,
          regionId: regionId,
          oldData: oldData,
          newData: updatedData,
          changes: {
            hasChanges: JSON.stringify(oldData) !== JSON.stringify(updatedData),
          },
        });

        toast.success(
          script === "latin"
            ? "Hisobot muvaffaqiyatli tahrirlandi"
            : "Ҳисобот муваффақиятли таҳрирланди",
        );
        await loadReports(selectedDate);
        setIsEditModalOpen(false);
        setEditingReport(null);

        // Обновляем existingReport
        const updated = await getReportByTime(
          selectedDate,
          selectedHour,
          regionId,
        );
        if (updated.success && updated.report) {
          setExistingReport(updated.report);
          setFormData(updated.report.data || {});
        }
      } else {
        toast.error(
          result.error ||
            (script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди"),
        );
      }
    } catch (error) {
      console.error("Error editing report:", error);
      toast.error(
        script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Получение типа отчета на узбекском
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

  // Проверка, является ли отчет суточным
  const isDailyReport = selectedHour === 0;

  // Фильтрация по поиску
  const allItems = getAllItems();
  const filteredItems = allItems.filter(
    (item) =>
      item.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoryLabel?.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const hasObjects = filteredItems.length > 0;

  return (
    <div className="p-4 max-w-full mx-auto">
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {translations.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {translations.subtitle}
        </p>
      </div>

      {/* Выбор даты и времени */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
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
                const isCurrentHour =
                  hour <= getCurrentHour() && selectedDate === getToday();

                let bgColor =
                  "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600";
                if (isActive) {
                  bgColor = "bg-blue-500 text-white hover:bg-blue-600";
                } else if (hasReport) {
                  bgColor =
                    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50";
                } else if (!isCurrentHour && selectedDate === getToday()) {
                  bgColor =
                    "bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed";
                }

                return (
                  <button
                    key={hour}
                    onClick={() => {
                      if (
                        selectedDate === getToday() &&
                        hour > getCurrentHour()
                      ) {
                        toast.warning(
                          script === "latin"
                            ? "Kelajak vaqt uchun hisobot yozib bo'lmaydi"
                            : "Келажак вақт учун ҳисобот ёзиб бўлмайди",
                        );
                        return;
                      }
                      handleHourSelect(hour);
                    }}
                    disabled={
                      selectedDate === getToday() && hour > getCurrentHour()
                    }
                    className={`p-1.5 text-xs rounded-lg transition-all duration-200 relative ${bgColor} ${
                      selectedDate === getToday() && hour > getCurrentHour()
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <span>{formatTime(hour)}</span>
                    {hasReport && (
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
                  {script === "latin" ? "Tanlangan" : "Танланган"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <span className="text-gray-500 dark:text-gray-400">
                  {script === "latin" ? "Hisobot yo'q" : "Ҳисобот йўқ"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {translations.reportType}
            </label>
            <div className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
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
                  {isReportSaved && (
                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {script === "latin" ? "Saqlangan" : "Сақланган"}
                    </span>
                  )}
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

      {/* Форма ввода данных - табличный вид */}
      {selectedHour !== null && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex flex-wrap justify-between items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              {isReportSaved ? (
                <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  {script === "latin"
                    ? "Hisobot saqlangan"
                    : "Ҳисобот сақланган"}
                </span>
              ) : isEditing ? (
                <span className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-blue-500" />
                  {script === "latin"
                    ? "Hisobotni tahrirlash"
                    : "Ҳисоботни таҳрирлаш"}
                </span>
              ) : (
                translations.enterData
              )}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
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
                  className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors w-48 sm:w-56"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{formatDateDisplay(selectedDate)}</span>
                <span className="mx-1">|</span>
                <Clock className="w-4 h-4" />
                <span>{formatTime(selectedHour)}</span>
              </div>
            </div>
          </div>

          {loadingObjects ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                {translations.loadingObjects}
              </span>
            </div>
          ) : !hasObjects ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {translations.noAssignedItems}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {script === "latin"
                  ? "Sizga biriktirilgan obyektlar mavjud emas"
                  : "Сизга бириктирилган объектлар мавжуд эмас"}
              </p>
            </div>
          ) : (
            <>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                        {translations.flow}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                        {translations.pressure}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredItems.map((item) => {
                      const fields = getFieldsForCategory(item.category);
                      const itemData = formData[item.category]?.[item.id] || {};
                      const isDisabled = isReportSaved;

                      return (
                        <tr
                          key={`${item.category}_${item.id}`}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {item.categoryLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {item.displayName || item.name || item.id}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {fields.includes("flow") ? (
                              <input
                                type="number"
                                step="0.01"
                                value={
                                  itemData.flow !== undefined &&
                                  itemData.flow !== null
                                    ? itemData.flow
                                    : ""
                                }
                                onChange={(e) =>
                                  handleInputChange(
                                    item.category,
                                    item.id,
                                    "flow",
                                    e.target.value,
                                  )
                                }
                                disabled={isDisabled}
                                className={`w-28 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                  isDisabled
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                placeholder="0.00"
                              />
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {fields.includes("pressure") ? (
                              <input
                                type="number"
                                step="0.01"
                                value={
                                  itemData.pressure !== undefined &&
                                  itemData.pressure !== null
                                    ? itemData.pressure
                                    : ""
                                }
                                onChange={(e) =>
                                  handleInputChange(
                                    item.category,
                                    item.id,
                                    "pressure",
                                    e.target.value,
                                  )
                                }
                                disabled={isDisabled}
                                className={`w-28 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                  isDisabled
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                placeholder="0.00"
                              />
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Суточный отчет - дополнительные поля */}
              {isDailyReport && (
                <div className="p-4 border-t border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
                  <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                    {script === "latin"
                      ? "Kunlik qo'shimcha ma'lumotlar"
                      : "Кунлик қўшимча маълумотлар"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {translations.totalPopulation}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={
                          formData.totals?.totalPopulation !== undefined &&
                          formData.totals?.totalPopulation !== null
                            ? formData.totals.totalPopulation
                            : ""
                        }
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value);
                          setFormData((prev) => ({
                            ...prev,
                            totals: {
                              ...prev.totals,
                              totalPopulation: isNaN(value) ? 0 : value,
                            },
                          }));
                        }}
                        disabled={isReportSaved}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                          isReportSaved ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {translations.totalWholesale}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={
                          formData.totals?.totalWholesale !== undefined &&
                          formData.totals?.totalWholesale !== null
                            ? formData.totals.totalWholesale
                            : ""
                        }
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value);
                          setFormData((prev) => ({
                            ...prev,
                            totals: {
                              ...prev.totals,
                              totalWholesale: isNaN(value) ? 0 : value,
                            },
                          }));
                        }}
                        disabled={isReportSaved}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                          isReportSaved ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {translations.losses}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={
                          formData.totals?.losses !== undefined &&
                          formData.totals?.losses !== null
                            ? formData.totals.losses
                            : ""
                        }
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value);
                          setFormData((prev) => ({
                            ...prev,
                            totals: {
                              ...prev.totals,
                              losses: isNaN(value) ? 0 : value,
                            },
                          }));
                        }}
                        disabled={isReportSaved}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                          isReportSaved ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Кнопки */}
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex flex-wrap gap-3 justify-end">
                <button
                  onClick={() => {
                    setFormData({});
                    setSelectedHour(null);
                    setIsReportSaved(false);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {translations.cancel}
                </button>

                {isReportSaved ? (
                  <button
                    onClick={handleEditClick}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {translations.edit}
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={loading || !hasAllFieldsFilled()}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      loading || !hasAllFieldsFilled()
                        ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {translations.saving}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {isEditing ? translations.edit : translations.save}
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {selectedHour === null && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {script === "latin"
              ? "Hisobot vaqtini tanlang"
              : "Ҳисобот вақтини танланг"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {script === "latin"
              ? "Iltimos, yuqoridagi kalendardan sana va vaqtni tanlang"
              : "Илтимос, юқоридаги календардан сана ва вақтни танланг"}
          </p>
        </div>
      )}

      {/* Модальное окно редактирования */}
      {isEditModalOpen && editingReport && (
        <EditReportModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingReport(null);
          }}
          reportData={editingReport}
          onSave={handleEditSave}
          loading={isSavingEdit}
        />
      )}
    </div>
  );
};

export default DataEntry;
