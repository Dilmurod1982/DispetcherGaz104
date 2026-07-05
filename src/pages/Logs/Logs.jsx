import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Calendar, User, Activity, Search, Eye } from "lucide-react";
import useLanguageStore from "../../store/languageStore";

const Logs = () => {
  const { script } = useLanguageStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const translations = {
    title: script === "latin" ? "Amallar jurnali" : "Амаллар журнали",
    action: script === "latin" ? "Harakat" : "Ҳаракат",
    user: script === "latin" ? "Foydalanuvchi" : "Фойдаланувчи",
    time: script === "latin" ? "Vaqt" : "Вақт",
    details: script === "latin" ? "Tafsilotlar" : "Тафсилотлар",
    noLogs: script === "latin" ? "Jurnal bo'sh" : "Журнал бўш",
    close: script === "latin" ? "Yopish" : "Ёпиш",
    viewDetails: script === "latin" ? "Batafsil" : "Батафсил",
    allDetails: script === "latin" ? "Barcha tafsilotlar" : "Барча тафсилотлар",
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const logsRef = collection(db, "logs");
      const q = query(logsRef, orderBy("timestamp", "desc"), limit(500));
      const snapshot = await getDocs(q);
      const logsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLogs(logsData);
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const actionLabels = {
    // Регионы
    region_create: "Область создана",
    region_update: "Область обновлена",
    region_delete: "Область удалена",
    // Города
    city_create: "Город создан",
    city_update: "Город обновлен",
    city_delete: "Город удален",
    // ГРС
    grs_create: "ГРС создана",
    grs_update: "ГРС обновлена",
    grs_delete: "ГРС удалена",
    // Узлы
    node_create: "Узел создан",
    node_update: "Узел обновлен",
    node_delete: "Узел удален",
    // Межрайонные
    interdistrict_create: "Межрайонный счетчик создан",
    interdistrict_update: "Межрайонный счетчик обновлен",
    interdistrict_delete: "Межрайонный счетчик удален",
    // ГРП
    grp_create: "ГРП создан",
    grp_update: "ГРП обновлен",
    grp_delete: "ГРП удален",
    // Потребители
    consumer_create: "Потребитель создан",
    consumer_update: "Потребитель обновлен",
    consumer_delete: "Потребитель удален",
    // Пользователи
    user_create: "Пользователь создан",
    user_update: "Пользователь обновлен",
    user_delete: "Пользователь удален",
    user_login: "Вход в систему",
    user_logout: "Выход из системы",
  };

  // Функция для получения читаемого описания деталей
  const getDetailsDescription = (log) => {
    const details = log.details || {};
    const actionType = log.actionType;

    switch (actionType) {
      case "consumer_create":
        return details.consumerName || "Consumer created";
      case "consumer_update":
        return (
          details.consumerName || `Consumer ${details.consumerId || ""} updated`
        );
      case "consumer_delete":
        return (
          details.consumerName || `Consumer ${details.consumerId || ""} deleted`
        );

      case "region_create":
        return details.regionName || "Region created";
      case "region_update":
        return details.regionName || `Region ${details.regionId || ""} updated`;
      case "region_delete":
        return details.regionName || `Region ${details.regionId || ""} deleted`;

      case "city_create":
        return details.cityName || "City created";
      case "city_update":
        return details.cityName || `City ${details.cityId || ""} updated`;
      case "city_delete":
        return details.cityName || `City ${details.cityId || ""} deleted`;

      case "grs_create":
        return details.grsName || "GRS created";
      case "grs_update":
        return details.grsName || `GRS ${details.grsId || ""} updated`;
      case "grs_delete":
        return details.grsName || `GRS ${details.grsId || ""} deleted`;

      case "node_create":
        return details.nodeName || "Node created";
      case "node_update":
        return details.nodeName || `Node ${details.nodeId || ""} updated`;
      case "node_delete":
        return details.nodeName || `Node ${details.nodeId || ""} deleted`;

      case "interdistrict_create":
        return details.itemName || "Interdistrict created";
      case "interdistrict_update":
        return (
          details.itemName || `Interdistrict ${details.itemId || ""} updated`
        );
      case "interdistrict_delete":
        return (
          details.itemName || `Interdistrict ${details.itemId || ""} deleted`
        );

      case "grp_create":
        return details.grpName || "GRP created";
      case "grp_update":
        return details.grpName || `GRP ${details.grpId || ""} updated`;
      case "grp_delete":
        return details.grpName || `GRP ${details.grpId || ""} deleted`;

      case "user_login":
        return details.success ? "Muvaffaqiyatli" : "Muvaffaqiyatsiz";
      case "user_logout":
        return "Chiqish";

      default:
        // Если есть поле name или название объекта
        if (details.name) return details.name;
        if (details.consumerName) return details.consumerName;
        if (details.regionName) return details.regionName;
        if (details.cityName) return details.cityName;
        if (details.grsName) return details.grsName;
        if (details.nodeName) return details.nodeName;
        if (details.grpName) return details.grpName;
        if (details.itemName) return details.itemName;
        return "No details";
    }
  };

  // Функция для получения полного JSON деталей
  const getFullDetails = (log) => {
    return JSON.stringify(log.details || {}, null, 2);
  };

  const filteredLogs = logs.filter((log) => {
    const search = searchTerm.toLowerCase();
    const actionLabel = actionLabels[log.actionType] || log.actionType;
    const detailsText = getDetailsDescription(log).toLowerCase();
    const userEmail = log.user?.email?.toLowerCase() || "";

    return (
      actionLabel.toLowerCase().includes(search) ||
      detailsText.includes(search) ||
      userEmail.includes(search)
    );
  });

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
            {script === "latin"
              ? "Barcha amallar ro'yxati"
              : "Барча амаллар рўйхати"}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder={script === "latin" ? "Qidirish..." : "Қидириш..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.action}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  {translations.user}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  {translations.time}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.details}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.viewDetails}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {actionLabels[log.actionType] || log.actionType}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{log.user?.email || "Noma'lum"}</span>
                      {log.user?.role && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          ({log.user.role})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {log.timestamp?.toDate?.()?.toLocaleString() ||
                          "Noma'lum"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-[200px] truncate">
                    {getDetailsDescription(log)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedLog(log);
                        setIsDetailModalOpen(true);
                      }}
                      className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title={translations.viewDetails}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Activity
              className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
              size={48}
            />
            <h3 className="text-base font-medium text-gray-600 dark:text-gray-400">
              {translations.noLogs}
            </h3>
          </div>
        )}
      </div>

      {/* Модальное окно для просмотра деталей */}
      {isDetailModalOpen && selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {translations.allDetails}
              </h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.action}
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {actionLabels[selectedLog.actionType] ||
                      selectedLog.actionType}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.user}
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedLog.user?.email || "Noma'lum"}
                    {selectedLog.user?.role && ` (${selectedLog.user.role})`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.time}
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedLog.timestamp?.toDate?.()?.toLocaleString() ||
                      "Noma'lum"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations.details}
                  </label>
                  <pre className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-sm text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap">
                    {getFullDetails(selectedLog)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                {translations.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logs;
