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
  ArrowRight,
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
  isReportAvailable,
  canEditReport,
  canCreateReportForToday,
  canCreateSpecificReport,
  getReportAvailableTime,
  getEditDeadline,
} from "../../../services/reportUtils";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { toast } from "react-toastify";
import EditReportModal from "../../../components/Reports/EditReportModal.jsx";

// Компонент модального окна подтверждения
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  data,
  translations,
  loading,
  assignedObjects,
}) => {
  if (!isOpen) return null;

  // Получаем все элементы для отображения с правильными названиями
  const getAllItems = () => {
    const items = [];
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
        // Ищем объект в assignedObjects для получения правильного названия
        const objectData = assignedObjects[cat.key]?.find(
          (obj) => obj.id === id,
        );
        const displayName =
          objectData?.displayName ||
          objectData?.name ||
          item.displayName ||
          item.name ||
          id;

        items.push({
          category: cat.key,
          categoryLabel: cat.label,
          id: id,
          name: displayName,
          flow: item.flow,
          pressureIn: item.pressureIn,
          pressureOut: item.pressureOut,
        });
      });
    });

    return items;
  };

  const items = getAllItems();
  const hasTotals =
    data.totals &&
    (data.totals.totalPopulation ||
      data.totals.totalWholesale ||
      data.totals.losses);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-[100]">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            {translations.confirmTitle || "Hisobotni tasdiqlang"}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="p-2 sm:p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          {/* Десктопная таблица */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {translations.category}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {translations.object}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {translations.flow}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {translations.pressureIn}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {translations.pressureOut}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item, index) => (
                  <tr
                    key={`${item.category}_${item.id}_${index}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {item.categoryLabel}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                      {item.flow !== undefined && item.flow !== null
                        ? Number(item.flow).toFixed(2)
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400">
                      {item.pressureIn !== undefined && item.pressureIn !== null
                        ? Number(item.pressureIn).toFixed(2)
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                      {item.pressureOut !== undefined &&
                      item.pressureOut !== null
                        ? Number(item.pressureOut).toFixed(2)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Мобильные карточки */}
          <div className="sm:hidden space-y-3">
            {items.map((item, index) => (
              <div
                key={`${item.category}_${item.id}_${index}`}
                className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {item.categoryLabel}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    #{index + 1}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {item.name}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white dark:bg-gray-800 rounded p-2 text-center border border-gray-200 dark:border-gray-600">
                    <div className="text-gray-500 dark:text-gray-400 text-[10px]">
                      {translations.flow}
                    </div>
                    <div className="font-semibold text-blue-600 dark:text-blue-400">
                      {item.flow !== undefined && item.flow !== null
                        ? Number(item.flow).toFixed(2)
                        : "—"}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded p-2 text-center border border-gray-200 dark:border-gray-600">
                    <div className="text-gray-500 dark:text-gray-400 text-[10px]">
                      {translations.pressureIn}
                    </div>
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      {item.pressureIn !== undefined && item.pressureIn !== null
                        ? Number(item.pressureIn).toFixed(2)
                        : "—"}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded p-2 text-center border border-gray-200 dark:border-gray-600">
                    <div className="text-gray-500 dark:text-gray-400 text-[10px]">
                      {translations.pressureOut}
                    </div>
                    <div className="font-semibold text-purple-600 dark:text-purple-400">
                      {item.pressureOut !== undefined &&
                      item.pressureOut !== null
                        ? Number(item.pressureOut).toFixed(2)
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Суточные итоги */}
          {hasTotals && (
            <div className="mt-4 p-3 sm:p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <h4 className="text-xs sm:text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">
                {translations.dailyTotals || "Кунлик жами"}
              </h4>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-center border border-gray-200 dark:border-gray-700">
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    {translations.totalPopulation}
                  </div>
                  <div className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">
                    {data.totals?.totalPopulation
                      ? Number(data.totals.totalPopulation).toFixed(2)
                      : "0"}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-center border border-gray-200 dark:border-gray-700">
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    {translations.totalWholesale}
                  </div>
                  <div className="text-sm sm:text-base font-bold text-green-600 dark:text-green-400">
                    {data.totals?.totalWholesale
                      ? Number(data.totals.totalWholesale).toFixed(2)
                      : "0"}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-center border border-gray-200 dark:border-gray-700">
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    {translations.losses}
                  </div>
                  <div className="text-sm sm:text-base font-bold text-red-600 dark:text-red-400">
                    {data.totals?.losses
                      ? Number(data.totals.losses).toFixed(2)
                      : "0"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {items.length === 0 && !hasTotals && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {translations.noDataAvailable || "Ma'lumot mavjud emas"}
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-end px-3 sm:px-6 py-2 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1 sm:gap-2"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
            {translations.cancel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-1 sm:gap-2 ${
              loading
                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {loading ? (
              <>
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {translations.saving}
              </>
            ) : (
              <>
                <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                {translations.save}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const [reportAvailability, setReportAvailability] = useState({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    pressureIn:
      script === "latin" ? "Kirish bosimi (kgc/s²)" : "Кириш босими (кгс/с²)",
    pressureOut:
      script === "latin" ? "Chiqish bosimi (kgc/s²)" : "Чиқиш босими (кгс/с²)",
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
    notAvailable:
      script === "latin" ? "Hisobot hali ochilmagan" : "Ҳисобот ҳали очилмаган",
    availableIn:
      script === "latin"
        ? "daqiqadan so'ng ochiladi"
        : "дақиқадан сўнг очилади",
    editTimeExpired:
      script === "latin" ? "Tahrirlash vaqti o'tgan" : "Таҳрирлаш вақти ўтган",
    pastDay: script === "latin" ? "O'tgan kun" : "Ўтган кун",
    futureDay: script === "latin" ? "Kelajak kun" : "Келажак кун",
    reportAvailable: script === "latin" ? "Hisobot ochiq" : "Ҳисобот очиқ",
    minutes: script === "latin" ? "daqiqa" : "дақиқа",
    viewOnly: script === "latin" ? "faqat ko'rish" : "фақат кўриш",
    creationPeriod:
      script === "latin"
        ? "Hisobot yozish vaqti 06:00 dan 06:00 gacha"
        : "Ҳисобот ёзиш вақти 06:00 дан 06:00 гача",
    category: script === "latin" ? "Turi" : "Тури",
    noDataAvailable: script === "latin" ? "Ma'lumot yo'q" : "Маълумот йўқ",
    confirmTitle:
      script === "latin" ? "Hisobotni tasdiqlang" : "Ҳисоботни тасдиқланг",
    dailyTotals: script === "latin" ? "Kunlik jami" : "Кунлик жами",
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

  useEffect(() => {
    if (user?.uid) {
      loadUserAssignedItems(user.uid);
      loadAssignedObjects();
    }
  }, [user]);

  useEffect(() => {
    if (selectedDate) {
      loadReports(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    const hours = [];
    for (let h = 0; h <= 22; h += 2) {
      hours.push(h);
    }
    setReportHours(hours);
  }, []);

  useEffect(() => {
    if (selectedHour !== null && selectedDate) {
      checkExistingReport();
    }
  }, [selectedHour, selectedDate]);

  useEffect(() => {
    const availability = {};
    reportHours.forEach((hour) => {
      availability[hour] = isReportAvailable(selectedDate, hour);
    });
    setReportAvailability(availability);
  }, [selectedDate, reportHours]);

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
    const isToday = selectedDate === getToday();
    const existingReport = reports.find((r) => r.hour === hour);
    const isAvailable = isReportAvailable(selectedDate, hour);
    const canCreateSpecific = canCreateSpecificReport(
      selectedDate,
      hour,
      userData?.role,
    );

    if (isToday) {
      if (existingReport) {
        const canEdit = canEditReport(selectedDate, hour, userData?.role);
        if (canEdit) {
          setSelectedHour(hour);
          setIsReportSaved(false);
          return;
        } else {
          toast.info(
            script === "latin"
              ? "Bu hisobotni faqat ko'rish mumkin"
              : "Бу ҳисоботни фақат кўриш мумкин",
          );
          setSelectedHour(hour);
          setIsReportSaved(true);
          return;
        }
      }

      if (!canCreateSpecific) {
        const canCreateToday = canCreateReportForToday(selectedDate);
        if (!canCreateToday) {
          toast.warning(
            script === "latin"
              ? "Hisobot yozish vaqti tugagan (06:00 dan 06:00 gacha)"
              : "Ҳисобот ёзиш вақти тугаган (06:00 дан 06:00 гача)",
          );
        } else {
          const availableTime = getReportAvailableTime(selectedDate, hour);
          const minutesLeft = Math.ceil((availableTime - new Date()) / 60000);
          if (minutesLeft > 0) {
            toast.info(
              script === "latin"
                ? `${formatTime(hour)} uchun hisobot ${minutesLeft} daqiqadan so'ng ochiladi`
                : `${formatTime(hour)} учун ҳисобот ${minutesLeft} дақиқадан сўнг очилади`,
            );
          } else {
            toast.info(translations.notAvailable);
          }
        }
        return;
      }

      setSelectedHour(hour);
      setIsReportSaved(false);
      return;
    }

    if (selectedDate < getToday()) {
      if (existingReport) {
        setSelectedHour(hour);
        setIsReportSaved(true);
      } else {
        toast.info(translations.pastDay);
      }
      return;
    }

    toast.info(translations.futureDay);
  };

  const handleInputChange = (category, id, field, value) => {
    const processedValue = value === "" ? "" : parseFloat(value);
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
      grs: ["flow", "pressureIn", "pressureOut"],
      nodes: ["flow", "pressureIn", "pressureOut"],
      interdistrict: ["flow", "pressureIn", "pressureOut"],
      consumers: ["flow"],
      grp: ["pressureIn", "pressureOut"],
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

  // Проверка, все ли поля заполнены
  const hasAllFieldsFilled = () => {
    const allItems = getAllItems();
    if (allItems.length === 0) return false;

    let allFilled = true;
    allItems.forEach((item) => {
      const itemData = formData[item.category]?.[item.id] || {};
      const fields = getFieldsForCategory(item.category);

      fields.forEach((field) => {
        const value = itemData[field];
        if (value === undefined || value === null || value === "") {
          allFilled = false;
        }
      });
    });

    return allFilled;
  };

  const canEditCurrentReport = () => {
    if (!existingReport) return false;
    return canEditReport(
      existingReport.date,
      existingReport.hour,
      userData?.role,
    );
  };

  // Открытие модального окна подтверждения
  const openConfirmModal = () => {
    setIsConfirmModalOpen(true);
  };

  // Сохранение отчета
  const handleConfirmSave = async () => {
    if (selectedHour === null) {
      toast.warning(
        script === "latin"
          ? "Iltimos, vaqtni tanlang"
          : "Илтимос, вақтни танланг",
      );
      return;
    }

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

    setIsSaving(true);

    try {
      const isToday = selectedDate === getToday();
      const existingReport = reports.find((r) => r.hour === selectedHour);

      if (isToday && !existingReport) {
        const canCreate = canCreateSpecificReport(
          selectedDate,
          selectedHour,
          userData?.role,
        );
        if (!canCreate) {
          toast.warning(
            script === "latin"
              ? "Hisobot yozish vaqti tugagan"
              : "Ҳисобот ёзиш вақти тугаган",
          );
          setIsSaving(false);
          return;
        }
      }

      if (
        existingReport &&
        !canEditReport(selectedDate, selectedHour, userData?.role)
      ) {
        toast.warning(
          script === "latin"
            ? "Bu hisobotni tahrirlash vaqti o'tgan"
            : "Бу ҳисоботни таҳрирлаш вақти ўтган",
        );
        setIsSaving(false);
        return;
      }

      const reportType = getReportTypeByHour(selectedHour);

      const dataWithNames = {};
      const categories = ["grs", "nodes", "interdistrict", "consumers", "grp"];

      categories.forEach((cat) => {
        dataWithNames[cat] = {};
        const categoryData = formData[cat] || {};

        Object.keys(categoryData).forEach((id) => {
          const objectData = assignedObjects[cat]?.find(
            (item) => item.id === id,
          );
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
        setIsConfirmModalOpen(false);
        await loadReports(selectedDate);

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
      console.error("Error saving report:", error);
      toast.error(
        script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Открытие модального окна редактирования
  const handleEditClick = () => {
    if (existingReport) {
      if (!canEditCurrentReport()) {
        toast.warning(translations.editTimeExpired);
        return;
      }
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

  // Проверка, можно ли редактировать
  const canEdit = isReportSaved ? canEditCurrentReport() : true;

  // Проверка, можно ли создавать отчеты для сегодняшнего дня
  const canCreateToday =
    selectedDate === getToday() && canCreateReportForToday(selectedDate);

  return (
    <div className="p-2 sm:p-4 max-w-full mx-auto">
      {/* Заголовок */}
      <div className="mb-3 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
          {translations.title}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
          {translations.subtitle}
        </p>
      </div>

      {/* Выбор даты и времени - увеличенные элементы */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-3 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {translations.selectDate}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="w-full px-3 sm:px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {translations.selectTime}
            </label>
            <div className="grid grid-cols-4 gap-1 sm:gap-1">
              {reportHours.map((hour) => {
                const isActive = selectedHour === hour;
                const hasReport = reports.some((r) => r.hour === hour);
                const isToday = selectedDate === getToday();
                const isAvailable = isReportAvailable(selectedDate, hour);
                const canCreateSpecific = canCreateSpecificReport(
                  selectedDate,
                  hour,
                  userData?.role,
                );
                const canEdit = hasReport
                  ? canEditReport(selectedDate, hour, userData?.role)
                  : false;
                const isViewOnly = hasReport && !canEdit;

                let isSelectable = false;
                let reason = "";
                let bgColor =
                  "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700";
                let textColor = "text-gray-700 dark:text-gray-300";
                let borderColor = "border-transparent";
                let cursorClass = "cursor-pointer";
                let opacity = "opacity-100";
                let indicator = null;

                if (isActive) {
                  bgColor = "bg-blue-500 hover:bg-blue-600";
                  textColor = "text-white";
                  borderColor = "border-blue-500";
                  isSelectable = true;
                } else if (hasReport) {
                  if (canEdit) {
                    bgColor =
                      "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50";
                    textColor = "text-green-700 dark:text-green-300";
                    isSelectable = true;
                    indicator = "edit";
                  } else {
                    bgColor = "bg-gray-100 dark:bg-gray-600";
                    textColor = "text-gray-500 dark:text-gray-400";
                    isSelectable = true;
                    cursorClass = "cursor-pointer";
                    indicator = "view";
                    reason = translations.viewOnly;
                  }
                } else if (isToday && canCreateSpecific) {
                  bgColor =
                    "bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50";
                  textColor = "text-yellow-700 dark:text-yellow-300";
                  isSelectable = true;
                  indicator = "create";
                } else if (isToday && !canCreateSpecific && canCreateToday) {
                  bgColor = "bg-gray-100 dark:bg-gray-600";
                  textColor = "text-gray-400 dark:text-gray-500";
                  isSelectable = false;
                  cursorClass = "cursor-not-allowed";
                  opacity = "opacity-50";
                  const availableTime = getReportAvailableTime(
                    selectedDate,
                    hour,
                  );
                  const minutesLeft = Math.ceil(
                    (availableTime - new Date()) / 60000,
                  );
                  reason =
                    minutesLeft > 0
                      ? `${minutesLeft} ${translations.minutes}`
                      : translations.notAvailable;
                } else if (isToday && !canCreateToday) {
                  bgColor = "bg-gray-100 dark:bg-gray-600";
                  textColor = "text-gray-400 dark:text-gray-500";
                  isSelectable = false;
                  cursorClass = "cursor-not-allowed";
                  opacity = "opacity-50";
                  reason = translations.creationPeriod;
                } else if (selectedDate < getToday()) {
                  if (hasReport) {
                    bgColor = "bg-gray-100 dark:bg-gray-600";
                    textColor = "text-gray-500 dark:text-gray-400";
                    isSelectable = true;
                    reason = translations.pastDay;
                    indicator = "view";
                  } else {
                    bgColor = "bg-gray-100 dark:bg-gray-600";
                    textColor = "text-gray-400 dark:text-gray-500";
                    isSelectable = false;
                    cursorClass = "cursor-not-allowed";
                    opacity = "opacity-50";
                    reason = translations.pastDay;
                  }
                } else {
                  bgColor = "bg-gray-100 dark:bg-gray-600";
                  textColor = "text-gray-400 dark:text-gray-500";
                  isSelectable = false;
                  cursorClass = "cursor-not-allowed";
                  opacity = "opacity-50";
                  reason = translations.futureDay;
                }

                return (
                  <button
                    key={hour}
                    onClick={() => {
                      if (!isSelectable) {
                        if (reason) {
                          toast.info(reason);
                        }
                        return;
                      }
                      handleHourSelect(hour);
                    }}
                    disabled={!isSelectable}
                    className={`p-2 sm:p-1 text-sm sm:text-xs rounded-lg transition-all duration-200 relative border ${borderColor} ${bgColor} ${textColor} ${cursorClass} ${opacity} min-h-[36px] sm:min-h-[28px]`}
                    title={reason || ""}
                  >
                    <span>{formatTime(hour)}</span>

                    {indicator === "edit" && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></span>
                    )}
                    {indicator === "view" && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></span>
                    )}
                    {indicator === "create" && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                    )}
                    {isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    )}

                    {isViewOnly && (
                      <span className="absolute -bottom-2 sm:-bottom-3 left-1/2 transform -translate-x-1/2 text-[6px] sm:text-[6px] text-gray-400 whitespace-nowrap">
                        {translations.viewOnly}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1.5 sm:gap-3 text-xs sm:text-xs">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-500 dark:text-gray-400">
                  {script === "latin" ? "Tahrirlash" : "Таҳрирлаш"}
                </span>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-gray-500 dark:text-gray-400">
                  {script === "latin" ? "Yozish" : "Ёзиш"}
                </span>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-400 rounded-full"></div>
                <span className="text-gray-500 dark:text-gray-400">
                  {script === "latin" ? "Ko'rish" : "Кўриш"}
                </span>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-gray-500 dark:text-gray-400">
                  {script === "latin" ? "Tanlangan" : "Танланган"}
                </span>
              </div>
            </div>
            <div className="mt-1 sm:mt-1 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
              {script === "latin"
                ? "* Hisobot vaqtdan 10 daqiqa oldin ochiladi"
                : "* Ҳисобот вақтдан 10 дақиқа олдин очилади"}
              {selectedDate === getToday() && (
                <span className="ml-1 sm:ml-2 text-yellow-500">
                  {canCreateToday
                    ? script === "latin"
                      ? "✅ Yozish mumkin"
                      : "✅ Ёзиш мумкин"
                    : script === "latin"
                      ? "❌ Yozish vaqti tugagan"
                      : "❌ Ёзиш вақти тугаган"}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {translations.reportType}
            </label>
            <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              {selectedHour !== null ? (
                <>
                  <span
                    className={`px-2 sm:px-2 py-1 sm:py-1 text-xs sm:text-xs rounded-full ${
                      getReportTypeByHour(selectedHour) === "daily"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                        : getReportTypeByHour(selectedHour) === "six_hour"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    }`}
                  >
                    {getReportTypeLabel(selectedHour)}
                  </span>
                  <span className="text-sm sm:text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(selectedHour)}
                  </span>
                  {isReportSaved && (
                    <span className="text-xs sm:text-xs text-green-600 dark:text-green-400 flex items-center gap-0.5 sm:gap-1">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">
                        {script === "latin" ? "Saqlangan" : "Сақланган"}
                      </span>
                    </span>
                  )}
                  {isReportSaved && !canEditCurrentReport() && (
                    <span className="text-xs sm:text-xs text-gray-400 flex items-center gap-0.5 sm:gap-1">
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">
                        {script === "latin" ? "Faqat ko'rish" : "Фақат кўриш"}
                      </span>
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm sm:text-sm text-gray-400">
                  {script === "latin" ? "Vaqt tanlanmagan" : "Вақт танланмаган"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Форма ввода данных - как в модальном окне подтверждения */}
      {selectedHour !== null && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-2 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2">
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-1 sm:gap-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                {isReportSaved ? (
                  <span className="flex items-center gap-1 sm:gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-base">
                      {script === "latin"
                        ? "Hisobot saqlangan"
                        : "Ҳисобот сақланган"}
                    </span>
                  </span>
                ) : isEditing ? (
                  <span className="flex items-center gap-1 sm:gap-2">
                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                    <span className="text-xs sm:text-base">
                      {script === "latin"
                        ? "Hisobotni tahrirlash"
                        : "Ҳисоботни таҳрирлаш"}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs sm:text-base">
                    {translations.enterData}
                  </span>
                )}
                {isReportSaved && !canEditCurrentReport() && (
                  <span className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-0.5 sm:gap-1">
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">
                      {script === "latin" ? "(faqat ko'rish)" : "(фақат кўриш)"}
                    </span>
                  </span>
                )}
              </h2>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <div className="relative w-28 sm:w-48">
                  <Search
                    className="absolute left-2 sm:left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    type="text"
                    placeholder={translations.search}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-7 sm:pl-6 pr-2 sm:pr-2 py-1.5 sm:py-1 text-sm sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div className="flex items-center gap-0.5 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">
                    {formatDateDisplay(selectedDate)}
                  </span>
                  <span className="xs:hidden text-xs">
                    {selectedDate.slice(5)}
                  </span>
                  <span className="mx-0.5 sm:mx-1">|</span>
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{formatTime(selectedHour)}</span>
                </div>
              </div>
            </div>
          </div>

          {loadingObjects ? (
            <div className="flex items-center justify-center py-6 sm:py-12">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-500" />
              <span className="ml-2 sm:ml-3 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {translations.loadingObjects}
              </span>
            </div>
          ) : !hasObjects ? (
            <div className="text-center py-6 sm:py-12">
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
              <h3 className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300">
                {translations.noAssignedItems}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {script === "latin"
                  ? "Sizga biriktirilgan obyektlar mavjud emas"
                  : "Сизга бириктирилган объектлар мавжуд эмас"}
              </p>
            </div>
          ) : (
            <>
              {/* Десктопная таблица */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {translations.category}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                        {translations.object}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                        {translations.flow}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                        {translations.pressureIn}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                        {translations.pressureOut}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredItems.map((item) => {
                      const fields = getFieldsForCategory(item.category);
                      const itemData = formData[item.category]?.[item.id] || {};
                      const isDisabled =
                        isReportSaved && !canEditCurrentReport();

                      return (
                        <tr
                          key={`${item.category}_${item.id}`}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-3 py-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {item.categoryLabel}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {item.displayName || item.name || item.id}
                            </span>
                          </td>
                          <td className="px-3 py-2">
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
                                className={`w-24 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                  isDisabled
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                placeholder="0"
                              />
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {fields.includes("pressureIn") ? (
                              <input
                                type="number"
                                step="0.01"
                                value={
                                  itemData.pressureIn !== undefined &&
                                  itemData.pressureIn !== null
                                    ? itemData.pressureIn
                                    : ""
                                }
                                onChange={(e) =>
                                  handleInputChange(
                                    item.category,
                                    item.id,
                                    "pressureIn",
                                    e.target.value,
                                  )
                                }
                                disabled={isDisabled}
                                className={`w-24 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                  isDisabled
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                placeholder="0"
                              />
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {fields.includes("pressureOut") ? (
                              <input
                                type="number"
                                step="0.01"
                                value={
                                  itemData.pressureOut !== undefined &&
                                  itemData.pressureOut !== null
                                    ? itemData.pressureOut
                                    : ""
                                }
                                onChange={(e) =>
                                  handleInputChange(
                                    item.category,
                                    item.id,
                                    "pressureOut",
                                    e.target.value,
                                  )
                                }
                                disabled={isDisabled}
                                className={`w-24 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                  isDisabled
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                placeholder="0"
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

              {/* Мобильные карточки - как в модальном окне подтверждения */}
              <div className="sm:hidden space-y-3 p-2">
                {filteredItems.map((item, index) => {
                  const fields = getFieldsForCategory(item.category);
                  const itemData = formData[item.category]?.[item.id] || {};
                  const isDisabled = isReportSaved && !canEditCurrentReport();

                  return (
                    <div
                      key={`${item.category}_${item.id}`}
                      className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {item.categoryLabel}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {item.displayName || item.name || item.id}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-white dark:bg-gray-800 rounded p-2 text-center border border-gray-200 dark:border-gray-600">
                          <div className="text-gray-500 dark:text-gray-400 text-[10px]">
                            {translations.flow}
                          </div>
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
                              className={`w-full px-1 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                isDisabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded p-2 text-center border border-gray-200 dark:border-gray-600">
                          <div className="text-gray-500 dark:text-gray-400 text-[10px]">
                            {translations.pressureIn}
                          </div>
                          {fields.includes("pressureIn") ? (
                            <input
                              type="number"
                              step="0.01"
                              value={
                                itemData.pressureIn !== undefined &&
                                itemData.pressureIn !== null
                                  ? itemData.pressureIn
                                  : ""
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  item.category,
                                  item.id,
                                  "pressureIn",
                                  e.target.value,
                                )
                              }
                              disabled={isDisabled}
                              className={`w-full px-1 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                isDisabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded p-2 text-center border border-gray-200 dark:border-gray-600">
                          <div className="text-gray-500 dark:text-gray-400 text-[10px]">
                            {translations.pressureOut}
                          </div>
                          {fields.includes("pressureOut") ? (
                            <input
                              type="number"
                              step="0.01"
                              value={
                                itemData.pressureOut !== undefined &&
                                itemData.pressureOut !== null
                                  ? itemData.pressureOut
                                  : ""
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  item.category,
                                  item.id,
                                  "pressureOut",
                                  e.target.value,
                                )
                              }
                              disabled={isDisabled}
                              className={`w-full px-1 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                isDisabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Суточный отчет - дополнительные поля */}
              {isDailyReport && (
                <div className="p-3 sm:p-4 border-t border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
                  <h3 className="text-sm sm:text-sm font-medium text-purple-800 dark:text-purple-300 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
                    <span className="w-1 h-3 sm:h-4 bg-purple-500 rounded-full"></span>
                    {script === "latin"
                      ? "Kunlik qo'shimcha ma'lumotlar"
                      : "Кунлик қўшимча маълумотлар"}
                  </h3>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    <div>
                      <label className="block text-xs sm:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
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
                        disabled={isReportSaved && !canEditCurrentReport()}
                        className={`w-full px-2 sm:px-3 py-2 sm:py-2 text-sm sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                          isReportSaved && !canEditCurrentReport()
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
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
                        disabled={isReportSaved && !canEditCurrentReport()}
                        className={`w-full px-2 sm:px-3 py-2 sm:py-2 text-sm sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                          isReportSaved && !canEditCurrentReport()
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        placeholder="0"
                      />
                    </div>
                    <div className="xs:col-span-2 sm:col-span-1">
                      <label className="block text-xs sm:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
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
                        disabled={isReportSaved && !canEditCurrentReport()}
                        className={`w-full px-2 sm:px-3 py-2 sm:py-2 text-sm sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                          isReportSaved && !canEditCurrentReport()
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Кнопки */}
              <div className="px-3 py-2 sm:px-4 sm:py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex flex-wrap gap-2 sm:gap-3 justify-end">
                <button
                  onClick={() => {
                    setFormData({});
                    setSelectedHour(null);
                    setIsReportSaved(false);
                  }}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1 sm:gap-2"
                >
                  <X className="w-4 h-4 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">
                    {translations.cancel}
                  </span>
                </button>

                {isReportSaved ? (
                  <button
                    onClick={handleEditClick}
                    disabled={!canEdit}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-sm rounded-lg transition-colors flex items-center gap-1 sm:gap-2 ${
                      canEdit
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Edit className="w-4 h-4 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">
                      {translations.edit}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={openConfirmModal}
                    disabled={loading || !hasAllFieldsFilled()}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-sm rounded-lg transition-colors flex items-center gap-1 sm:gap-2 ${
                      loading || !hasAllFieldsFilled()
                        ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    <Save className="w-4 h-4 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">
                      {isEditing ? translations.edit : translations.save}
                    </span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {selectedHour === null && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center">
          <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300">
            {script === "latin"
              ? "Hisobot vaqtini tanlang"
              : "Ҳисобот вақтини танланг"}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {script === "latin"
              ? "Iltimos, yuqoridagi kalendardan sana va vaqtni tanlang"
              : "Илтимос, юқоридаги календардан сана ва вақтни танланг"}
          </p>
        </div>
      )}

      {/* Модальное окно подтверждения */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmSave}
        data={formData}
        translations={translations}
        loading={isSaving}
        assignedObjects={assignedObjects}
      />

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
