import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle, Clock, Calendar } from "lucide-react";
import useLanguageStore from "../../store/languageStore";
import useLogger from "../../hooks/useLogger";
import { ActionTypes } from "../../services/logger";
import { toast } from "react-toastify";

const EditReportModal = ({ isOpen, onClose, reportData, onSave, loading }) => {
  const { script } = useLanguageStore();
  const { log } = useLogger();
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});

  const translations = {
    title: script === "latin" ? "Hisobotni tahrirlash" : "Ҳисоботни таҳрирлаш",
    close: "×",
    save: script === "latin" ? "Saqlash" : "Сақлаш",
    saving: script === "latin" ? "Saqlanmoqda..." : "Сақланмоқда...",
    cancel: script === "latin" ? "Bekor qilish" : "Бекор қилиш",
    daily: script === "latin" ? "Kunlik" : "Кунлик",
    sixHour: script === "latin" ? "6 soatlik" : "6 соатлик",
    twoHour: script === "latin" ? "2 soatlik" : "2 соатлик",
    grs: "ГТШ",
    nodes: script === "latin" ? "Tugunlar" : "Тугунлар",
    interdistrict:
      script === "latin"
        ? "Tumanlararo hisoblagichlar"
        : "Туманлараро ҳисоблагичлар",
    consumers: script === "latin" ? "Iste'molchilar" : "Истеъмолчилар",
    grp: "ГТҚ",
    flow: script === "latin" ? "Sarfi (m³)" : "Сарфи (м³)",
    pressureIn:
      script === "latin" ? "Kirish bosimi (kgc/s²)" : "Кириш босими (кгс/с²)",
    pressureOut:
      script === "latin" ? "Chiqish bosimi (kgc/s²)" : "Чиқиш босими (кгс/с²)",
    noData: script === "latin" ? "Ma'lumot yo'q" : "Маълумот йўқ",
    totalPopulation:
      script === "latin" ? "Aholi umumiy sarfi" : "Аҳоли умумий сарфи",
    totalWholesale:
      script === "latin" ? "Ulgurji umumiy sarfi" : "Улгуржи умумий сарфи",
    losses: script === "latin" ? "Yo'qotishlar" : "Йўқотишлар",
  };

  // Определение полей для каждой категории
  const getCategoryFields = (category) => {
    const fields = {
      grs: ["flow", "pressureIn", "pressureOut"],
      nodes: ["flow", "pressureIn", "pressureOut"],
      interdistrict: ["flow", "pressureIn", "pressureOut"],
      consumers: ["flow"],
      grp: ["pressureIn", "pressureOut"],
    };
    return fields[category] || [];
  };

  useEffect(() => {
    if (reportData) {
      setFormData(reportData.data || {});
      setOriginalData(reportData.data || {});
    }
  }, [reportData]);

  const handleInputChange = (category, id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [id]: {
          ...prev[category]?.[id],
          [field]: value,
        },
      },
    }));
  };

  const handleTotalsChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      totals: {
        ...prev.totals,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    const hasChanges =
      JSON.stringify(formData) !== JSON.stringify(originalData);
    if (!hasChanges) {
      toast.warning(
        script === "latin"
          ? "Hech qanday o'zgarish yo'q"
          : "Ҳеч қандай ўзгариш йўқ",
      );
      return;
    }

    await log(ActionTypes.REPORT_EDITED, {
      reportId: reportData.id,
      reportDate: reportData.date,
      reportHour: reportData.hour,
      reportType: reportData.type,
      regionName: reportData.regionName,
      oldData: originalData,
      newData: formData,
      changes: {
        hasChanges: true,
      },
    });

    await onSave(formData);
  };

  if (!isOpen || !reportData) return null;

  const categories = [
    { key: "grs", label: translations.grs },
    { key: "nodes", label: translations.nodes },
    { key: "interdistrict", label: translations.interdistrict },
    { key: "consumers", label: translations.consumers },
    { key: "grp", label: translations.grp },
  ];

  const isDailyReport = reportData.type === "daily";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {translations.title}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {reportData.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {reportData.hour}:00
              </span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {reportData.type === "daily"
                  ? translations.daily
                  : reportData.type === "six_hour"
                    ? translations.sixHour
                    : translations.twoHour}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                    {translations.grs}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[180px]">
                    {script === "latin" ? "Obyekt" : "Объект"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                    {translations.flow}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                    {translations.pressureIn}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                    {translations.pressureOut}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {categories.map((cat) => {
                  const categoryData = formData[cat.key] || {};
                  const items = Object.keys(categoryData);
                  if (items.length === 0) return null;

                  const fields = getCategoryFields(cat.key);

                  return items.map((id) => {
                    const item = categoryData[id];
                    const displayName = item.displayName || item.name || id;

                    return (
                      <tr
                        key={`${cat.key}_${id}`}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {cat.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {displayName}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {fields.includes("flow") ? (
                            <input
                              type="number"
                              step="0.01"
                              value={
                                item.flow !== undefined && item.flow !== null
                                  ? item.flow
                                  : ""
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  cat.key,
                                  id,
                                  "flow",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-28 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                              placeholder="0.00"
                            />
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {fields.includes("pressureIn") ? (
                            <input
                              type="number"
                              step="0.01"
                              value={
                                item.pressureIn !== undefined &&
                                item.pressureIn !== null
                                  ? item.pressureIn
                                  : ""
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  cat.key,
                                  id,
                                  "pressureIn",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-28 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                              placeholder="0.00"
                            />
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {fields.includes("pressureOut") ? (
                            <input
                              type="number"
                              step="0.01"
                              value={
                                item.pressureOut !== undefined &&
                                item.pressureOut !== null
                                  ? item.pressureOut
                                  : ""
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  cat.key,
                                  id,
                                  "pressureOut",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-28 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                              placeholder="0.00"
                            />
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>

          {/* Суточные итоги */}
          {isDailyReport && formData.totals && (
            <div className="mt-4 p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-3">
                {script === "latin"
                  ? "Kunlik qo'shimcha ma'lumotlar"
                  : "Кунлик қўшимча маълумотлар"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {translations.totalPopulation}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={
                      formData.totals.totalPopulation !== undefined &&
                      formData.totals.totalPopulation !== null
                        ? formData.totals.totalPopulation
                        : ""
                    }
                    onChange={(e) =>
                      handleTotalsChange(
                        "totalPopulation",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {translations.totalWholesale}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={
                      formData.totals.totalWholesale !== undefined &&
                      formData.totals.totalWholesale !== null
                        ? formData.totals.totalWholesale
                        : ""
                    }
                    onChange={(e) =>
                      handleTotalsChange(
                        "totalWholesale",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {translations.losses}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={
                      formData.totals.losses !== undefined &&
                      formData.totals.losses !== null
                        ? formData.totals.losses
                        : ""
                    }
                    onChange={(e) =>
                      handleTotalsChange(
                        "losses",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex flex-wrap gap-3 justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            {translations.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              loading
                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
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

export default EditReportModal;
