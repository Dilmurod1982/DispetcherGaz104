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
  Users,
  Building,
} from "lucide-react";
import useLanguageStore from "../../store/languageStore";
import useAuthStore from "../../store/authStore";
import useLogger from "../../hooks/useLogger";
import { ActionTypes } from "../../services/logger";
import { toast } from "react-toastify";

const Consumers = () => {
  const { script } = useLanguageStore();
  const { userData } = useAuthStore();
  const { log } = useLogger();
  const [consumers, setConsumers] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedConsumer, setSelectedConsumer] = useState(null);
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
    title: script === "latin" ? "Iste'molchilar" : "Истеъмолчилар",
    subtitle:
      script === "latin"
        ? "Gaz iste'molchilari ro'yxati"
        : "Газ истеъмолчилари рўйхати",
    addConsumer:
      script === "latin" ? "Iste'molchi qo'shish" : "Истеъмолчи қўшиш",
    search: script === "latin" ? "Qidirish..." : "Қидириш...",
    searchPlaceholder:
      script === "latin"
        ? "Nomi yoki joylashgan joyi bo'yicha qidirish"
        : "Номи ёки жойлашган жойи бўйича қидириш",
    name: script === "latin" ? "Nomi" : "Номи",
    location: script === "latin" ? "Joylashgan joyi" : "Жойлашган жойи",
    create: script === "latin" ? "Yangi iste'molchi" : "Янги истеъмолчи",
    edit:
      script === "latin" ? "Iste'molchi tahrirlash" : "Истеъмолчи таҳрирлаш",
    view:
      script === "latin"
        ? "Iste'molchi ma'lumotlari"
        : "Истеъмолчи маълумотлари",
    nameLabel: script === "latin" ? "Iste'molchi nomi" : "Истеъмолчи номи",
    locationLabel: script === "latin" ? "Joylashgan joyi" : "Жойлашган жойи",
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
        ? "Ushbu iste'molchini o'chirishni xohlaysizmi?"
        : "Ушбу истеъмолчини ўчиришни хоҳлайсизми?",
    deleteYes: script === "latin" ? "Ha, o'chirish" : "Ҳа, ўчириш",
    deleteNo: script === "latin" ? "Yo'q" : "Йўқ",
    required: script === "latin" ? "Majburiy maydon" : "Мажбурий майдон",
    selectCity:
      script === "latin" ? "Shahar/tuman tanlang" : "Шаҳар/туман танланг",
    noData:
      script === "latin" ? "Iste'molchi topilmadi" : "Истеъмолчи топилмади",
    noDataFound:
      script === "latin"
        ? "Hozircha iste'molchilar mavjud emas"
        : "Ҳозирча истеъмолчилар мавжуд эмас",
    startAdding:
      script === "latin"
        ? "Birinchi iste'molchi qo'shish"
        : "Биринчи истеъмолчи қўшиш",
    notSpecified: script === "latin" ? "Ko'rsatilmagan" : "Кўрсатилмаган",
    total: script === "latin" ? "Jami" : "Жами",
    totalCount: script === "latin" ? "ta iste'molchi" : "та истеъмолчи",
    city: script === "latin" ? "shahar" : "шаҳар",
    district: script === "latin" ? "tuman" : "туман",
    noPermission:
      script === "latin"
        ? "Faqat administratorlar iste'molchi qo'shishi mumkin"
        : "Фақат администраторлар истеъмолчи қўшиши мумкин",
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const consumersSnapshot = await getDocs(collection(db, "consumers"));
      const consumersData = consumersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setConsumers(consumersData);

      const citiesSnapshot = await getDocs(collection(db, "cities"));
      const citiesData = citiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCities(citiesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(
        script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
      );
    } finally {
      setLoading(false);
    }
  };

  const [newConsumer, setNewConsumer] = useState({
    name: "",
    locationId: "",
    locationName: "",
    locationType: "",
  });

  const checkFormValidity = () => {
    const currentData = isCreating ? newConsumer : selectedConsumer;
    if (!currentData) return false;
    return currentData.name?.trim() && currentData.locationId?.trim();
  };

  const handleInputChange = (field, value) => {
    if (isCreating) {
      setNewConsumer((prev) => ({ ...prev, [field]: value }));
    } else {
      setSelectedConsumer((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleLocationChange = (locationId) => {
    const selectedCity = cities.find((city) => city.id === locationId);
    if (selectedCity) {
      const type =
        selectedCity.type === "Город"
          ? translations.city
          : translations.district;
      // Без скобок: "Farg'ona shahar"
      const locationNameWithoutBrackets = `${selectedCity.name} ${type}`;

      if (isCreating) {
        setNewConsumer((prev) => ({
          ...prev,
          locationId: selectedCity.id,
          locationName: locationNameWithoutBrackets,
          locationType: selectedCity.type,
        }));
      } else {
        setSelectedConsumer((prev) => ({
          ...prev,
          locationId: selectedCity.id,
          locationName: locationNameWithoutBrackets,
          locationType: selectedCity.type,
        }));
      }
    }
  };

  const handleConsumerClick = (consumer) => {
    setSelectedConsumer({ ...consumer });
    setIsModalOpen(true);
    setIsEditMode(false);
  };

  const handleCreateConsumer = () => {
    if (!isAdmin) {
      toast.warning(translations.noPermission);
      return;
    }
    setIsCreating(true);
    setIsModalOpen(true);
    setNewConsumer({
      name: "",
      locationId: "",
      locationName: "",
      locationType: "",
    });
    setIsSaving(false);
    log(ActionTypes.CONSUMER_CREATE, { action: "open_form" });
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setIsEditMode(false);
    setIsCreating(false);
    setSelectedConsumer(null);
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
      const originalConsumer = consumers.find(
        (consumer) => consumer.id === selectedConsumer?.id,
      );
      setSelectedConsumer(originalConsumer ? { ...originalConsumer } : null);
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
        await addDoc(collection(db, "consumers"), {
          ...newConsumer,
          createdAt: new Date(),
        });
        await log(ActionTypes.CONSUMER_CREATE, {
          consumerName: newConsumer.name,
          locationName: newConsumer.locationName,
          action: "create",
        });
        toast.success(
          script === "latin" ? "Iste'molchi qo'shildi" : "Истеъмолчи қўшилди",
        );
      } else {
        // Сохраняем старые данные для логирования изменений
        const oldConsumer = consumers.find((c) => c.id === selectedConsumer.id);

        await updateDoc(doc(db, "consumers", selectedConsumer.id), {
          ...selectedConsumer,
          updatedAt: new Date(),
        });

        // Логируем изменения с деталями
        await log(ActionTypes.CONSUMER_UPDATE, {
          consumerId: selectedConsumer.id,
          consumerName: selectedConsumer.name,
          locationName: selectedConsumer.locationName,
          oldName: oldConsumer?.name || selectedConsumer.name,
          oldLocation:
            oldConsumer?.locationName || selectedConsumer.locationName,
          changes: {
            name:
              oldConsumer?.name !== selectedConsumer.name
                ? `${oldConsumer?.name || ""} → ${selectedConsumer.name}`
                : null,
            location:
              oldConsumer?.locationName !== selectedConsumer.locationName
                ? `${oldConsumer?.locationName || ""} → ${selectedConsumer.locationName}`
                : null,
          },
          action: "update",
        });

        toast.success(
          script === "latin"
            ? "Iste'molchi yangilandi"
            : "Истеъмолчи янгиланди",
        );
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving consumer:", error);
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
      const consumerToDelete = selectedConsumer;
      await deleteDoc(doc(db, "consumers", selectedConsumer.id));
      await log(ActionTypes.CONSUMER_DELETE, {
        consumerId: consumerToDelete.id,
        consumerName: consumerToDelete.name,
        locationName: consumerToDelete.locationName,
        action: "delete",
      });
      toast.success(
        script === "latin" ? "Iste'molchi o'chirildi" : "Истеъмолчи ўчирилди",
      );
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Error deleting consumer:", error);
      toast.error(
        script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
      );
      setIsSaving(false);
    }
  };

  const filteredConsumers = consumers.filter(
    (consumer) =>
      consumer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consumer.locationName?.toLowerCase().includes(searchTerm.toLowerCase()),
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
            onClick={handleCreateConsumer}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium shadow-sm hover:shadow"
          >
            <Plus size={18} />
            {translations.addConsumer}
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
        {translations.total}: {filteredConsumers.length}{" "}
        {translations.totalCount}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredConsumers.map((consumer) => (
                <tr
                  key={consumer.id}
                  onClick={() => handleConsumerClick(consumer)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-150"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {consumer.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>
                        {consumer.locationName || translations.notSpecified}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredConsumers.length === 0 && (
          <div className="text-center py-12">
            <Users
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
                onClick={handleCreateConsumer}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                {translations.addConsumer}
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
                    value={
                      isCreating
                        ? newConsumer.name
                        : selectedConsumer?.name || ""
                    }
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
                        ? newConsumer.locationId
                        : selectedConsumer?.locationId || ""
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
                      // Без скобок: "Farg'ona shahar"
                      const displayName = `${city.name} ${type}`;
                      return (
                        <option key={city.id} value={city.id}>
                          {displayName}
                        </option>
                      );
                    })}
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

export default Consumers;
