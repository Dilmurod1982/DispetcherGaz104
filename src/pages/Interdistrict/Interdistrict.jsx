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
  Cpu,
  Settings,
  PlusCircle,
  Hash,
  ArrowRightLeft,
} from "lucide-react";
import useLanguageStore from "../../store/languageStore";
import useAuthStore from "../../store/authStore";
import useLogger from "../../hooks/useLogger";
import { ActionTypes } from "../../services/logger";
import { toast } from "react-toastify";

// Компонент модального окна для создания счетчика
const MeterModal = ({ isOpen, onClose, onSave, translations }) => {
  const [meterName, setMeterName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!meterName.trim()) {
      toast.warning(translations.meterNameRequired);
      return;
    }
    setLoading(true);
    try {
      await onSave(meterName.trim());
      setMeterName("");
      onClose();
    } catch (error) {
      console.error("Error saving meter:", error);
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
            {translations.newMeter}
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
              {translations.meterNameLabel}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={meterName}
              onChange={(e) => setMeterName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
              placeholder={translations.meterNamePlaceholder}
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
            disabled={loading || !meterName.trim()}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              !loading && meterName.trim()
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

const Interdistrict = () => {
  const { script } = useLanguageStore();
  const { userData } = useAuthStore();
  const { log } = useLogger();
  const [interdistricts, setInterdistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [meters, setMeters] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);

  // Проверка, является ли пользователь админом
  const isAdmin = userData?.role === "admin" || userData?.role === "Админ";

  const translations = {
    title:
      script === "latin"
        ? "Tumanlararo hisoblagichlar"
        : "Туманлараро ҳисоблагичлар",
    subtitle:
      script === "latin"
        ? "Tumanlar orasidagi hisoblagichlar"
        : "Туманлар орасидаги ҳисоблагичлар",
    addItem: script === "latin" ? "Yangi hisoblagich" : "Янги ҳисоблагич",
    search: script === "latin" ? "Qidirish..." : "Қидириш...",
    searchPlaceholder:
      script === "latin" ? "Nomi bo'yicha qidirish" : "Номи бўйича қидириш",
    name: script === "latin" ? "Nomi" : "Номи",
    supplier:
      script === "latin" ? "Gaz yetkazib beruvchi" : "Газ етказиб берувчи",
    receiver: script === "latin" ? "Qabul qiluvchi" : "Қабул қилувчи",
    meter: script === "latin" ? "Hisoblagich" : "Ҳисоблагич",
    meterSerial: script === "latin" ? "Zavod raqami" : "Завод рақами",
    subscale:
      script === "latin" ? "Shkala osti uskunasi" : "Шкала ости ускунаси",
    create: script === "latin" ? "Yangi hisoblagich" : "Янги ҳисоблагич",
    edit:
      script === "latin" ? "Hisoblagich tahrirlash" : "Ҳисоблагич таҳрирлаш",
    view:
      script === "latin"
        ? "Hisoblagich ma'lumotlari"
        : "Ҳисоблагич маълумотлари",
    nameLabel: script === "latin" ? "Nomi" : "Номи",
    supplierLabel:
      script === "latin" ? "Gaz yetkazib beruvchi" : "Газ етказиб берувчи",
    receiverLabel: script === "latin" ? "Qabul qiluvchi" : "Қабул қилувчи",
    meterLabel: script === "latin" ? "Hisoblagich" : "Ҳисоблагич",
    meterSerialLabel: script === "latin" ? "Zavod raqami" : "Завод рақами",
    subscaleLabel:
      script === "latin" ? "Shkala osti uskunasi" : "Шкала ости ускунаси",
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
        ? "Ushbu hisoblagichni o'chirishni xohlaysizmi?"
        : "Ушбу ҳисоблагични ўчиришни хоҳлайсизми?",
    deleteYes: script === "latin" ? "Ha, o'chirish" : "Ҳа, ўчириш",
    deleteNo: script === "latin" ? "Yo'q" : "Йўқ",
    required: script === "latin" ? "Majburiy maydon" : "Мажбурий майдон",
    selectCity:
      script === "latin" ? "Shahar/tuman tanlang" : "Шаҳар/туман танланг",
    selectMeter:
      script === "latin" ? "Hisoblagich tanlang" : "Ҳисоблагич танланг",
    noData:
      script === "latin" ? "Hisoblagich topilmadi" : "Ҳисоблагич топилмади",
    noDataFound:
      script === "latin"
        ? "Hozircha hisoblagichlar mavjud emas"
        : "Ҳозирча ҳисоблагичлар мавжуд эмас",
    startAdding:
      script === "latin"
        ? "Birinchi hisoblagichni qo'shish"
        : "Биринчи ҳисоблагични қўшиш",
    notSpecified: script === "latin" ? "Ko'rsatilmagan" : "Кўрсатилмаган",
    total: script === "latin" ? "Jami" : "Жами",
    totalCount: script === "latin" ? "ta hisoblagich" : "та ҳисоблагич",
    newMeter: script === "latin" ? "Yangi hisoblagich" : "Янги ҳисоблагич",
    meterNameLabel:
      script === "latin" ? "Hisoblagich modeli" : "Ҳисоблагич модели",
    meterNamePlaceholder:
      script === "latin" ? "Model nomini kiriting" : "Модел номини киритинг",
    meterNameRequired:
      script === "latin"
        ? "Iltimos, model nomini kiriting"
        : "Илтимос, модел номини киритинг",
    meterSerialPlaceholder:
      script === "latin"
        ? "Zavod raqamini kiriting"
        : "Завод рақамини киритинг",
    addNewMeter:
      script === "latin" ? "+ Yangi hisoblagich" : "+ Янги ҳисоблагич",
    error: script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
    sameCityError:
      script === "latin"
        ? "Yetkazib beruvchi va qabul qiluvchi bir xil bo'lishi mumkin emas!"
        : "Етказиб берувчи ва қабул қилувчи бир хил бўлиши мумкин эмас!",
    subscaleOptions: {
      available: script === "latin" ? "Mavjud" : "Мавжуд",
      notAvailable: script === "latin" ? "Mavjud emas" : "Мавжуд эмас",
    },
    city: script === "latin" ? "shahar" : "шаҳар",
    district: script === "latin" ? "tuman" : "туман",
    noPermission:
      script === "latin"
        ? "Faqat administratorlar hisoblagich qo'shishi mumkin"
        : "Фақат администраторлар ҳисоблагич қўшиши мумкин",
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const interdistrictsSnapshot = await getDocs(
        collection(db, "interdistrict"),
      );
      const interdistrictsData = interdistrictsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInterdistricts(interdistrictsData);

      const citiesSnapshot = await getDocs(collection(db, "cities"));
      const citiesData = citiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCities(citiesData);

      const metersSnapshot = await getDocs(collection(db, "meters"));
      const metersData = metersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMeters(metersData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(translations.error);
    } finally {
      setLoading(false);
    }
  };

  const [newItem, setNewItem] = useState({
    name: "",
    supplierId: "",
    supplierName: "",
    receiverId: "",
    receiverName: "",
    meterId: "",
    meterName: "",
    meterSerial: "",
    subscale: "",
  });

  const checkFormValidity = () => {
    const currentData = isCreating ? newItem : selectedItem;
    if (!currentData) return false;
    if (!currentData.name?.trim()) return false;
    if (!currentData.supplierId?.trim()) return false;
    if (!currentData.receiverId?.trim()) return false;
    if (currentData.supplierId === currentData.receiverId) return false;
    return true;
  };

  const handleInputChange = (field, value) => {
    if (isCreating) {
      setNewItem((prev) => ({ ...prev, [field]: value }));
    } else {
      setSelectedItem((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSupplierChange = (cityId) => {
    const selectedCity = cities.find((city) => city.id === cityId);
    if (selectedCity) {
      const type =
        selectedCity.type === "Город"
          ? translations.city
          : translations.district;
      const displayName = `${selectedCity.name} (${type})`;

      if (isCreating) {
        setNewItem((prev) => ({
          ...prev,
          supplierId: selectedCity.id,
          supplierName: displayName,
        }));
        if (prev.receiverId === selectedCity.id) {
          toast.warning(translations.sameCityError);
          setNewItem((prev) => ({ ...prev, receiverId: "", receiverName: "" }));
        }
      } else {
        setSelectedItem((prev) => ({
          ...prev,
          supplierId: selectedCity.id,
          supplierName: displayName,
        }));
        if (selectedItem?.receiverId === selectedCity.id) {
          toast.warning(translations.sameCityError);
          setSelectedItem((prev) => ({
            ...prev,
            receiverId: "",
            receiverName: "",
          }));
        }
      }
    }
  };

  const handleReceiverChange = (cityId) => {
    const selectedCity = cities.find((city) => city.id === cityId);
    if (selectedCity) {
      const type =
        selectedCity.type === "Город"
          ? translations.city
          : translations.district;
      const displayName = `${selectedCity.name} (${type})`;

      if (isCreating) {
        if (newItem.supplierId === cityId) {
          toast.warning(translations.sameCityError);
          return;
        }
        setNewItem((prev) => ({
          ...prev,
          receiverId: selectedCity.id,
          receiverName: displayName,
        }));
      } else {
        if (selectedItem?.supplierId === cityId) {
          toast.warning(translations.sameCityError);
          return;
        }
        setSelectedItem((prev) => ({
          ...prev,
          receiverId: selectedCity.id,
          receiverName: displayName,
        }));
      }
    }
  };

  const handleMeterChange = (meterId) => {
    if (meterId === "new") {
      setIsMeterModalOpen(true);
      return;
    }

    const selectedMeter = meters.find((meter) => meter.id === meterId);
    if (selectedMeter) {
      if (isCreating) {
        setNewItem((prev) => ({
          ...prev,
          meterId: selectedMeter.id,
          meterName: selectedMeter.name,
          meterSerial: selectedMeter.serial || "",
        }));
      } else {
        setSelectedItem((prev) => ({
          ...prev,
          meterId: selectedMeter.id,
          meterName: selectedMeter.name,
          meterSerial: selectedMeter.serial || "",
        }));
      }
    }
  };

  const handleSaveMeter = async (meterName) => {
    try {
      const docRef = await addDoc(collection(db, "meters"), {
        name: meterName,
        serial: "",
        createdAt: new Date(),
      });

      const newMeter = {
        id: docRef.id,
        name: meterName,
        serial: "",
      };

      setMeters((prev) => [...prev, newMeter]);

      if (isCreating) {
        setNewItem((prev) => ({
          ...prev,
          meterId: newMeter.id,
          meterName: newMeter.name,
          meterSerial: "",
        }));
      } else {
        setSelectedItem((prev) => ({
          ...prev,
          meterId: newMeter.id,
          meterName: newMeter.name,
          meterSerial: "",
        }));
      }

      toast.success(
        script === "latin" ? "Hisoblagich qo'shildi" : "Ҳисоблагич қўшилди",
      );
    } catch (error) {
      console.error("Error saving meter:", error);
      throw error;
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem({ ...item });
    setIsModalOpen(true);
    setIsEditMode(false);
  };

  const handleCreateItem = () => {
    if (!isAdmin) {
      toast.warning(translations.noPermission);
      return;
    }
    setIsCreating(true);
    setIsModalOpen(true);
    setNewItem({
      name: "",
      supplierId: "",
      supplierName: "",
      receiverId: "",
      receiverName: "",
      meterId: "",
      meterName: "",
      meterSerial: "",
      subscale: "",
    });
    setIsSaving(false);
    log(ActionTypes.INTERDISTRICT_CREATE, { action: "open_form" });
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setIsEditMode(false);
    setIsCreating(false);
    setSelectedItem(null);
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
      const originalItem = interdistricts.find(
        (item) => item.id === selectedItem?.id,
      );
      setSelectedItem(originalItem ? { ...originalItem } : null);
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
        await addDoc(collection(db, "interdistrict"), {
          ...newItem,
          createdAt: new Date(),
        });
        await log(ActionTypes.INTERDISTRICT_CREATE, {
          itemName: newItem.name,
          supplierName: newItem.supplierName,
          receiverName: newItem.receiverName,
        });
        toast.success(
          script === "latin" ? "Hisoblagich qo'shildi" : "Ҳисоблагич қўшилди",
        );
      } else {
        await updateDoc(doc(db, "interdistrict", selectedItem.id), {
          ...selectedItem,
          updatedAt: new Date(),
        });
        await log(ActionTypes.INTERDISTRICT_UPDATE, {
          itemId: selectedItem.id,
          itemName: selectedItem.name,
        });
        toast.success(
          script === "latin"
            ? "Hisoblagich yangilandi"
            : "Ҳисоблагич янгиланди",
        );
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving interdistrict:", error);
      toast.error(translations.error);
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
      const itemToDelete = selectedItem;
      await deleteDoc(doc(db, "interdistrict", selectedItem.id));
      await log(ActionTypes.INTERDISTRICT_DELETE, {
        itemId: itemToDelete.id,
        itemName: itemToDelete.name,
      });
      toast.success(
        script === "latin" ? "Hisoblagich o'chirildi" : "Ҳисоблагич ўчирилди",
      );
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Error deleting interdistrict:", error);
      toast.error(translations.error);
      setIsSaving(false);
    }
  };

  const filteredItems = interdistricts.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.receiverName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const isFormValid = checkFormValidity();

  const subscaleOptions = [
    { value: "Мавжуд", label: translations.subscaleOptions.available },
    { value: "Мавжуд эмас", label: translations.subscaleOptions.notAvailable },
  ];

  const getSubscaleLabel = (value) => {
    const option = subscaleOptions.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  const getMeterDisplay = (meterName, meterSerial) => {
    if (!meterName) return translations.notSpecified;
    if (meterSerial) return `${meterName} (№${meterSerial})`;
    return meterName;
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
        {isAdmin && (
          <button
            onClick={handleCreateItem}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium shadow-sm hover:shadow"
          >
            <Plus size={18} />
            {translations.addItem}
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
        {translations.total}: {filteredItems.length} {translations.totalCount}
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
                  {translations.supplier}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  {translations.receiver}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">
                  {translations.meter}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-150"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ArrowRightLeft className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>
                        {item.supplierName || translations.notSpecified}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>
                        {item.receiverName || translations.notSpecified}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden xl:table-cell">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-gray-400" />
                      <span>
                        {getMeterDisplay(item.meterName, item.meterSerial)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <ArrowRightLeft
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
                onClick={handleCreateItem}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                {translations.addItem}
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
                    value={isCreating ? newItem.name : selectedItem?.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={(!isCreating && !isEditMode) || isSaving}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    placeholder={translations.nameLabel}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.supplierLabel}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={
                      isCreating
                        ? newItem.supplierId
                        : selectedItem?.supplierId || ""
                    }
                    onChange={(e) => handleSupplierChange(e.target.value)}
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
                    {translations.receiverLabel}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={
                      isCreating
                        ? newItem.receiverId
                        : selectedItem?.receiverId || ""
                    }
                    onChange={(e) => handleReceiverChange(e.target.value)}
                    disabled={(!isCreating && !isEditMode) || isSaving}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">{translations.selectCity}</option>
                    {cities
                      .filter(
                        (city) =>
                          city.id !==
                          (isCreating
                            ? newItem.supplierId
                            : selectedItem?.supplierId),
                      )
                      .map((city) => {
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
                  {(isCreating
                    ? newItem.supplierId
                    : selectedItem?.supplierId) &&
                    (isCreating
                      ? newItem.receiverId
                      : selectedItem?.receiverId) &&
                    (isCreating
                      ? newItem.supplierId
                      : selectedItem?.supplierId) ===
                      (isCreating
                        ? newItem.receiverId
                        : selectedItem?.receiverId) && (
                      <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {translations.sameCityError}
                      </div>
                    )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.meterLabel}
                  </label>
                  <select
                    value={
                      isCreating ? newItem.meterId : selectedItem?.meterId || ""
                    }
                    onChange={(e) => handleMeterChange(e.target.value)}
                    disabled={(!isCreating && !isEditMode) || isSaving}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">{translations.selectMeter}</option>
                    {meters.map((meter) => (
                      <option key={meter.id} value={meter.id}>
                        {meter.name}
                        {meter.serial ? ` (№${meter.serial})` : ""}
                      </option>
                    ))}
                    <option value="new" className="text-blue-600 font-medium">
                      {translations.addNewMeter}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.meterSerialLabel}
                  </label>
                  <input
                    type="text"
                    value={
                      isCreating
                        ? newItem.meterSerial
                        : selectedItem?.meterSerial || ""
                    }
                    onChange={(e) =>
                      handleInputChange("meterSerial", e.target.value)
                    }
                    disabled={(!isCreating && !isEditMode) || isSaving}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    placeholder={translations.meterSerialPlaceholder}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.subscaleLabel}
                  </label>
                  <select
                    value={
                      isCreating
                        ? newItem.subscale
                        : selectedItem?.subscale || ""
                    }
                    onChange={(e) =>
                      handleInputChange("subscale", e.target.value)
                    }
                    disabled={(!isCreating && !isEditMode) || isSaving}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">{translations.selectCity}</option>
                    {subscaleOptions.map((option) => (
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

      {/* Модальное окно для создания счетчика */}
      <MeterModal
        isOpen={isMeterModalOpen}
        onClose={() => setIsMeterModalOpen(false)}
        onSave={handleSaveMeter}
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

export default Interdistrict;
