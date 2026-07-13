import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  Plus,
  X,
  Edit,
  Save,
  Search,
  MapPin,
  Building,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import useLanguageStore from "../../store/languageStore";
import useAuthStore from "../../store/authStore";
import useLogger from "../../hooks/useLogger";
import { ActionTypes } from "../../services/logger";
import { toast } from "react-toastify";

const Cities = () => {
  const { script } = useLanguageStore();
  const { userData } = useAuthStore();
  const { log } = useLogger();
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Проверка, является ли пользователь админом
  const isAdmin = userData?.role === "admin" || userData?.role === "Админ";

  const translations = {
    title: script === "latin" ? "Shahar va tumanlar" : "Шаҳар ва туманлар",
    subtitle:
      script === "latin"
        ? "O'zbekiston shaharlari va tumanlari"
        : "Ўзбекистон шаҳарлари ва туманлари",
    addCity: script === "latin" ? "Shahar/tuman qo'shish" : "Шаҳар/туман қўшиш",
    search: script === "latin" ? "Qidirish..." : "Қидириш...",
    searchPlaceholder:
      script === "latin"
        ? "Nomi yoki viloyati bo'yicha qidirish"
        : "Номи ёки вилояти бўйича қидириш",
    city: script === "latin" ? "Shahar/tuman" : "Шаҳар/туман",
    type: script === "latin" ? "Turi" : "Тури",
    region: script === "latin" ? "Viloyat" : "Вилоят",
    create: script === "latin" ? "Yangi shahar/tuman" : "Янги шаҳар/туман",
    edit:
      script === "latin" ? "Shahar/tuman tahrirlash" : "Шаҳар/туман таҳрирлаш",
    view:
      script === "latin"
        ? "Shahar/tuman ma'lumotlari"
        : "Шаҳар/туман маълумотлари",
    name: script === "latin" ? "Shahar/tuman nomi" : "Шаҳар/туман номи",
    typeLabel: script === "latin" ? "Tur" : "Тур",
    regionLabel: script === "latin" ? "Viloyat" : "Вилоят",
    cancel: script === "latin" ? "Bekor qilish" : "Бекор қилиш",
    save: script === "latin" ? "Saqlash" : "Сақлаш",
    saving: script === "latin" ? "Saqlanmoqda..." : "Сақланмоқда...",
    close: script === "latin" ? "Yopish" : "Ёпиш",
    editBtn: script === "latin" ? "Tahrirlash" : "Таҳрирлаш",
    deleteBtn: script === "latin" ? "O'chirish" : "Ўчириш",
    deleteConfirm:
      script === "latin" ? "O'chirishni tasdiqlang" : "Ўчиришни тасдиқланг",
    deleteWarning:
      script === "latin"
        ? "Ushbu shahar/tuman o'chirishni xohlaysizmi?"
        : "Ушбу шаҳар/туман ўчиришни хоҳлайсизми?",
    deleteYes: script === "latin" ? "Ha, o'chirish" : "Ҳа, ўчириш",
    deleteNo: script === "latin" ? "Yo'q" : "Йўқ",
    required: script === "latin" ? "Majburiy maydon" : "Мажбурий майдон",
    selectRegion: script === "latin" ? "Viloyatni tanlang" : "Вилоятни танланг",
    noCities:
      script === "latin" ? "Shahar/tuman topilmadi" : "Шаҳар/туман топилмади",
    noCitiesFound:
      script === "latin"
        ? "Hozircha shahar/tuman mavjud emas"
        : "Ҳозирча шаҳар/туман мавжуд эмас",
    startAdding:
      script === "latin"
        ? "Birinchi shahar/tuman qo'shish"
        : "Биринчи шаҳар/туман қўшиш",
    notSpecified: script === "latin" ? "Ko'rsatilmagan" : "Кўрсатилмаган",
    total: script === "latin" ? "Jami" : "Жами",
    citiesCount: script === "latin" ? "ta shahar/tuman" : "та шаҳар/туман",
    cityLabel: script === "latin" ? "Shahar" : "Шаҳар",
    district: script === "latin" ? "Tuman" : "Туман",
    noPermission:
      script === "latin"
        ? "Faqat administratorlar shahar/tuman qo'shishi mumkin"
        : "Фақат администраторлар шаҳар/туман қўшиши мумкин",
    // Типы на узбекском
    typeCity: script === "latin" ? "Shahar" : "Шаҳар",
    typeDistrict: script === "latin" ? "Tuman" : "Туман",
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Загружаем города с сортировкой по порядковому номеру
      const citiesQuery = query(
        collection(db, "cities"),
        orderBy("order", "asc"),
      );
      const citiesSnapshot = await getDocs(citiesQuery);
      const citiesData = citiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCities(citiesData);

      const regionsSnapshot = await getDocs(collection(db, "regions"));
      const regionsData = regionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRegions(regionsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(
        script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
      );
    } finally {
      setLoading(false);
    }
  };

  const [newCity, setNewCity] = useState({
    name: "",
    regionId: "",
    regionName: "",
    type: "shahar",
    order: 0, // Порядковый номер
  });

  const checkFormValidity = () => {
    const currentData = isCreating ? newCity : selectedCity;
    if (!currentData) return false;
    return currentData.name?.trim() && currentData.regionId?.trim();
  };

  const handleInputChange = (field, value) => {
    if (isCreating) {
      setNewCity((prev) => ({ ...prev, [field]: value }));
    } else {
      setSelectedCity((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleRegionChange = (regionId) => {
    const selectedRegion = regions.find((region) => region.id === regionId);
    if (selectedRegion) {
      if (isCreating) {
        setNewCity((prev) => ({
          ...prev,
          regionId: selectedRegion.id,
          regionName: selectedRegion.name,
        }));
      } else {
        setSelectedCity((prev) => ({
          ...prev,
          regionId: selectedRegion.id,
          regionName: selectedRegion.name,
        }));
      }
    }
  };

  const handleCityClick = (city) => {
    setSelectedCity({ ...city });
    setIsModalOpen(true);
    setIsEditMode(false);
  };

  const handleCreateCity = () => {
    if (!isAdmin) {
      toast.warning(translations.noPermission);
      return;
    }
    setIsCreating(true);
    setIsModalOpen(true);

    // Определяем следующий порядковый номер
    const nextOrder =
      cities.length > 0 ? Math.max(...cities.map((c) => c.order || 0)) + 1 : 1;

    setNewCity({
      name: "",
      regionId: "",
      regionName: "",
      type: "shahar",
      order: nextOrder,
    });
    setIsSaving(false);
    log(ActionTypes.CITY_CREATE, { action: "open_form" });
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setIsEditMode(false);
    setIsCreating(false);
    setSelectedCity(null);
    setIsDeleteConfirmOpen(false);
    setIsSaving(false);
  };

  const handleEdit = () => {
    if (!isAdmin) {
      toast.warning(translations.noPermission);
      return;
    }
    setIsEditMode(true);
    setIsSaving(false);
  };

  const handleCancel = () => {
    if (isSaving) return;
    if (isCreating) {
      handleCloseModal();
    } else {
      setIsEditMode(false);
      const originalCity = cities.find((city) => city.id === selectedCity?.id);
      setSelectedCity(originalCity ? { ...originalCity } : null);
    }
  };

  const handleSave = async () => {
    if (!checkFormValidity()) {
      toast.warning(translations.required);
      return;
    }

    setIsSaving(true);

    try {
      if (isCreating) {
        await addDoc(collection(db, "cities"), {
          ...newCity,
          createdAt: new Date(),
        });
        await log(ActionTypes.CITY_CREATE, {
          cityName: newCity.name,
          regionName: newCity.regionName,
          cityType: newCity.type,
        });
        toast.success(
          script === "latin" ? "Shahar/tuman qo'shildi" : "Шаҳар/туман қўшилди",
        );
      } else {
        await updateDoc(doc(db, "cities", selectedCity.id), {
          ...selectedCity,
          updatedAt: new Date(),
        });
        await log(ActionTypes.CITY_UPDATE, {
          cityId: selectedCity.id,
          cityName: selectedCity.name,
        });
        toast.success(
          script === "latin"
            ? "Shahar/tuman yangilandi"
            : "Шаҳар/туман янгиланди",
        );
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving city:", error);
      toast.error(
        script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
      );
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      toast.warning(translations.noPermission);
      return;
    }
    setIsSaving(true);
    try {
      const cityToDelete = selectedCity;
      await deleteDoc(doc(db, "cities", selectedCity.id));
      await log(ActionTypes.CITY_DELETE, {
        cityId: cityToDelete.id,
        cityName: cityToDelete.name,
      });
      toast.success(
        script === "latin" ? "Shahar/tuman o'chirildi" : "Шаҳар/туман ўчирилди",
      );
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Error deleting city:", error);
      toast.error(
        script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
      );
      setIsSaving(false);
    }
  };

  // Функция для получения отображаемого названия типа
  const getTypeLabel = (type) => {
    if (!type) return translations.notSpecified;

    const typeMap = {
      shahar: translations.typeCity,
      tuman: translations.typeDistrict,
      // Для обратной совместимости со старыми данными
      Город: translations.typeCity,
      Район: translations.typeDistrict,
    };
    return typeMap[type] || type;
  };

  // Функция для получения цвета типа
  const getTypeColor = (type) => {
    const colors = {
      shahar:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      tuman:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      // Для обратной совместимости со старыми типами
      Город: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      Район:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    };
    return (
      colors[type] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    );
  };

  // Группировка городов по регионам с сохранением порядка
  const getGroupedCities = () => {
    const grouped = {};
    const filtered = cities.filter(
      (city) =>
        city.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.regionName?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    filtered.forEach((city) => {
      const regionKey = city.regionId || "other";
      if (!grouped[regionKey]) {
        grouped[regionKey] = {
          regionName: city.regionName || translations.notSpecified,
          cities: [],
        };
      }
      grouped[regionKey].cities.push(city);
    });

    // Сортируем города внутри каждого региона по order
    Object.keys(grouped).forEach((key) => {
      grouped[key].cities.sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    return grouped;
  };

  const groupedCities = getGroupedCities();

  const isFormValid = checkFormValidity();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {translations.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {translations.subtitle}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleCreateCity}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium shadow-sm hover:shadow"
          >
            <Plus size={18} />
            {translations.addCity}
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder={translations.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
          />
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {translations.total}: {cities.length} {translations.citiesCount}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  №
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.city}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.type}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  {translations.region}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.keys(groupedCities).map((regionKey) => {
                const group = groupedCities[regionKey];
                return (
                  <React.Fragment key={regionKey}>
                    {/* Заголовок региона */}
                    <tr className="bg-gray-100 dark:bg-gray-700/30">
                      <td
                        colSpan="4"
                        className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >
                        {group.regionName}
                      </td>
                    </tr>
                    {/* Города региона */}
                    {group.cities.map((city, index) => (
                      <tr
                        key={city.id}
                        onClick={() => handleCityClick(city)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-150"
                      >
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {city.order || index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                              {city.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(city.type)}`}
                          >
                            {getTypeLabel(city.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>
                              {city.regionName || translations.notSpecified}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {cities.length === 0 && (
          <div className="text-center py-12">
            <Building
              className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
              size={48}
            />
            <h3 className="text-base font-medium text-gray-600 dark:text-gray-400 mb-1">
              {searchTerm ? translations.noCities : translations.noCitiesFound}
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {searchTerm
                ? translations.searchPlaceholder
                : translations.startAdding}
            </p>
            {!searchTerm && isAdmin && (
              <button
                onClick={handleCreateCity}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                {translations.addCity}
              </button>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={isSaving ? undefined : handleCloseModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isCreating
                  ? translations.create
                  : isEditMode
                    ? translations.edit
                    : translations.view}
              </h2>
              <button
                onClick={handleCloseModal}
                disabled={isSaving}
                className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.name} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={isCreating ? newCity.name : selectedCity?.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={(!isCreating && !isEditMode) || isSaving}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    placeholder={translations.name}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.typeLabel}
                  </label>
                  <select
                    value={
                      isCreating ? newCity.type : selectedCity?.type || "shahar"
                    }
                    onChange={(e) => handleInputChange("type", e.target.value)}
                    disabled={(!isCreating && !isEditMode) || isSaving}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="shahar">{translations.typeCity}</option>
                    <option value="tuman">{translations.typeDistrict}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.regionLabel}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={
                      isCreating
                        ? newCity.regionId
                        : selectedCity?.regionId || ""
                    }
                    onChange={(e) => handleRegionChange(e.target.value)}
                    disabled={(!isCreating && !isEditMode) || isSaving}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">{translations.selectRegion}</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>

                {(isCreating || isEditMode) && (
                  <div
                    className={`flex items-center gap-2 text-sm ${isFormValid ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`}
                  >
                    {isFormValid ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>{translations.required}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span>{translations.required}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex flex-wrap gap-2 justify-end">
                {!isCreating && !isEditMode && (
                  <>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => setIsDeleteConfirmOpen(true)}
                          disabled={isSaving}
                          className={`px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <Trash2 className="w-4 h-4" />
                          {translations.deleteBtn}
                        </button>
                        <button
                          onClick={handleEdit}
                          disabled={isSaving}
                          className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <Edit className="w-4 h-4" />
                          {translations.editBtn}
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleCloseModal}
                      disabled={isSaving}
                      className={`px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {translations.close}
                    </button>
                  </>
                )}

                {(isCreating || isEditMode) && (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className={`px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {translations.cancel}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!isFormValid || isSaving}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                        isFormValid && !isSaving
                          ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                          : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {translations.saving}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {translations.save}
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]"
          onClick={() => setIsDeleteConfirmOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {translations.deleteConfirm}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {translations.deleteWarning}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isSaving}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {translations.deleteNo}
              </button>
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                    {translations.saving}
                  </>
                ) : (
                  translations.deleteYes
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cities;
