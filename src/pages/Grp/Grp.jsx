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
  Trash2,
  AlertCircle,
  CheckCircle,
  Building,
  Cpu,
  Settings,
  PlusCircle,
  Hash,
  Gauge,
} from "lucide-react";
import useLanguageStore from "../../store/languageStore";
import { toast } from "react-toastify";

// Компонент модального окна для создания модели ГРП
const GrpModelModal = ({ isOpen, onClose, onSave, translations }) => {
  const [modelName, setModelName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!modelName.trim()) {
      toast.warning(translations.modelNameRequired);
      return;
    }
    setLoading(true);
    try {
      await onSave(modelName.trim());
      setModelName("");
      onClose();
    } catch (error) {
      console.error("Error saving GRP model:", error);
      toast.error(translations.error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {translations.newGrpModel}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {translations.modelNameLabel}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
              placeholder={translations.modelNamePlaceholder}
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
          >
            {translations.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !modelName.trim()}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              !loading && modelName.trim()
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                {translations.saving}
              </>
            ) : (
              translations.save
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Grp = () => {
  const { script } = useLanguageStore();
  const [grpList, setGrpList] = useState([]);
  const [cities, setCities] = useState([]);
  const [grpModels, setGrpModels] = useState([]);
  const [selectedGrp, setSelectedGrp] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);

  const translations = {
    title: script === "latin" ? "GTQ (GRP)" : "ГТҚ (ГРП)",
    subtitle:
      script === "latin"
        ? "Gaz taqsimlash punktlari"
        : "Газ тақсимлаш пунктлари",
    addGrp: script === "latin" ? "GTQ qo'shish" : "ГТҚ қўшиш",
    search: script === "latin" ? "Qidirish..." : "Қидириш...",
    searchPlaceholder:
      script === "latin"
        ? "Nomi yoki joylashgan joyi bo'yicha qidirish"
        : "Номи ёки жойлашган жойи бўйича қидириш",
    name: script === "latin" ? "Nomi" : "Номи",
    location: script === "latin" ? "Joylashgan joyi" : "Жойлашган жойи",
    model: script === "latin" ? "GTQ turi" : "ГТҚ тури",
    pressure: script === "latin" ? "Bosim turi" : "Босим тури",
    pressureHighMedium: script === "latin" ? "Yuqori-O'rta" : "Юқори-Ўрта",
    pressureMediumLow: script === "latin" ? "O'rta-Past" : "Ўрта-Паст",
    create: script === "latin" ? "Yangi GTQ" : "Янги ГТҚ",
    edit: script === "latin" ? "GTQ tahrirlash" : "ГТҚ таҳрирлаш",
    view: script === "latin" ? "GTQ ma'lumotlari" : "ГТҚ маълумотлари",
    nameLabel: script === "latin" ? "Nomi" : "Номи",
    locationLabel: script === "latin" ? "Joylashgan joyi" : "Жойлашган жойи",
    modelLabel: script === "latin" ? "GTQ turi" : "ГТҚ тури",
    pressureLabel: script === "latin" ? "Bosim turi" : "Босим тури",
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
        ? "Ushbu GTQ o'chirishni xohlaysizmi?"
        : "Ушбу ГТҚ ўчиришни хоҳлайсизми?",
    deleteYes: script === "latin" ? "Ha, o'chirish" : "Ҳа, ўчириш",
    deleteNo: script === "latin" ? "Yo'q" : "Йўқ",
    required: script === "latin" ? "Majburiy maydon" : "Мажбурий майдон",
    selectCity:
      script === "latin" ? "Shahar/tuman tanlang" : "Шаҳар/туман танланг",
    selectModel:
      script === "latin" ? "GTQ turini tanlang" : "ГТҚ турини танланг",
    selectPressure:
      script === "latin" ? "Bosim turini tanlang" : "Босим турини танланг",
    noData: script === "latin" ? "GTQ topilmadi" : "ГТҚ топилмади",
    noDataFound:
      script === "latin"
        ? "Hozircha GTQ mavjud emas"
        : "Ҳозирча ГТҚ мавжуд эмас",
    startAdding:
      script === "latin" ? "Birinchi GTQ qo'shish" : "Биринчи ГТҚ қўшиш",
    notSpecified: script === "latin" ? "Ko'rsatilmagan" : "Кўрсатилмаган",
    total: script === "latin" ? "Jami" : "Жами",
    totalCount: script === "latin" ? "ta GTQ" : "та ГТҚ",
    newGrpModel: script === "latin" ? "Yangi GTQ modeli" : "Янги ГТҚ модели",
    modelNameLabel: script === "latin" ? "GTQ modeli" : "ГТҚ модели",
    modelNamePlaceholder:
      script === "latin" ? "Model nomini kiriting" : "Модел номини киритинг",
    modelNameRequired:
      script === "latin"
        ? "Iltimos, model nomini kiriting"
        : "Илтимос, модел номини киритинг",
    addNewModel:
      script === "latin" ? "+ Yangi GTQ modeli" : "+ Янги ГТҚ модели",
    error: script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
    city: script === "latin" ? "shahar" : "шаҳар",
    district: script === "latin" ? "tuman" : "туман",
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Загрузка ГТҚ
      const grpSnapshot = await getDocs(collection(db, "grp"));
      const grpData = grpSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGrpList(grpData);

      // Загрузка городов
      const citiesSnapshot = await getDocs(collection(db, "cities"));
      const citiesData = citiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCities(citiesData);

      // Загрузка моделей ГРП
      const modelsSnapshot = await getDocs(collection(db, "grp_models"));
      const modelsData = modelsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGrpModels(modelsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(translations.error);
    } finally {
      setLoading(false);
    }
  };

  const [newGrp, setNewGrp] = useState({
    name: "",
    locationId: "",
    locationName: "",
    modelId: "",
    modelName: "",
    pressure: "",
  });

  const checkFormValidity = () => {
    const currentData = isCreating ? newGrp : selectedGrp;
    if (!currentData) return false;
    return currentData.name?.trim() && currentData.locationId?.trim();
  };

  const handleInputChange = (field, value) => {
    if (isCreating) {
      setNewGrp((prev) => ({ ...prev, [field]: value }));
    } else {
      setSelectedGrp((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleLocationChange = (locationId) => {
    const selectedCity = cities.find((city) => city.id === locationId);
    if (selectedCity) {
      const type =
        selectedCity.type === "Город"
          ? translations.city
          : translations.district;
      const locationNameWithType = `${selectedCity.name} (${type})`;

      if (isCreating) {
        setNewGrp((prev) => ({
          ...prev,
          locationId: selectedCity.id,
          locationName: locationNameWithType,
        }));
      } else {
        setSelectedGrp((prev) => ({
          ...prev,
          locationId: selectedCity.id,
          locationName: locationNameWithType,
        }));
      }
    }
  };

  const handleModelChange = (modelId) => {
    if (modelId === "new") {
      setIsModelModalOpen(true);
      return;
    }

    const selectedModel = grpModels.find((model) => model.id === modelId);
    if (selectedModel) {
      if (isCreating) {
        setNewGrp((prev) => ({
          ...prev,
          modelId: selectedModel.id,
          modelName: selectedModel.name,
        }));
      } else {
        setSelectedGrp((prev) => ({
          ...prev,
          modelId: selectedModel.id,
          modelName: selectedModel.name,
        }));
      }
    }
  };

  const handleSaveModel = async (modelName) => {
    try {
      const docRef = await addDoc(collection(db, "grp_models"), {
        name: modelName,
        createdAt: new Date(),
      });

      const newModel = {
        id: docRef.id,
        name: modelName,
      };

      setGrpModels((prev) => [...prev, newModel]);

      // Автоматически выбираем созданную модель
      if (isCreating) {
        setNewGrp((prev) => ({
          ...prev,
          modelId: newModel.id,
          modelName: newModel.name,
        }));
      } else {
        setSelectedGrp((prev) => ({
          ...prev,
          modelId: newModel.id,
          modelName: newModel.name,
        }));
      }

      toast.success(
        script === "latin" ? "GTQ modeli qo'shildi" : "ГТҚ модели қўшилди",
      );
    } catch (error) {
      console.error("Error saving GRP model:", error);
      throw error;
    }
  };

  const handleGrpClick = (grp) => {
    setSelectedGrp({ ...grp });
    setIsModalOpen(true);
    setIsEditMode(false);
  };

  const handleCreateGrp = () => {
    setIsCreating(true);
    setIsModalOpen(true);
    setNewGrp({
      name: "",
      locationId: "",
      locationName: "",
      modelId: "",
      modelName: "",
      pressure: "",
    });
    setIsSaving(false);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setIsEditMode(false);
    setIsCreating(false);
    setSelectedGrp(null);
    setIsDeleteConfirmOpen(false);
    setIsSaving(false);
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setIsSaving(false);
  };

  const handleCancel = () => {
    if (isSaving) return;
    if (isCreating) {
      handleCloseModal();
    } else {
      setIsEditMode(false);
      const originalGrp = grpList.find((grp) => grp.id === selectedGrp?.id);
      setSelectedGrp(originalGrp ? { ...originalGrp } : null);
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
        await addDoc(collection(db, "grp"), {
          ...newGrp,
          createdAt: new Date(),
        });
        toast.success(script === "latin" ? "GTQ qo'shildi" : "ГТҚ қўшилди");
      } else {
        await updateDoc(doc(db, "grp", selectedGrp.id), {
          ...selectedGrp,
          updatedAt: new Date(),
        });
        toast.success(script === "latin" ? "GTQ yangilandi" : "ГТҚ янгиланди");
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving GRP:", error);
      toast.error(translations.error);
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await deleteDoc(doc(db, "grp", selectedGrp.id));
      toast.success(script === "latin" ? "GTQ o'chirildi" : "ГТҚ ўчирилди");
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Error deleting GRP:", error);
      toast.error(translations.error);
      setIsSaving(false);
    }
  };

  const filteredGrp = grpList.filter(
    (grp) =>
      grp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grp.locationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grp.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grp.pressure?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const isFormValid = checkFormValidity();

  const pressureOptions = [
    { value: "Юқори-Ўрта", label: translations.pressureHighMedium },
    { value: "Ўрта-Паст", label: translations.pressureMediumLow },
  ];

  const getPressureLabel = (value) => {
    const option = pressureOptions.find((opt) => opt.value === value);
    return option ? option.label : value;
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
          onClick={handleCreateGrp}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium shadow-sm hover:shadow"
        >
          <Plus size={18} />
          {translations.addGrp}
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
        {translations.total}: {filteredGrp.length} {translations.totalCount}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.name}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  {translations.location}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  {translations.model}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">
                  {translations.pressure}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredGrp.map((grp) => (
                <tr
                  key={grp.id}
                  onClick={() => handleGrpClick(grp)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-150"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {grp.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>
                        {grp.locationName || translations.notSpecified}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-gray-400" />
                      <span>{grp.modelName || translations.notSpecified}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden xl:table-cell">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-gray-400" />
                      <span>
                        {getPressureLabel(grp.pressure) ||
                          translations.notSpecified}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredGrp.length === 0 && (
          <div className="text-center py-12">
            <Building
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
            {!searchTerm && (
              <button
                onClick={handleCreateGrp}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                {translations.addGrp}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Модальное окно для ГТҚ */}
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
                    {translations.nameLabel}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={isCreating ? newGrp.name : selectedGrp?.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={(!isCreating && !isEditMode) || isSaving}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    placeholder={translations.nameLabel}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.locationLabel}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={
                      isCreating
                        ? newGrp.locationId
                        : selectedGrp?.locationId || ""
                    }
                    onChange={(e) => handleLocationChange(e.target.value)}
                    disabled={(!isCreating && !isEditMode) || isSaving}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">{translations.selectCity}</option>
                    {cities.map((city) => {
                      const type =
                        city.type === "Город"
                          ? translations.city
                          : translations.district;
                      const displayName = `${city.name} (${type})`;
                      return (
                        <option key={city.id} value={city.id}>
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.modelLabel}
                  </label>
                  <select
                    value={
                      isCreating ? newGrp.modelId : selectedGrp?.modelId || ""
                    }
                    onChange={(e) => handleModelChange(e.target.value)}
                    disabled={(!isCreating && !isEditMode) || isSaving}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">{translations.selectModel}</option>
                    {grpModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                    <option value="new" className="text-blue-600 font-medium">
                      {translations.addNewModel}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.pressureLabel}
                  </label>
                  <select
                    value={
                      isCreating ? newGrp.pressure : selectedGrp?.pressure || ""
                    }
                    onChange={(e) =>
                      handleInputChange("pressure", e.target.value)
                    }
                    disabled={(!isCreating && !isEditMode) || isSaving}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">{translations.selectPressure}</option>
                    {pressureOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
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

      {/* Модальное окно для создания модели ГРП */}
      <GrpModelModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        onSave={handleSaveModel}
        translations={translations}
      />

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

export default Grp;
