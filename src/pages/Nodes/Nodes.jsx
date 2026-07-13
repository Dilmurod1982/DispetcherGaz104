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
  Trash2,
  AlertCircle,
  CheckCircle,
  Factory,
  Link,
  Users,
  Cpu,
  Settings,
  PlusCircle,
  Hash,
  Building,
  Tag,
  User,
  Users as UsersIcon,
  Briefcase,
  Building2,
  Flame,
  Zap,
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

const Nodes = () => {
  const { script } = useLanguageStore();
  const { user, userData } = useAuthStore();
  const { log } = useLogger();
  const [nodes, setNodes] = useState([]);
  const [grsList, setGrsList] = useState([]);
  const [meters, setMeters] = useState([]);
  const [cities, setCities] = useState([]);
  const [nodeConsumers, setNodeConsumers] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodeConsumers, setSelectedNodeConsumers] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);

  const isAdmin = userData?.role === "admin" || userData?.role === "Админ";

  const translations = {
    title: script === "latin" ? "Tugunlar" : "Тугунлар",
    subtitle: script === "latin" ? "GRS dagi tugunlar" : "ГРС даги тугунлар",
    addNode: script === "latin" ? "Tugun qo'shish" : "Тугун қўшиш",
    search: script === "latin" ? "Qidirish..." : "Қидириш...",
    searchPlaceholder:
      script === "latin"
        ? "Nomi yoki GRS bo'yicha qidirish"
        : "Номи ёки ГРС бўйича қидириш",
    grs: script === "latin" ? "GTS (GRS)" : "ГТШ (ГРС)",
    name: script === "latin" ? "Nomi yoki raqami" : "Номи ёки рақами",
    nodeNumber: script === "latin" ? "Tugun raqami" : "Тугун рақами",
    nodeType: script === "latin" ? "Tugun turi" : "Тугун тури",
    city: script === "latin" ? "Tuman/shahar" : "Туман/шаҳар",
    meter: script === "latin" ? "Hisoblagich" : "Ҳисоблагич",
    meterSerial: script === "latin" ? "Zavod raqami" : "Завод рақами",
    subscale:
      script === "latin" ? "Shkala osti uskunasi" : "Шкала ости ускунаси",
    create: script === "latin" ? "Yangi tugun" : "Янги тугун",
    edit: script === "latin" ? "Tugun tahrirlash" : "Тугун таҳрирлаш",
    view: script === "latin" ? "Tugun ma'lumotlari" : "Тугун маълумотлари",
    grsLabel: script === "latin" ? "GTS (GRS)" : "ГТШ (ГРС)",
    nameLabel: script === "latin" ? "Nomi yoki raqami" : "Номи ёки рақами",
    nodeNumberLabel: script === "latin" ? "Tugun raqami" : "Тугун рақами",
    nodeTypeLabel: script === "latin" ? "Tugun turi" : "Тугун тури",
    cityLabel: script === "latin" ? "Tugun egasi" : "Тугун эгаси",
    meterLabel: script === "latin" ? "Hisoblagich" : "Ҳисоблагич",
    meterSerialLabel: script === "latin" ? "Zavod raqami" : "Завод рақами",
    subscaleLabel:
      script === "latin" ? "Shkala osti uskunasi" : "Шкала ости ускунаси",
    consumersData:
      script === "latin" ? "Iste'molchilar soni" : "Истеъмолчилар сони",
    populationConsumers:
      script === "latin" ? "Aholi iste'molchilari" : "Аҳоли истеъмолчилари",
    budgetConsumers:
      script === "latin" ? "Byudjet iste'molchilari" : "Бюджет истеъмолчилари",
    smallBusinessConsumers:
      script === "latin" ? "Kichik va o'rta biznes" : "Кичик ва ўрта бизнес",
    industryConsumers:
      script === "latin" ? "Sanoat iste'molchilari" : "Саноат истеъмолчилари",
    heatSourceConsumers:
      script === "latin" ? "Issiqlik manbai" : "Иссиқлик манбаи",
    agtksConsumers: script === "latin" ? "AGTKS" : "АГТКШ",
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
        ? "Ushbu tugunni o'chirishni xohlaysizmi?"
        : "Ушбу тугунни ўчиришни хоҳлайсизми?",
    deleteYes: script === "latin" ? "Ha, o'chirish" : "Ҳа, ўчириш",
    deleteNo: script === "latin" ? "Yo'q" : "Йўқ",
    required: script === "latin" ? "Majburiy maydon" : "Мажбурий майдон",
    selectGrs: script === "latin" ? "GTS tanlang" : "ГТШ танланг",
    selectCity:
      script === "latin" ? "Tuman/shaharni tanlang" : "Туман/шаҳарни танланг",
    selectMeter:
      script === "latin" ? "Hisoblagich tanlang" : "Ҳисоблагич танланг",
    selectNodeType:
      script === "latin" ? "Tugun turini tanlang" : "Тугун турини танланг",
    noData: script === "latin" ? "Tugun topilmadi" : "Тугун топилмади",
    noDataFound:
      script === "latin"
        ? "Hozircha tugunlar mavjud emas"
        : "Ҳозирча тугунлар мавжуд эмас",
    startAdding:
      script === "latin"
        ? "Birinchi tugunni qo'shish"
        : "Биринчи тугунни қўшиш",
    notSpecified: script === "latin" ? "Ko'rsatilmagan" : "Кўрсатилмаган",
    total: script === "latin" ? "Jami" : "Жами",
    totalCount: script === "latin" ? "ta tugun" : "та тугун",
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
    nodeTypeOptions: {
      population: script === "latin" ? "Aholi" : "Аҳоли",
      industry: script === "latin" ? "Sanoat" : "Саноат",
    },
    subscaleOptions: {
      available: script === "latin" ? "Mavjud" : "Мавжуд",
      notAvailable: script === "latin" ? "Mavjud emas" : "Мавжуд эмас",
    },
    city: script === "latin" ? "shahar" : "шаҳар",
    district: script === "latin" ? "tuman" : "туман",
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

      const nodesSnapshot = await getDocs(collection(db, "nodes"));
      const nodesData = nodesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNodes(nodesData);

      const metersSnapshot = await getDocs(collection(db, "meters"));
      const metersData = metersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMeters(metersData);

      const citiesSnapshot = await getDocs(collection(db, "cities"));
      const citiesData = citiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCities(citiesData);

      const consumersSnapshot = await getDocs(collection(db, "node_consumers"));
      const consumersData = consumersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNodeConsumers(consumersData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(translations.error);
    } finally {
      setLoading(false);
    }
  };

  const [newNode, setNewNode] = useState({
    grsId: "",
    grsName: "",
    name: "",
    nodeNumber: "",
    nodeType: "",
    cityId: "",
    cityName: "",
    meterId: "",
    meterName: "",
    meterSerial: "",
    subscale: "",
  });

  const [newConsumers, setNewConsumers] = useState({
    population: "",
    budget: "",
    smallBusiness: "",
    industry: "",
    heatSource: "",
    agtks: "",
  });

  const checkFormValidity = () => {
    const currentData = isCreating ? newNode : selectedNode;
    if (!currentData) return false;
    return (
      currentData.grsId?.trim() &&
      currentData.name?.trim() &&
      currentData.nodeType?.trim()
    );
  };

  const handleInputChange = (field, value) => {
    if (isCreating) {
      setNewNode((prev) => ({ ...prev, [field]: value }));
    } else {
      setSelectedNode((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleConsumerChange = (field, value) => {
    const cleanedValue = value.replace(/\D/g, "");
    if (isCreating) {
      setNewConsumers((prev) => ({ ...prev, [field]: cleanedValue }));
    } else {
      setSelectedNodeConsumers((prev) => ({
        ...prev,
        [field]: cleanedValue,
      }));
    }
  };

  const handleNodeNumberChange = (value) => {
    const cleanedValue = value.replace(/\D/g, "");
    handleInputChange("nodeNumber", cleanedValue);
  };

  const handleGrsChange = (grsId) => {
    const selectedGrs = grsList.find((grs) => grs.id === grsId);
    if (selectedGrs) {
      if (isCreating) {
        setNewNode((prev) => ({
          ...prev,
          grsId: selectedGrs.id,
          grsName: selectedGrs.name,
        }));
      } else {
        setSelectedNode((prev) => ({
          ...prev,
          grsId: selectedGrs.id,
          grsName: selectedGrs.name,
        }));
      }
    }
  };

  const handleCityChange = (cityId) => {
    const selectedCity = cities.find((city) => city.id === cityId);
    if (selectedCity) {
      let typeName = "";
      if (selectedCity.type === "shahar" || selectedCity.type === "Город") {
        typeName = translations.city;
      } else if (
        selectedCity.type === "tuman" ||
        selectedCity.type === "Район"
      ) {
        typeName = translations.district;
      } else {
        typeName = selectedCity.type || "";
      }

      const displayName = `${selectedCity.name} ${typeName}`.trim();

      if (isCreating) {
        setNewNode((prev) => ({
          ...prev,
          cityId: selectedCity.id,
          cityName: displayName,
        }));
      } else {
        setSelectedNode((prev) => ({
          ...prev,
          cityId: selectedCity.id,
          cityName: displayName,
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
        setNewNode((prev) => ({
          ...prev,
          meterId: selectedMeter.id,
          meterName: selectedMeter.name,
          meterSerial: selectedMeter.serial || "",
        }));
      } else {
        setSelectedNode((prev) => ({
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
        setNewNode((prev) => ({
          ...prev,
          meterId: newMeter.id,
          meterName: newMeter.name,
          meterSerial: "",
        }));
      } else {
        setSelectedNode((prev) => ({
          ...prev,
          meterId: newMeter.id,
          meterName: newMeter.name,
          meterSerial: "",
        }));
      }

      toast.success(
        script === "latin" ? "Hisoblagich qo'shildi" : "Ҳисоблагич қўшилди",
      );

      await log(ActionTypes.NODE_CREATE, {
        action: "meter_created",
        meterName: meterName,
      });
    } catch (error) {
      console.error("Error saving meter:", error);
      throw error;
    }
  };

  const handleNodeClick = (node) => {
    const consumers = nodeConsumers.find((c) => c.nodeId === node.id);

    setSelectedNode({ ...node });
    setSelectedNodeConsumers(
      consumers
        ? { ...consumers }
        : {
            population: "",
            budget: "",
            smallBusiness: "",
            industry: "",
            heatSource: "",
            agtks: "",
          },
    );
    setIsModalOpen(true);
    setIsEditMode(false);
  };

  const handleCreateNode = () => {
    if (!isAdmin) {
      toast.warning(
        script === "latin"
          ? "Faqat administratorlar tugun qo'shishi mumkin"
          : "Фақат администраторлар тугун қўшиши мумкин",
      );
      return;
    }
    setIsCreating(true);
    setIsModalOpen(true);
    setNewNode({
      grsId: "",
      grsName: "",
      name: "",
      nodeNumber: "",
      nodeType: "",
      cityId: "",
      cityName: "",
      meterId: "",
      meterName: "",
      meterSerial: "",
      subscale: "",
    });
    setNewConsumers({
      population: "",
      budget: "",
      smallBusiness: "",
      industry: "",
      heatSource: "",
      agtks: "",
    });
    setIsSaving(false);

    log(ActionTypes.NODE_CREATE, { action: "open_form" });
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setIsEditMode(false);
    setIsCreating(false);
    setSelectedNode(null);
    setSelectedNodeConsumers(null);
    setIsDeleteConfirmOpen(false);
    setIsSaving(false);
  };

  const handleEdit = () => {
    if (!isAdmin) {
      toast.warning(
        script === "latin"
          ? "Faqat administratorlar tugunni tahrirlashi mumkin"
          : "Фақат администраторлар тугунни таҳрирлаши мумкин",
      );
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
      const originalNode = nodes.find((node) => node.id === selectedNode?.id);
      setSelectedNode(originalNode ? { ...originalNode } : null);
      if (originalNode) {
        const consumers = nodeConsumers.find(
          (c) => c.nodeId === originalNode.id,
        );
        setSelectedNodeConsumers(
          consumers
            ? { ...consumers }
            : {
                population: "",
                budget: "",
                smallBusiness: "",
                industry: "",
                heatSource: "",
                agtks: "",
              },
        );
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
        const docRef = await addDoc(collection(db, "nodes"), {
          ...newNode,
          createdAt: new Date(),
        });
        const nodeId = docRef.id;

        await addDoc(collection(db, "node_consumers"), {
          nodeId: nodeId,
          nodeName: newNode.name,
          nodeNumber: newNode.nodeNumber,
          ...newConsumers,
          createdAt: new Date(),
        });

        await log(ActionTypes.NODE_CREATE, {
          nodeId: nodeId,
          nodeName: newNode.name,
          nodeNumber: newNode.nodeNumber,
          nodeType: newNode.nodeType,
          grsName: newNode.grsName,
          consumers: newConsumers,
        });

        toast.success(script === "latin" ? "Tugun qo'shildi" : "Тугун қўшилди");
      } else {
        await updateDoc(doc(db, "nodes", selectedNode.id), {
          ...selectedNode,
          updatedAt: new Date(),
        });

        const existingConsumer = nodeConsumers.find(
          (c) => c.nodeId === selectedNode.id,
        );

        const consumerData = {
          nodeId: selectedNode.id,
          nodeName: selectedNode.name,
          nodeNumber: selectedNode.nodeNumber,
          population: selectedNodeConsumers?.population || "",
          budget: selectedNodeConsumers?.budget || "",
          smallBusiness: selectedNodeConsumers?.smallBusiness || "",
          industry: selectedNodeConsumers?.industry || "",
          heatSource: selectedNodeConsumers?.heatSource || "",
          agtks: selectedNodeConsumers?.agtks || "",
          updatedAt: new Date(),
        };

        if (existingConsumer) {
          await updateDoc(
            doc(db, "node_consumers", existingConsumer.id),
            consumerData,
          );
        } else {
          await addDoc(collection(db, "node_consumers"), {
            ...consumerData,
            createdAt: new Date(),
          });
        }

        await log(ActionTypes.NODE_UPDATE, {
          nodeId: selectedNode.id,
          nodeName: selectedNode.name,
          nodeNumber: selectedNode.nodeNumber,
          nodeType: selectedNode.nodeType,
          grsName: selectedNode.grsName,
          consumers: selectedNodeConsumers,
        });

        toast.success(
          script === "latin" ? "Tugun yangilandi" : "Тугун янгиланди",
        );
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving node:", error);
      toast.error(translations.error);
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      toast.warning(
        script === "latin"
          ? "Faqat administratorlar tugunni o'chirishi mumkin"
          : "Фақат администраторлар тугунни ўчириши мумкин",
      );
      return;
    }
    setIsSaving(true);
    try {
      const nodeToDelete = selectedNode;

      await deleteDoc(doc(db, "nodes", selectedNode.id));

      const existingConsumer = nodeConsumers.find(
        (c) => c.nodeId === selectedNode.id,
      );
      if (existingConsumer) {
        await deleteDoc(doc(db, "node_consumers", existingConsumer.id));
      }

      await log(ActionTypes.NODE_DELETE, {
        nodeId: nodeToDelete.id,
        nodeName: nodeToDelete.name,
        nodeNumber: nodeToDelete.nodeNumber,
        nodeType: nodeToDelete.nodeType,
        grsName: nodeToDelete.grsName,
      });

      toast.success(script === "latin" ? "Tugun o'chirildi" : "Тугун ўчирилди");
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Error deleting node:", error);
      toast.error(translations.error);
      setIsSaving(false);
    }
  };

  const cleanCityName = (name) => {
    if (!name) return translations.notSpecified;
    return name.replace(/[()]/g, "").trim();
  };

  // Сортировка узлов: сначала по order ГРС, потом по номеру узла
  const getSortedNodes = () => {
    // Создаем карту для быстрого доступа к order ГРС
    const grsOrderMap = {};
    grsList.forEach((grs) => {
      grsOrderMap[grs.id] = grs.order || 999;
    });

    // Сначала фильтруем по поиску
    let filtered = nodes.filter(
      (node) =>
        node.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.nodeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.grsName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.cityName?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Сортируем: сначала по order ГРС, потом по номеру узла
    return filtered.sort((a, b) => {
      const orderA = grsOrderMap[a.grsId] || 999;
      const orderB = grsOrderMap[b.grsId] || 999;

      // Сначала сравниваем по order ГРС
      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Если order ГРС одинаковый, сравниваем по номеру узла (как числа)
      const numA = parseInt(a.nodeNumber) || 0;
      const numB = parseInt(b.nodeNumber) || 0;
      return numA - numB;
    });
  };

  const sortedFilteredNodes = getSortedNodes();

  const isFormValid = checkFormValidity();

  const nodeTypeOptions = [
    { value: "Ахоли", label: translations.nodeTypeOptions.population },
    { value: "Саноат", label: translations.nodeTypeOptions.industry },
  ];

  const subscaleOptions = [
    { value: "Мавжуд", label: translations.subscaleOptions.available },
    { value: "Мавжуд эмас", label: translations.subscaleOptions.notAvailable },
  ];

  const getNodeTypeLabel = (value) => {
    const option = nodeTypeOptions.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

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
            onClick={handleCreateNode}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium shadow-sm hover:shadow"
          >
            <Plus size={18} />
            {translations.addNode}
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
        {translations.total}: {sortedFilteredNodes.length}{" "}
        {translations.totalCount}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  {translations.grs}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.nodeNumber}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.name}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  {translations.nodeType}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">
                  {translations.city}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedFilteredNodes.map((node) => (
                <tr
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-150"
                >
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <Factory className="w-4 h-4 text-gray-400" />
                      <span>{node.grsName || translations.notSpecified}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Hash className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {node.nodeNumber || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {node.name || translations.notSpecified}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                      {getNodeTypeLabel(node.nodeType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden xl:table-cell">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{cleanCityName(node.cityName)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedFilteredNodes.length === 0 && (
          <div className="text-center py-12">
            <Link
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
                onClick={handleCreateNode}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                {translations.addNode}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Модальное окно для узла - без изменений */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={isSaving ? undefined : handleCloseModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden"
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
                {/* Основная информация */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {translations.grsLabel}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={
                        isCreating ? newNode.grsId : selectedNode?.grsId || ""
                      }
                      onChange={(e) => handleGrsChange(e.target.value)}
                      disabled={(!isCreating && !isEditMode) || isSaving}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <option value="">{translations.selectGrs}</option>
                      {grsList.map((grs) => (
                        <option key={grs.id} value={grs.id}>
                          {grs.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {translations.nodeNumberLabel}
                    </label>
                    <input
                      type="text"
                      value={
                        isCreating
                          ? newNode.nodeNumber
                          : selectedNode?.nodeNumber || ""
                      }
                      onChange={(e) => handleNodeNumberChange(e.target.value)}
                      disabled={(!isCreating && !isEditMode) || isSaving}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder={translations.nodeNumberLabel}
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {translations.nameLabel}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={
                        isCreating ? newNode.name : selectedNode?.name || ""
                      }
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      disabled={(!isCreating && !isEditMode) || isSaving}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder={translations.nameLabel}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {translations.nodeTypeLabel}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={
                        isCreating
                          ? newNode.nodeType
                          : selectedNode?.nodeType || ""
                      }
                      onChange={(e) =>
                        handleInputChange("nodeType", e.target.value)
                      }
                      disabled={(!isCreating && !isEditMode) || isSaving}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <option value="">{translations.selectNodeType}</option>
                      {nodeTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {translations.cityLabel}
                    </label>
                    <select
                      value={
                        isCreating ? newNode.cityId : selectedNode?.cityId || ""
                      }
                      onChange={(e) => handleCityChange(e.target.value)}
                      disabled={(!isCreating && !isEditMode) || isSaving}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <option value="">{translations.selectCity}</option>
                      {cities.map((city) => {
                        let typeName = "";
                        if (city.type === "shahar" || city.type === "Город") {
                          typeName = translations.city;
                        } else if (
                          city.type === "tuman" ||
                          city.type === "Район"
                        ) {
                          typeName = translations.district;
                        } else {
                          typeName = city.type || "";
                        }
                        const displayName = `${city.name} ${typeName}`.trim();
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
                      {translations.meterLabel}
                    </label>
                    <select
                      value={
                        isCreating
                          ? newNode.meterId
                          : selectedNode?.meterId || ""
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {translations.meterSerialLabel}
                    </label>
                    <input
                      type="text"
                      value={
                        isCreating
                          ? newNode.meterSerial
                          : selectedNode?.meterSerial || ""
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
                          ? newNode.subscale
                          : selectedNode?.subscale || ""
                      }
                      onChange={(e) =>
                        handleInputChange("subscale", e.target.value)
                      }
                      disabled={(!isCreating && !isEditMode) || isSaving}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <option value="">{translations.selectConsumer}</option>
                      {subscaleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Данные о потребителях */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <UsersIcon className="w-4 h-4" />
                    {translations.consumersData}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {translations.populationConsumers}
                      </label>
                      <input
                        type="text"
                        value={
                          isCreating
                            ? newConsumers.population
                            : selectedNodeConsumers?.population || ""
                        }
                        onChange={(e) =>
                          handleConsumerChange("population", e.target.value)
                        }
                        disabled={(!isCreating && !isEditMode) || isSaving}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="0"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {translations.budgetConsumers}
                      </label>
                      <input
                        type="text"
                        value={
                          isCreating
                            ? newConsumers.budget
                            : selectedNodeConsumers?.budget || ""
                        }
                        onChange={(e) =>
                          handleConsumerChange("budget", e.target.value)
                        }
                        disabled={(!isCreating && !isEditMode) || isSaving}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="0"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {translations.smallBusinessConsumers}
                      </label>
                      <input
                        type="text"
                        value={
                          isCreating
                            ? newConsumers.smallBusiness
                            : selectedNodeConsumers?.smallBusiness || ""
                        }
                        onChange={(e) =>
                          handleConsumerChange("smallBusiness", e.target.value)
                        }
                        disabled={(!isCreating && !isEditMode) || isSaving}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="0"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {translations.industryConsumers}
                      </label>
                      <input
                        type="text"
                        value={
                          isCreating
                            ? newConsumers.industry
                            : selectedNodeConsumers?.industry || ""
                        }
                        onChange={(e) =>
                          handleConsumerChange("industry", e.target.value)
                        }
                        disabled={(!isCreating && !isEditMode) || isSaving}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="0"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {translations.heatSourceConsumers}
                      </label>
                      <input
                        type="text"
                        value={
                          isCreating
                            ? newConsumers.heatSource
                            : selectedNodeConsumers?.heatSource || ""
                        }
                        onChange={(e) =>
                          handleConsumerChange("heatSource", e.target.value)
                        }
                        disabled={(!isCreating && !isEditMode) || isSaving}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="0"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {translations.agtksConsumers}
                      </label>
                      <input
                        type="text"
                        value={
                          isCreating
                            ? newConsumers.agtks
                            : selectedNodeConsumers?.agtks || ""
                        }
                        onChange={(e) =>
                          handleConsumerChange("agtks", e.target.value)
                        }
                        disabled={(!isCreating && !isEditMode) || isSaving}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="0"
                        inputMode="numeric"
                      />
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

export default Nodes;
