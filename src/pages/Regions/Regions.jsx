import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  Plus,
  X,
  Edit,
  Save,
  Search,
  MapPin,
  Globe,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import useLanguageStore from "../../store/languageStore";
import useAuthStore from "../../store/authStore";
import useLogger from "../../hooks/useLogger";
import { ActionTypes } from "../../services/logger";
import { toast } from "react-toastify";

const Regions = () => {
  const { script } = useLanguageStore();
  const { userData } = useAuthStore();
  const { log } = useLogger();
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
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
    title: script === "latin" ? "Viloyatlar" : "Вилоятлар",
    subtitle:
      script === "latin"
        ? "O'zbekiston Respublikasi viloyatlari"
        : "Ўзбекистон Республикаси вилоятлари",
    addRegion: script === "latin" ? "Viloyat qo'shish" : "Вилоят қўшиш",
    search: script === "latin" ? "Qidirish..." : "Қидириш...",
    searchPlaceholder:
      script === "latin"
        ? "Nomi, kodi yoki poytaxti bo'yicha qidirish"
        : "Номи, коди ёки пойтахти бўйича қидириш",
    region: script === "latin" ? "Viloyat" : "Вилоят",
    code: "Kod",
    capital: script === "latin" ? "Poytaxt" : "Пойтахт",
    population: script === "latin" ? "Aholi" : "Аҳоли",
    area: script === "latin" ? "Maydon" : "Майдон",
    create: script === "latin" ? "Yangi viloyat" : "Янги вилоят",
    edit: script === "latin" ? "Viloyatni tahrirlash" : "Вилоятни таҳрирлаш",
    view: script === "latin" ? "Viloyat ma'lumotlari" : "Вилоят маълумотлари",
    name: script === "latin" ? "Viloyat nomi" : "Вилоят номи",
    codeLabel: script === "latin" ? "Viloyat kodi" : "Вилоят коди",
    capitalLabel: script === "latin" ? "Poytaxt" : "Пойтахт",
    populationLabel: script === "latin" ? "Aholi soni" : "Аҳоли сони",
    areaLabel: script === "latin" ? "Maydoni" : "Майдони",
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
        ? "Ushbu viloyatni o'chirishni xohlaysizmi?"
        : "Ушбу вилоятни ўчиришни хоҳлайсизми?",
    deleteYes: script === "latin" ? "Ha, o'chirish" : "Ҳа, ўчириш",
    deleteNo: script === "latin" ? "Yo'q" : "Йўқ",
    required: script === "latin" ? "Majburiy maydon" : "Мажбурий майдон",
    noRegions:
      script === "latin" ? "Viloyatlar topilmadi" : "Вилоятлар топилмади",
    noRegionsFound:
      script === "latin"
        ? "Hozircha viloyatlar mavjud emas"
        : "Ҳозирча вилоятлар мавжуд эмас",
    startAdding:
      script === "latin"
        ? "Birinchi viloyatni qo'shish"
        : "Биринчи вилоятни қўшиш",
    notSpecified: script === "latin" ? "Ko'rsatilmagan" : "Кўрсатилмаган",
    total: script === "latin" ? "Jami" : "Жами",
    regionsCount: script === "latin" ? "ta viloyat" : "та вилоят",
    noPermission:
      script === "latin"
        ? "Faqat administratorlar viloyat qo'shishi mumkin"
        : "Фақат администраторлар вилоят қўшиши мумкин",
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const regionsSnapshot = await getDocs(collection(db, "regions"));
      const regionsData = regionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRegions(regionsData);
    } catch (error) {
      console.error("Error loading regions:", error);
      toast.error(
        script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
      );
    } finally {
      setLoading(false);
    }
  };

  const [newRegion, setNewRegion] = useState({
    name: "",
    code: "",
    population: "",
    area: "",
    capital: "",
  });

  const checkFormValidity = () => {
    const currentData = isCreating ? newRegion : selectedRegion;
    if (!currentData) return false;
    return currentData.name?.trim() && currentData.code?.trim();
  };

  const handleInputChange = (field, value) => {
    if (isCreating) {
      setNewRegion((prev) => ({ ...prev, [field]: value }));
    } else {
      setSelectedRegion((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleRegionClick = (region) => {
    setSelectedRegion({ ...region });
    setIsModalOpen(true);
    setIsEditMode(false);
  };

  const handleCreateRegion = () => {
    if (!isAdmin) {
      toast.warning(translations.noPermission);
      return;
    }
    setIsCreating(true);
    setIsModalOpen(true);
    setNewRegion({
      name: "",
      code: "",
      population: "",
      area: "",
      capital: "",
    });
    setIsSaving(false);
    log(ActionTypes.REGION_CREATE, { action: "open_form" });
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setIsEditMode(false);
    setIsCreating(false);
    setSelectedRegion(null);
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
      const originalRegion = regions.find(
        (region) => region.id === selectedRegion?.id,
      );
      setSelectedRegion(originalRegion ? { ...originalRegion } : null);
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
        await addDoc(collection(db, "regions"), {
          ...newRegion,
          country: "O'zbekiston",
          createdAt: new Date(),
        });
        await log(ActionTypes.REGION_CREATE, {
          regionName: newRegion.name,
          regionCode: newRegion.code,
        });
        toast.success(
          script === "latin" ? "Viloyat qo'shildi" : "Вилоят қўшилди",
        );
      } else {
        await updateDoc(doc(db, "regions", selectedRegion.id), {
          ...selectedRegion,
          updatedAt: new Date(),
        });
        await log(ActionTypes.REGION_UPDATE, {
          regionId: selectedRegion.id,
          regionName: selectedRegion.name,
        });
        toast.success(
          script === "latin" ? "Viloyat yangilandi" : "Вилоят янгиланди",
        );
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving region:", error);
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
      const regionToDelete = selectedRegion;
      await deleteDoc(doc(db, "regions", selectedRegion.id));
      await log(ActionTypes.REGION_DELETE, {
        regionId: regionToDelete.id,
        regionName: regionToDelete.name,
      });
      toast.success(
        script === "latin" ? "Viloyat o'chirildi" : "Вилоят ўчирилди",
      );
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Error deleting region:", error);
      toast.error(
        script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
      );
      setIsSaving(false);
    }
  };

  const filteredRegions = regions.filter(
    (region) =>
      region.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      region.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      region.capital?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
      {/* Заголовок и кнопка */}
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
            onClick={handleCreateRegion}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium shadow-sm hover:shadow"
          >
            <Plus size={18} />
            {translations.addRegion}
          </button>
        )}
      </div>

      {/* Поиск */}
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

      {/* Информация о количестве */}
      <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {translations.total}: {filteredRegions.length}{" "}
        {translations.regionsCount}
      </div>

      {/* Таблица */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.region}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.code}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  {translations.capital}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  {translations.population}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">
                  {translations.area}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRegions.map((region) => (
                <tr
                  key={region.id}
                  onClick={() => handleRegionClick(region)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-150"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {region.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                        {region.code}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                    {region.capital || translations.notSpecified}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                    {region.population || translations.notSpecified}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden xl:table-cell">
                    {region.area
                      ? `${region.area} км²`
                      : translations.notSpecified}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRegions.length === 0 && (
          <div className="text-center py-12">
            <MapPin
              className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
              size={48}
            />
            <h3 className="text-base font-medium text-gray-600 dark:text-gray-400 mb-1">
              {searchTerm
                ? translations.noRegions
                : translations.noRegionsFound}
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {searchTerm
                ? translations.searchPlaceholder
                : translations.startAdding}
            </p>
            {!searchTerm && isAdmin && (
              <button
                onClick={handleCreateRegion}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                {translations.addRegion}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Модальное окно */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={isSaving ? undefined : handleCloseModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
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

            {/* Содержимое */}
            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.name} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={
                      isCreating ? newRegion.name : selectedRegion?.name || ""
                    }
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={(!isCreating && !isEditMode) || isSaving}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    placeholder={translations.name}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.codeLabel}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={
                      isCreating ? newRegion.code : selectedRegion?.code || ""
                    }
                    onChange={(e) => handleInputChange("code", e.target.value)}
                    disabled={(!isCreating && !isEditMode) || isSaving}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    placeholder="TAS"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.capitalLabel}
                  </label>
                  <input
                    type="text"
                    value={
                      isCreating
                        ? newRegion.capital
                        : selectedRegion?.capital || ""
                    }
                    onChange={(e) =>
                      handleInputChange("capital", e.target.value)
                    }
                    disabled={(!isCreating && !isEditMode) || isSaving}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    placeholder={translations.capitalLabel}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {translations.populationLabel}
                    </label>
                    <input
                      type="text"
                      value={
                        isCreating
                          ? newRegion.population
                          : selectedRegion?.population || ""
                      }
                      onChange={(e) =>
                        handleInputChange("population", e.target.value)
                      }
                      disabled={(!isCreating && !isEditMode) || isSaving}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="3.5 млн"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {translations.areaLabel}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={
                          isCreating
                            ? newRegion.area
                            : selectedRegion?.area || ""
                        }
                        onChange={(e) =>
                          handleInputChange("area", e.target.value)
                        }
                        disabled={(!isCreating && !isEditMode) || isSaving}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm pr-12 ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                        км²
                      </span>
                    </div>
                  </div>
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

            {/* Кнопки */}
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

      {/* Подтверждение удаления */}
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

export default Regions;
