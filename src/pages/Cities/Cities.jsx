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
  Building,
  Trash2,
  AlertCircle,
  CheckCircle,
  Users,
  Navigation,
} from "lucide-react";
import useLanguageStore from "../../store/languageStore";
import { toast } from "react-toastify";

const Cities = () => {
  const { script } = useLanguageStore();
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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
        ? "Nomi, viloyati yoki turi bo'yicha qidirish"
        : "Номи, вилояти ёки тури бўйича қидириш",
    city: script === "latin" ? "Shahar/tuman" : "Шаҳар/туман",
    type: script === "latin" ? "Turi" : "Тури",
    region: script === "latin" ? "Viloyat" : "Вилоят",
    population: script === "latin" ? "Aholi" : "Аҳоли",
    area: script === "latin" ? "Maydon" : "Майдон",
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
    populationLabel: script === "latin" ? "Aholi soni" : "Аҳоли сони",
    areaLabel: script === "latin" ? "Maydoni" : "Майдони",
    cancel: script === "latin" ? "Bekor qilish" : "Бекор қилиш",
    save: script === "latin" ? "Saqlash" : "Сақлаш",
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
    village: script === "latin" ? "Qishloq" : "Қишлоқ",
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
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
    type: "Город",
    population: "",
    area: "",
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
    setIsCreating(true);
    setIsModalOpen(true);
    setNewCity({
      name: "",
      regionId: "",
      regionName: "",
      type: "Город",
      population: "",
      area: "",
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setIsCreating(false);
    setSelectedCity(null);
    setIsDeleteConfirmOpen(false);
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
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

    try {
      if (isCreating) {
        await addDoc(collection(db, "cities"), {
          ...newCity,
          createdAt: new Date(),
        });
        toast.success(
          script === "latin" ? "Shahar/tuman qo'shildi" : "Шаҳар/туман қўшилди",
        );
      } else {
        await updateDoc(doc(db, "cities", selectedCity.id), {
          ...selectedCity,
          updatedAt: new Date(),
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
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "cities", selectedCity.id));
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
    }
  };

  const filteredCities = cities.filter(
    (city) =>
      city.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.regionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.type?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getTypeLabel = (type) => {
    const types = {
      Город: translations.cityLabel,
      Район: translations.district,
      Посёлок: translations.village,
    };
    return types[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      Город: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      Район:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      Посёлок:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    };
    return (
      colors[type] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    );
  };

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
        <button
          onClick={handleCreateCity}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium shadow-sm hover:shadow"
        >
          <Plus size={18} />
          {translations.addCity}
        </button>
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
        {translations.total}: {filteredCities.length} {translations.citiesCount}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.city}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.type}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  {translations.region}
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
              {filteredCities.map((city) => (
                <tr
                  key={city.id}
                  onClick={() => handleCityClick(city)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-150"
                >
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
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                    {city.population || translations.notSpecified}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden xl:table-cell">
                    {city.area ? `${city.area} км²` : translations.notSpecified}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCities.length === 0 && (
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
            {!searchTerm && (
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
          onClick={handleCloseModal}
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
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                    disabled={!isCreating && !isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm"
                    placeholder={translations.name}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.typeLabel}
                  </label>
                  <select
                    value={isCreating ? newCity.type : selectedCity?.type || ""}
                    onChange={(e) => handleInputChange("type", e.target.value)}
                    disabled={!isCreating && !isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm"
                  >
                    <option value="Город">{translations.cityLabel}</option>
                    <option value="Район">{translations.district}</option>
                    <option value="Посёлок">{translations.village}</option>
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
                    disabled={!isCreating && !isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm"
                  >
                    <option value="">{translations.selectRegion}</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
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
                          ? newCity.population
                          : selectedCity?.population || ""
                      }
                      onChange={(e) =>
                        handleInputChange("population", e.target.value)
                      }
                      disabled={!isCreating && !isEditMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm"
                      placeholder="500 000"
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
                          isCreating ? newCity.area : selectedCity?.area || ""
                        }
                        onChange={(e) =>
                          handleInputChange("area", e.target.value)
                        }
                        disabled={!isCreating && !isEditMode}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm pr-12"
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

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex flex-wrap gap-2 justify-end">
                {!isCreating && !isEditMode && (
                  <>
                    <button
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {translations.deleteBtn}
                    </button>
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      {translations.editBtn}
                    </button>
                    <button
                      onClick={handleCloseModal}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
                    >
                      {translations.close}
                    </button>
                  </>
                )}

                {(isCreating || isEditMode) && (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
                    >
                      {translations.cancel}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!isFormValid}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                        isFormValid
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      {translations.save}
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
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
              >
                {translations.deleteNo}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                {translations.deleteYes}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cities;
