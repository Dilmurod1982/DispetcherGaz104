import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { X, Plus, Trash2, Save, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

const FundModal = ({
  isOpen,
  onClose,
  onSave,
  fundData,
  isEditing,
  translations,
  loading,
}) => {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    population: "",
    wholesale: "",
    losses: "",
    nodes: [],
    consumers: [],
  });
  const [existingFunds, setExistingFunds] = useState([]);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [allNodes, setAllNodes] = useState([]);
  const [allConsumers, setAllConsumers] = useState([]);
  const [allGrs, setAllGrs] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Загрузка всех данных при открытии
  useEffect(() => {
    if (isOpen) {
      loadAllData();
      loadExistingFunds();
    }
  }, [isOpen]);

  const loadAllData = async () => {
    setLoadingData(true);
    try {
      // Загружаем все ГРС для получения order
      const grsSnapshot = await getDocs(collection(db, "grs"));
      const grsData = grsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllGrs(grsData);

      // Загружаем все узлы
      const nodesSnapshot = await getDocs(collection(db, "nodes"));
      const nodesData = nodesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Сортируем узлы: сначала по order ГРС, потом по nodeNumber
      const sortedNodes = sortNodesByGrsOrder(nodesData, grsData);
      setAllNodes(sortedNodes);

      // Загружаем всех потребителей и сортируем по order
      const consumersSnapshot = await getDocs(collection(db, "consumers"));
      const consumersData = consumersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Сортируем потребителей по order
      const sortedConsumers = consumersData.sort((a, b) => {
        const orderA = parseInt(a.order) || 0;
        const orderB = parseInt(b.order) || 0;
        return orderA - orderB;
      });
      setAllConsumers(sortedConsumers);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoadingData(false);
    }
  };

  // Функция сортировки узлов по order ГРС, затем по nodeNumber
  const sortNodesByGrsOrder = (nodes, grsList) => {
    // Создаем карту order ГРС по id
    const grsOrderMap = {};
    grsList.forEach((grs) => {
      grsOrderMap[grs.id] = parseInt(grs.order) || 0;
    });

    return nodes.sort((a, b) => {
      // Сначала сортируем по order ГРС
      const orderA = grsOrderMap[a.grsId] || 0;
      const orderB = grsOrderMap[b.grsId] || 0;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Если order ГРС одинаковый, сортируем по nodeNumber
      const numA = parseInt(a.nodeNumber) || 0;
      const numB = parseInt(b.nodeNumber) || 0;
      return numA - numB;
    });
  };

  useEffect(() => {
    if (fundData && isEditing) {
      setFormData({
        year: fundData.year || new Date().getFullYear(),
        month: fundData.month || new Date().getMonth() + 1,
        population: fundData.population || "",
        wholesale: fundData.wholesale || "",
        losses: fundData.losses || "",
        nodes: fundData.nodes || [],
        consumers: fundData.consumers || [],
      });
      setSelectedMonth(fundData.month || new Date().getMonth() + 1);
      setSelectedYear(fundData.year || new Date().getFullYear());
    } else if (!isEditing && isOpen) {
      // При создании нового фонда - используем отсортированные данные
      const now = new Date();
      const nextMonth = now.getMonth() + 2;
      const year = nextMonth > 12 ? now.getFullYear() + 1 : now.getFullYear();
      const month = nextMonth > 12 ? 1 : nextMonth;
      setSelectedMonth(month);
      setSelectedYear(year);

      // Создаем список узлов с пустыми значениями (уже отсортирован)
      const nodesList = allNodes.map((node) => ({
        id: node.id,
        name: node.name || node.id,
        nodeNumber: node.nodeNumber || "",
        grsName: node.grsName || "",
        monthlyFund: "",
        dailyFund: 0,
      }));

      // Создаем список потребителей с пустыми значениями (уже отсортирован)
      const consumersList = allConsumers.map((consumer) => ({
        id: consumer.id,
        name: consumer.name || consumer.id,
        monthlyFund: "",
        dailyFund: 0,
      }));

      setFormData({
        year: year,
        month: month,
        population: "",
        wholesale: "",
        losses: "",
        nodes: nodesList,
        consumers: consumersList,
      });
    }
  }, [fundData, isEditing, isOpen, allNodes, allConsumers]);

  const loadExistingFunds = async () => {
    setCheckingExisting(true);
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
      setExistingFunds(fundsData);
    } catch (error) {
      console.error("Error loading existing funds:", error);
    } finally {
      setCheckingExisting(false);
    }
  };

  // Проверка существования фонда за выбранный месяц и год
  const checkFundExists = (year, month) => {
    return existingFunds.some(
      (fund) => fund.year === year && fund.month === month,
    );
  };

  // Получение количества дней в месяце
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  // Расчет ежедневного фонда
  const calculateDailyFund = (monthlyFund, daysInMonth) => {
    if (!monthlyFund || monthlyFund === 0 || daysInMonth === 0) return 0;
    return monthlyFund / daysInMonth;
  };

  // Проверка, можно ли редактировать (только если месяц еще не начался)
  const canEditFund = (year, month) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year > currentYear) return true;
    if (year === currentYear && month > currentMonth) return true;
    return false;
  };

  // Форматирование числа с разделением на разряды (для отображения)
  const formatNumber = (num) => {
    if (num === undefined || num === null || num === "") return "";
    const strNum = String(num).replace(/\s/g, "");
    if (strNum === "" || isNaN(strNum)) return "";
    return strNum.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Получение числового значения из строки с пробелами
  const parseNumber = (str) => {
    if (str === undefined || str === null || str === "") return 0;
    if (typeof str === "number") return str;
    const cleaned = String(str).replace(/\s/g, "");
    return parseFloat(cleaned) || 0;
  };

  // Получение отображаемого значения для поля ввода
  const getDisplayValue = (value) => {
    if (value === undefined || value === null || value === "") return "";
    if (typeof value === "number") return formatNumber(value);
    return formatNumber(value);
  };

  // Обновление данных узлов
  const handleNodeChange = (index, field, value) => {
    const updatedNodes = [...formData.nodes];

    // Только поле monthlyFund редактируется
    if (field === "monthlyFund") {
      // Для числовых полей - убираем пробелы и сохраняем
      const cleanedValue = value.replace(/\s/g, "");
      const onlyDigits = cleanedValue.replace(/\D/g, "");

      // Форматируем для отображения с пробелами
      const formattedValue = onlyDigits === "" ? "" : formatNumber(onlyDigits);

      updatedNodes[index] = {
        ...updatedNodes[index],
        monthlyFund: formattedValue,
      };

      // Обновляем dailyFund
      const days = getDaysInMonth(selectedYear, selectedMonth);
      const numericValue = parseNumber(onlyDigits);
      const dailyValue =
        numericValue && numericValue > 0 && days > 0 ? numericValue / days : 0;
      updatedNodes[index].dailyFund = dailyValue;
    }

    setFormData((prev) => ({ ...prev, nodes: updatedNodes }));
  };

  // Обновление данных потребителей
  const handleConsumerChange = (index, field, value) => {
    const updatedConsumers = [...formData.consumers];

    // Только поле monthlyFund редактируется
    if (field === "monthlyFund") {
      // Для числовых полей - убираем пробелы и сохраняем
      const cleanedValue = value.replace(/\s/g, "");
      const onlyDigits = cleanedValue.replace(/\D/g, "");

      // Форматируем для отображения с пробелами
      const formattedValue = onlyDigits === "" ? "" : formatNumber(onlyDigits);

      updatedConsumers[index] = {
        ...updatedConsumers[index],
        monthlyFund: formattedValue,
      };

      // Обновляем dailyFund
      const days = getDaysInMonth(selectedYear, selectedMonth);
      const numericValue = parseNumber(onlyDigits);
      const dailyValue =
        numericValue && numericValue > 0 && days > 0 ? numericValue / days : 0;
      updatedConsumers[index].dailyFund = dailyValue;
    }

    setFormData((prev) => ({ ...prev, consumers: updatedConsumers }));
  };

  const handleSubmit = async () => {
    // Проверка на существование фонда
    if (!isEditing && checkFundExists(selectedYear, selectedMonth)) {
      toast.warning(
        translations.fundExists ||
          `Фонд на ${selectedYear}-${selectedMonth} уже существует`,
      );
      return;
    }

    // Проверка на возможность редактирования
    if (isEditing && !canEditFund(formData.year, formData.month)) {
      toast.warning(
        translations.cannotEdit ||
          "Нельзя редактировать фонд за прошедший или текущий месяц",
      );
      return;
    }

    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

    // Подготовка данных узлов для сохранения (убираем пробелы)
    const nodesForSave = formData.nodes.map((node) => {
      const monthlyValue = parseNumber(node.monthlyFund);

      return {
        name: node.name || "",
        nodeNumber: node.nodeNumber || "",
        grsName: node.grsName || "",
        monthlyFund: monthlyValue,
        dailyFund: calculateDailyFund(monthlyValue, daysInMonth),
      };
    });

    // Подготовка данных потребителей для сохранения (убираем пробелы)
    const consumersForSave = formData.consumers.map((consumer) => {
      const monthlyValue = parseNumber(consumer.monthlyFund);

      return {
        name: consumer.name || "",
        monthlyFund: monthlyValue,
        dailyFund: calculateDailyFund(monthlyValue, daysInMonth),
      };
    });

    // Подготовка основных показателей (убираем пробелы)
    const populationValue = parseNumber(formData.population);
    const wholesaleValue = parseNumber(formData.wholesale);
    const lossesValue = parseNumber(formData.losses);

    const dataToSave = {
      year: selectedYear,
      month: selectedMonth,
      population: populationValue,
      wholesale: wholesaleValue,
      losses: lossesValue,
      nodes: nodesForSave,
      consumers: consumersForSave,
      daysInMonth: daysInMonth,
      updatedAt: new Date(),
    };

    if (!isEditing) {
      dataToSave.createdAt = new Date();
    }

    onSave(dataToSave);
  };

  // Функция для отображения dailyFund с форматированием
  const formatDailyFund = (value) => {
    if (value === undefined || value === null) return "0.00";
    return formatNumber(value.toFixed(2));
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

  if (!isOpen) return null;

  const fundExists = checkFundExists(selectedYear, selectedMonth);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing
              ? translations.editFundTitle
              : translations.createFundTitle}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                {translations.loading || "Загрузка..."}
              </span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.year} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => {
                      const year = parseInt(e.target.value);
                      setSelectedYear(year);
                      setFormData((prev) => ({ ...prev, year }));
                    }}
                    disabled={isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
                    min={2000}
                    max={2100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.month} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      const month = parseInt(e.target.value);
                      setSelectedMonth(month);
                      setFormData((prev) => ({ ...prev, month }));
                    }}
                    disabled={isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1, 1).toLocaleString("ru-RU", {
                          month: "long",
                        })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.daysInMonth}
                  </label>
                  <input
                    type="text"
                    value={daysInMonth}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {!isEditing && fundExists && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-yellow-700 dark:text-yellow-300">
                    {translations.fundExists ||
                      `Фонд на ${selectedYear}-${selectedMonth} уже существует`}
                  </p>
                </div>
              )}

              {/* Основные показатели */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.population || "Население"}
                  </label>
                  <input
                    type="text"
                    value={getDisplayValue(formData.population)}
                    onChange={(e) => {
                      const value = e.target.value;
                      const onlyDigits = value.replace(/\D/g, "");
                      const formatted =
                        onlyDigits === "" ? "" : formatNumber(onlyDigits);
                      setFormData((prev) => ({
                        ...prev,
                        population: formatted,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield]"
                    placeholder="0"
                    inputMode="numeric"
                    tabIndex="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.wholesale || "Оптовики"}
                  </label>
                  <input
                    type="text"
                    value={getDisplayValue(formData.wholesale)}
                    onChange={(e) => {
                      const value = e.target.value;
                      const onlyDigits = value.replace(/\D/g, "");
                      const formatted =
                        onlyDigits === "" ? "" : formatNumber(onlyDigits);
                      setFormData((prev) => ({
                        ...prev,
                        wholesale: formatted,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield]"
                    placeholder="0"
                    inputMode="numeric"
                    tabIndex="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.losses || "Потери"}
                  </label>
                  <input
                    type="text"
                    value={getDisplayValue(formData.losses)}
                    onChange={(e) => {
                      const value = e.target.value;
                      const onlyDigits = value.replace(/\D/g, "");
                      const formatted =
                        onlyDigits === "" ? "" : formatNumber(onlyDigits);
                      setFormData((prev) => ({ ...prev, losses: formatted }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield]"
                    placeholder="0"
                    inputMode="numeric"
                    tabIndex="3"
                  />
                </div>
              </div>

              {/* Узлы - только поле Месячный фонд редактируется */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {translations.nodes || "Узлы"}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          №
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {translations.grs || "ГТШ"}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {translations.nodeName || "Тугун номи"}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {translations.nodeNumber || "Тугун рақами"}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {translations.monthlyFund || "Месячный фонд"}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {translations.dailyFund || "Суточный фонд"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {formData.nodes.map((node, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={node.grsName || ""}
                              disabled
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
                              placeholder="ГТШ"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={node.name || ""}
                              disabled
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
                              placeholder={translations.nodeName}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={node.nodeNumber || ""}
                              disabled
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
                              placeholder={translations.nodeNumber}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={node.monthlyFund}
                              onChange={(e) => {
                                handleNodeChange(
                                  index,
                                  "monthlyFund",
                                  e.target.value,
                                );
                              }}
                              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm [appearance:textfield]"
                              placeholder="0"
                              inputMode="numeric"
                              tabIndex={4 + index}
                            />
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            {node.dailyFund !== undefined &&
                            node.dailyFund !== null
                              ? formatDailyFund(node.dailyFund)
                              : "0.00"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Потребители - только поле Месячный фонд редактируется */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {translations.consumers || "Истеъмолчилар"}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          №
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {translations.consumerName || "Истеъмолчи номи"}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {translations.monthlyFund || "Месячный фонд"}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {translations.dailyFund || "Суточный фонд"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {formData.consumers.map((consumer, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={consumer.name || ""}
                              disabled
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
                              placeholder={translations.consumerName}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={consumer.monthlyFund}
                              onChange={(e) => {
                                handleConsumerChange(
                                  index,
                                  "monthlyFund",
                                  e.target.value,
                                );
                              }}
                              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm [appearance:textfield]"
                              placeholder="0"
                              inputMode="numeric"
                              tabIndex={4 + formData.nodes.length + index}
                            />
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            {consumer.dailyFund !== undefined &&
                            consumer.dailyFund !== null
                              ? formatDailyFund(consumer.dailyFund)
                              : "0.00"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
          >
            {translations.cancel}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || (!isEditing && fundExists) || loadingData}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
              loading || (!isEditing && fundExists) || loadingData
                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
            }`}
          >
            {loading ? (
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
        </div>
      </div>
    </div>
  );
};

export default FundModal;
