import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where,
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
  Calendar,
  Zap,
  Factory,
  Hash,
} from "lucide-react";
import useLanguageStore from "../../store/languageStore";
import useAuthStore from "../../store/authStore";
import useLogger from "../../hooks/useLogger";
import { ActionTypes } from "../../services/logger";
import { toast } from "react-toastify";

const Grs = () => {
  const { script } = useLanguageStore();
  const { userData } = useAuthStore();
  const { log } = useLogger();
  const [grsList, setGrsList] = useState([]);
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [selectedGrs, setSelectedGrs] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = userData?.role === "admin" || userData?.role === "Админ";

  const translations = {
    title: script === "latin" ? "GTS (GRS)" : "ГТШ (ГРС)",
    subtitle:
      script === "latin"
        ? "Gaz taqsimlash shoxobchalari"
        : "Газ тақсимлаш шахобчалари",
    addGrs: script === "latin" ? "GTS qo'shish" : "ГТШ қўшиш",
    search: script === "latin" ? "Qidirish..." : "Қидириш...",
    searchPlaceholder:
      script === "latin"
        ? "Nomi yoki joylashgan joyi bo'yicha qidirish"
        : "Номи ёки жойлашган жойи бўйича қидириш",
    name: script === "latin" ? "Nomi" : "Номи",
    number: script === "latin" ? "№" : "№",
    location: script === "latin" ? "Joylashgan joyi" : "Жойлашган жойи",
    year: script === "latin" ? "Ishga tushirilgan yil" : "Ишга туширилган йил",
    capacity: script === "latin" ? "Quvvati (m³/soat)" : "Қуввати (м³/соат)",
    create: script === "latin" ? "Yangi GTS" : "Янги ГТШ",
    edit: script === "latin" ? "GTS tahrirlash" : "ГТШ таҳрирлаш",
    view: script === "latin" ? "GTS ma'lumotlari" : "ГТШ маълумотлари",
    nameLabel: script === "latin" ? "GTS nomi" : "ГТШ номи",
    numberLabel: script === "latin" ? "Tartib raqami" : "Тартиб рақами",
    regionLabel: script === "latin" ? "Viloyat" : "Вилоят",
    locationLabel: script === "latin" ? "Tuman/shahar" : "Туман/шаҳар",
    yearLabel:
      script === "latin" ? "Ishga tushirilgan yil" : "Ишга туширилган йил",
    capacityLabel:
      script === "latin" ? "Quvvati (m³/soat)" : "Қуввати (м³/соат)",
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
        ? "Ushbu GTS o'chirishni xohlaysizmi?"
        : "Ушбу ГТШ ўчиришни хоҳлайсизми?",
    deleteYes: script === "latin" ? "Ha, o'chirish" : "Ҳа, ўчириш",
    deleteNo: script === "latin" ? "Yo'q" : "Йўқ",
    required: script === "latin" ? "Majburiy maydon" : "Мажбурий майдон",
    selectRegion: script === "latin" ? "Viloyatni tanlang" : "Вилоятни танланг",
    selectCity:
      script === "latin" ? "Tuman/shaharni tanlang" : "Туман/шаҳарни танланг",
    noData: script === "latin" ? "GTS topilmadi" : "ГТШ топилмади",
    noDataFound:
      script === "latin"
        ? "Hozircha GTS mavjud emas"
        : "Ҳозирча ГТШ мавжуд эмас",
    startAdding:
      script === "latin" ? "Birinchi GTS qo'shish" : "Биринчи ГТШ қўшиш",
    notSpecified: script === "latin" ? "Ko'rsatilmagan" : "Кўрсатилмаган",
    total: script === "latin" ? "Jami" : "Жами",
    totalCount: script === "latin" ? "ta GTS" : "та ГТШ",
    noPermission:
      script === "latin"
        ? "Faqat administratorlar GTS qo'shishi mumkin"
        : "Фақат администраторлар ГТШ қўшиши мумкин",
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Загружаем ГРС с сортировкой по order
      const grsQuery = query(collection(db, "grs"), orderBy("order", "asc"));
      const grsSnapshot = await getDocs(grsQuery);
      const grsData = grsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGrsList(grsData);

      const citiesSnapshot = await getDocs(collection(db, "cities"));
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

      setFilteredCities(citiesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(
        script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
      );
    } finally {
      setLoading(false);
    }
  };

  const [newGrs, setNewGrs] = useState({
    name: "",
    order: 0,
    regionId: "",
    regionName: "",
    locationId: "",
    locationName: "",
    year: "",
    capacity: "",
  });

  const checkFormValidity = () => {
    const currentData = isCreating ? newGrs : selectedGrs;
    if (!currentData) return false;
    return currentData.name?.trim() && currentData.locationId?.trim();
  };

  const handleInputChange = (field, value) => {
    if (isCreating) {
      setNewGrs((prev) => ({ ...prev, [field]: value }));
    } else {
      setSelectedGrs((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleRegionChange = (regionId) => {
    const selectedRegion = regions.find((region) => region.id === regionId);
    if (selectedRegion) {
      const citiesInRegion = cities.filter(
        (city) => city.regionId === regionId,
      );
      setFilteredCities(citiesInRegion);

      if (isCreating) {
        setNewGrs((prev) => ({
          ...prev,
          regionId: selectedRegion.id,
          regionName: selectedRegion.name,
          locationId: "",
          locationName: "",
        }));
      } else {
        setSelectedGrs((prev) => ({
          ...prev,
          regionId: selectedRegion.id,
          regionName: selectedRegion.name,
          locationId: "",
          locationName: "",
        }));
      }
    }
  };

  const handleLocationChange = (locationId) => {
    const selectedCity = filteredCities.find((city) => city.id === locationId);
    if (selectedCity) {
      const typeName =
        selectedCity.type === "shahar"
          ? script === "latin"
            ? "shahar"
            : "шаҳар"
          : script === "latin"
            ? "tuman"
            : "туман";
      const locationName = `${selectedCity.name} ${typeName}`;

      if (isCreating) {
        setNewGrs((prev) => ({
          ...prev,
          locationId: selectedCity.id,
          locationName: locationName,
        }));
      } else {
        setSelectedGrs((prev) => ({
          ...prev,
          locationId: selectedCity.id,
          locationName: locationName,
        }));
      }
    }
  };

  const handleGrsClick = (grs) => {
    setSelectedGrs({ ...grs });
    if (grs.regionId) {
      const citiesInRegion = cities.filter(
        (city) => city.regionId === grs.regionId,
      );
      setFilteredCities(citiesInRegion);
    } else {
      setFilteredCities(cities);
    }
    setIsModalOpen(true);
    setIsEditMode(false);
  };

  const handleCreateGrs = () => {
    if (!isAdmin) {
      toast.warning(translations.noPermission);
      return;
    }
    setIsCreating(true);
    setIsModalOpen(true);

    // Вычисляем следующий порядковый номер
    const nextOrder =
      grsList.length > 0
        ? Math.max(...grsList.map((g) => g.order || 0)) + 1
        : 1;

    setNewGrs({
      name: "",
      order: nextOrder,
      regionId: "",
      regionName: "",
      locationId: "",
      locationName: "",
      year: "",
      capacity: "",
    });
    setFilteredCities(cities);
    setIsSaving(false);
    log(ActionTypes.GRS_CREATE, { action: "open_form" });
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setIsEditMode(false);
    setIsCreating(false);
    setSelectedGrs(null);
    setIsDeleteConfirmOpen(false);
    setIsSaving(false);
    setFilteredCities(cities);
  };

  const handleEdit = () => {
    if (!isAdmin) {
      toast.warning(translations.noPermission);
      return;
    }
    setIsEditMode(true);
    setIsSaving(false);
    if (selectedGrs?.regionId) {
      const citiesInRegion = cities.filter(
        (city) => city.regionId === selectedGrs.regionId,
      );
      setFilteredCities(citiesInRegion);
    }
  };

  const handleCancel = () => {
    if (isSaving) return;
    if (isCreating) {
      handleCloseModal();
    } else {
      setIsEditMode(false);
      const originalGrs = grsList.find((grs) => grs.id === selectedGrs?.id);
      setSelectedGrs(originalGrs ? { ...originalGrs } : null);
      if (originalGrs?.regionId) {
        const citiesInRegion = cities.filter(
          (city) => city.regionId === originalGrs.regionId,
        );
        setFilteredCities(citiesInRegion);
      }
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
        await addDoc(collection(db, "grs"), {
          ...newGrs,
          createdAt: new Date(),
        });
        await log(ActionTypes.GRS_CREATE, {
          grsName: newGrs.name,
          order: newGrs.order,
          locationName: newGrs.locationName,
          capacity: newGrs.capacity,
        });
        toast.success(script === "latin" ? "GTS qo'shildi" : "ГТШ қўшилди");
      } else {
        await updateDoc(doc(db, "grs", selectedGrs.id), {
          ...selectedGrs,
          updatedAt: new Date(),
        });
        await log(ActionTypes.GRS_UPDATE, {
          grsId: selectedGrs.id,
          grsName: selectedGrs.name,
          order: selectedGrs.order,
        });
        toast.success(script === "latin" ? "GTS yangilandi" : "ГТШ янгиланди");
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving GRS:", error);
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
      const grsToDelete = selectedGrs;
      await deleteDoc(doc(db, "grs", selectedGrs.id));
      await log(ActionTypes.GRS_DELETE, {
        grsId: grsToDelete.id,
        grsName: grsToDelete.name,
        order: grsToDelete.order,
      });
      toast.success(script === "latin" ? "GTS o'chirildi" : "ГТШ ўчирилди");
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Error deleting GRS:", error);
      toast.error(
        script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
      );
      setIsSaving(false);
    }
  };

  const filteredGrs = grsList.filter(
    (grs) =>
      grs.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grs.locationName?.toLowerCase().includes(searchTerm.toLowerCase()),
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
            onClick={handleCreateGrs}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium shadow-sm hover:shadow"
          >
            <Plus size={18} />
            {translations.addGrs}
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
        {translations.total}: {filteredGrs.length} {translations.totalCount}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.number}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.name}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  {translations.location}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  {translations.year}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">
                  {translations.capacity}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredGrs.map((grs) => (
                <tr
                  key={grs.id}
                  onClick={() => handleGrsClick(grs)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-150"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Hash className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {grs.order || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Factory className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {grs.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>
                        {grs.locationName || translations.notSpecified}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{grs.year || translations.notSpecified}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden xl:table-cell">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-gray-400" />
                      <span>
                        {grs.capacity
                          ? `${grs.capacity} м³/соат`
                          : translations.notSpecified}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredGrs.length === 0 && (
          <div className="text-center py-12">
            <Factory
              className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
              size={48}
            />
            <h3 className="text-base font-medium text-gray-600 dark:text-gray-400 mb-1">
              {searchTerm ? translations.noData : translations.noDataFound}
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {searchTerm
                ? translations.searchPlaceholder
                : translations.startAdding}
            </p>
            {!searchTerm && isAdmin && (
              <button
                onClick={handleCreateGrs}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                {translations.addGrs}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {translations.numberLabel}
                    </label>
                    <input
                      type="text"
                      value={
                        isCreating ? newGrs.order : selectedGrs?.order || ""
                      }
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {translations.nameLabel}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={isCreating ? newGrs.name : selectedGrs?.name || ""}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      disabled={(!isCreating && !isEditMode) || isSaving}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder={translations.nameLabel}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.regionLabel}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={
                      isCreating ? newGrs.regionId : selectedGrs?.regionId || ""
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.locationLabel}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={
                      isCreating
                        ? newGrs.locationId
                        : selectedGrs?.locationId || ""
                    }
                    onChange={(e) => handleLocationChange(e.target.value)}
                    disabled={
                      (!isCreating && !isEditMode) ||
                      isSaving ||
                      (!isCreating && !isEditMode && !selectedGrs?.regionId) ||
                      (isCreating && !newGrs.regionId)
                    }
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">{translations.selectCity}</option>
                    {filteredCities.map((city) => {
                      const typeName =
                        city.type === "shahar"
                          ? script === "latin"
                            ? "shahar"
                            : "шаҳар"
                          : script === "latin"
                            ? "tuman"
                            : "туман";
                      const displayName = `${city.name} ${typeName}`;
                      return (
                        <option key={city.id} value={city.id}>
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                  {!isCreating && !isEditMode && !selectedGrs?.regionId && (
                    <p className="text-xs text-orange-500 mt-1">
                      {script === "latin"
                        ? "Iltimos, avval viloyatni tanlang"
                        : "Илтимос, аввал вилоятни танланг"}
                    </p>
                  )}
                  {isCreating && !newGrs.regionId && (
                    <p className="text-xs text-orange-500 mt-1">
                      {script === "latin"
                        ? "Iltimos, avval viloyatni tanlang"
                        : "Илтимос, аввал вилоятни танланг"}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {translations.yearLabel}
                    </label>
                    <input
                      type="number"
                      value={isCreating ? newGrs.year : selectedGrs?.year || ""}
                      onChange={(e) =>
                        handleInputChange("year", e.target.value)
                      }
                      disabled={(!isCreating && !isEditMode) || isSaving}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="Masalan: 2020"
                      min="1900"
                      max="2100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {translations.capacityLabel}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={
                          isCreating
                            ? newGrs.capacity
                            : selectedGrs?.capacity || ""
                        }
                        onChange={(e) =>
                          handleInputChange("capacity", e.target.value)
                        }
                        disabled={(!isCreating && !isEditMode) || isSaving}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm pr-16 ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                        м³/соат
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

export default Grs;
