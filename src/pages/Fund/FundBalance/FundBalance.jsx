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
import { db } from "../../../firebase/config";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Factory,
  Users,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import useLanguageStore from "../../../store/languageStore";
import useAuthStore from "../../../store/authStore";
import useLogger from "../../../hooks/useLogger";
import { ActionTypes } from "../../../services/logger";
import { toast } from "react-toastify";
import FundModal from "../../../components/Fund/FundBalance/FundModal";

const FundBalance = () => {
  const { script } = useLanguageStore();
  const { userData } = useAuthStore();
  const { log } = useLogger();
  const [funds, setFunds] = useState([]);
  const [selectedFund, setSelectedFund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFund, setExpandedFund] = useState(null);

  // Проверка прав доступа
  const canEdit = userData?.role === "admin" || userData?.role === "vil_disp";

  const translations = {
    title: script === "latin" ? "Fond balansi" : "Фонд баланси",
    subtitle:
      script === "latin"
        ? "Oylik fond balanslarini boshqarish"
        : "Ойлик фонд балансларини бошқариш",
    createFund: script === "latin" ? "Yangi fond yaratish" : "Янги фонд яратиш",
    search: script === "latin" ? "Qidirish..." : "Қидириш...",
    searchPlaceholder:
      script === "latin"
        ? "Yil yoki oy bo'yicha qidirish"
        : "Йил ёки ой бўйича қидириш",
    year: script === "latin" ? "Yil" : "Йил",
    month: script === "latin" ? "Oy" : "Ой",
    population: script === "latin" ? "Aholi" : "Аҳоли",
    wholesale: script === "latin" ? "Ulgurji" : "Улгуржи",
    losses: script === "latin" ? "Yo'qotishlar" : "Йўқотишлар",
    nodes: script === "latin" ? "Tugunlar" : "Тугунлар",
    consumers: script === "latin" ? "Iste'molchilar" : "Истеъмолчилар",
    name: script === "latin" ? "Nomi" : "Номи",
    monthlyFund: script === "latin" ? "Oylik fond" : "Ойлик фонд",
    dailyFund: script === "latin" ? "Kunlik fond" : "Кунлик фонд",
    actions: script === "latin" ? "Harakatlar" : "Ҳаракатлар",
    edit: script === "latin" ? "Tahrirlash" : "Таҳрирлаш",
    delete: script === "latin" ? "O'chirish" : "Ўчириш",
    view: script === "latin" ? "Ko'rish" : "Кўриш",
    noData: script === "latin" ? "Ma'lumot topilmadi" : "Маълумот топилмади",
    noFunds:
      script === "latin"
        ? "Hozircha fondlar mavjud emas"
        : "Ҳозирча фондлар мавжуд эмас",
    startAdding:
      script === "latin" ? "Birinchi fondni yaratish" : "Биринчи фондни яратиш",
    total: script === "latin" ? "Jami" : "Жами",
    totalCount: script === "latin" ? "ta fond" : "та фонд",
    deleteConfirm:
      script === "latin" ? "O'chirishni tasdiqlang" : "Ўчиришни тасдиқланг",
    deleteWarning:
      script === "latin"
        ? "Ushbu fondni o'chirishni xohlaysizmi?"
        : "Ушбу фондни ўчиришни хоҳлайсизми?",
    deleteYes: script === "latin" ? "Ha, o'chirish" : "Ҳа, ўчириш",
    deleteNo: script === "latin" ? "Yo'q" : "Йўқ",
    noPermission:
      script === "latin"
        ? "Faqat administrator va viloyat dispetcherlari fond yaratishi mumkin"
        : "Фақат администратор ва вилоят диспетчерлари фонд яратиши мумкин",
    daysInMonth:
      script === "latin" ? "Oydagi kunlar soni" : "Ойдаги кунлар сони",
  };

  useEffect(() => {
    loadFunds();
  }, []);

  const loadFunds = async () => {
    setLoading(true);
    try {
      const fundsQuery = query(
        collection(db, "funds"),
        orderBy("year", "desc"),
        orderBy("month", "desc"),
      );
      const snapshot = await getDocs(fundsQuery);
      const fundsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFunds(fundsData);
    } catch (error) {
      console.error("Error loading funds:", error);
      toast.error(
        script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFund = () => {
    if (!canEdit) {
      toast.warning(translations.noPermission);
      return;
    }
    setIsEditing(false);
    setSelectedFund(null);
    setIsModalOpen(true);
  };

  const handleEditFund = (fund) => {
    if (!canEdit) {
      toast.warning(translations.noPermission);
      return;
    }
    setSelectedFund(fund);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteFund = async (fund) => {
    if (!canEdit) {
      toast.warning(translations.noPermission);
      return;
    }

    if (!window.confirm(translations.deleteWarning)) return;

    try {
      await deleteDoc(doc(db, "funds", fund.id));
      await log(ActionTypes.FUND_DELETE, {
        fundId: fund.id,
        year: fund.year,
        month: fund.month,
      });
      toast.success(script === "latin" ? "Fond o'chirildi" : "Фонд ўчирилди");
      await loadFunds();
    } catch (error) {
      console.error("Error deleting fund:", error);
      toast.error(
        script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
      );
    }
  };

  const handleSaveFund = async (data) => {
    setIsSaving(true);
    try {
      if (isEditing && selectedFund) {
        await updateDoc(doc(db, "funds", selectedFund.id), data);
        await log(ActionTypes.FUND_UPDATE, {
          fundId: selectedFund.id,
          year: data.year,
          month: data.month,
        });
        toast.success(
          script === "latin" ? "Fond yangilandi" : "Фонд янгиланди",
        );
      } else {
        await addDoc(collection(db, "funds"), data);
        await log(ActionTypes.FUND_CREATE, {
          year: data.year,
          month: data.month,
        });
        toast.success(script === "latin" ? "Fond yaratildi" : "Фонд яратилди");
      }
      setIsModalOpen(false);
      setSelectedFund(null);
      await loadFunds();
    } catch (error) {
      console.error("Error saving fund:", error);
      toast.error(
        script === "latin" ? "Xatolik yuz berdi" : "Хатолик юз берди",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getMonthName = (month) => {
    return new Date(2000, month - 1, 1).toLocaleString("ru-RU", {
      month: "long",
    });
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const filteredFunds = funds.filter(
    (fund) =>
      fund.year?.toString().includes(searchTerm) ||
      getMonthName(fund.month)
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const toggleExpand = (fundId) => {
    setExpandedFund(expandedFund === fundId ? null : fundId);
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
        {canEdit && (
          <button
            onClick={handleCreateFund}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium shadow-sm hover:shadow"
          >
            <Plus size={18} />
            {translations.createFund}
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
        {translations.total}: {filteredFunds.length} {translations.totalCount}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.year}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.month}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.population}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  {translations.wholesale}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  {translations.losses}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">
                  {translations.daysInMonth}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFunds.map((fund) => (
                <React.Fragment key={fund.id}>
                  <tr
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-150"
                    onClick={() => toggleExpand(fund.id)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {fund.year}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {getMonthName(fund.month)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {formatNumber(fund.population)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden md:table-cell">
                      {formatNumber(fund.wholesale)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                      {formatNumber(fund.losses)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden xl:table-cell">
                      {fund.daysInMonth}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditFund(fund);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title={translations.edit}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFund(fund);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title={translations.delete}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(fund.id);
                          }}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          {expandedFund === fund.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedFund === fund.id && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-4 bg-gray-50 dark:bg-gray-700/30"
                      >
                        <div className="space-y-4">
                          {/* Узлы */}
                          {fund.nodes && fund.nodes.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <Factory className="w-4 h-4" />
                                {translations.nodes}
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-100 dark:bg-gray-700/50">
                                    <tr>
                                      <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                        №
                                      </th>
                                      <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {translations.name}
                                      </th>
                                      <th className="px-3 py-1.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {translations.monthlyFund}
                                      </th>
                                      <th className="px-3 py-1.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {translations.dailyFund}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {fund.nodes.map((node, index) => (
                                      <tr key={index}>
                                        <td className="px-3 py-1.5 text-gray-500 dark:text-gray-400">
                                          {index + 1}
                                        </td>
                                        <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">
                                          {node.name || "-"}
                                        </td>
                                        <td className="px-3 py-1.5 text-right text-gray-600 dark:text-gray-300">
                                          {formatNumber(node.monthlyFund)}
                                        </td>
                                        <td className="px-3 py-1.5 text-right text-gray-600 dark:text-gray-300">
                                          {formatNumber(
                                            node.dailyFund?.toFixed(2) || 0,
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Потребители */}
                          {fund.consumers && fund.consumers.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {translations.consumers}
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-100 dark:bg-gray-700/50">
                                    <tr>
                                      <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                        №
                                      </th>
                                      <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {translations.name}
                                      </th>
                                      <th className="px-3 py-1.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {translations.monthlyFund}
                                      </th>
                                      <th className="px-3 py-1.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {translations.dailyFund}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {fund.consumers.map((consumer, index) => (
                                      <tr key={index}>
                                        <td className="px-3 py-1.5 text-gray-500 dark:text-gray-400">
                                          {index + 1}
                                        </td>
                                        <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">
                                          {consumer.name || "-"}
                                        </td>
                                        <td className="px-3 py-1.5 text-right text-gray-600 dark:text-gray-300">
                                          {formatNumber(consumer.monthlyFund)}
                                        </td>
                                        <td className="px-3 py-1.5 text-right text-gray-600 dark:text-gray-300">
                                          {formatNumber(
                                            consumer.dailyFund?.toFixed(2) || 0,
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {(!fund.nodes || fund.nodes.length === 0) &&
                            (!fund.consumers ||
                              fund.consumers.length === 0) && (
                              <p className="text-sm text-gray-400 dark:text-gray-500">
                                {translations.noData}
                              </p>
                            )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFunds.length === 0 && (
          <div className="text-center py-12">
            <DollarSign
              className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
              size={48}
            />
            <h3 className="text-base font-medium text-gray-600 dark:text-gray-400 mb-1">
              {searchTerm ? translations.noData : translations.noFunds}
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {searchTerm
                ? translations.searchPlaceholder
                : translations.startAdding}
            </p>
            {!searchTerm && canEdit && (
              <button
                onClick={handleCreateFund}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                {translations.createFund}
              </button>
            )}
          </div>
        )}
      </div>

      <FundModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFund(null);
        }}
        onSave={handleSaveFund}
        fundData={selectedFund}
        isEditing={isEditing}
        translations={translations}
        loading={isSaving}
      />
    </div>
  );
};

export default FundBalance;
