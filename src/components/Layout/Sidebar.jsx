import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  FiHome,
  FiMap,
  FiChevronDown,
  FiChevronRight,
  FiActivity,
  FiFileText,
  FiUsers,
  FiLogOut,
  FiLayers,
  FiBox,
  FiGlobe,
  FiSliders,
  FiFolder,
  FiCalendar,
  FiClipboard,
  FiDatabase,
  FiBarChart2,
  FiEdit,
  FiUserPlus,
  FiList,
  FiTag,
  FiFile,
  FiDollarSign, // Добавлен для иконки Фондлар
  FiPieChart, // Для подпунктов
  FiTrendingUp,
} from "react-icons/fi";
import useLanguageStore from "../../store/languageStore";
import useAuthStore from "../../store/authStore";

const Sidebar = ({ isOpen, onClose }) => {
  const { script } = useLanguageStore();
  const { logout, isAdmin, isDilik, userData } = useAuthStore();
  const navigate = useNavigate();

  const [openRegions, setOpenRegions] = useState(false);
  const [openDataPoints, setOpenDataPoints] = useState(false);
  const [openReports, setOpenReports] = useState(false);
  const [openViewReports, setOpenViewReports] = useState(false);
  const [openConsumers, setOpenConsumers] = useState(false);
  const [openFunds, setOpenFunds] = useState(false); // Новое состояние для Фондлар

  const userIsAdmin = isAdmin();
  const userIsDilik = isDilik();
  const userRole = userData?.role;

  const translations = {
    dashboard: script === "latin" ? "Boshqaruv paneli" : "Бошқарув панели",
    regions: script === "latin" ? "Xududlar" : "Ҳудудлар",
    viloyat: script === "latin" ? "Viloyat" : "Вилоят",
    districts: script === "latin" ? "Tuman/shaharlar" : "Туман/шаҳарлар",
    dataPoints: script === "latin" ? "O'lchash joylari" : "Ўлчаш жойлари",
    grs: "ГТШ",
    nodes: script === "latin" ? "Tugunlar" : "Тугунлар",
    interdistrict:
      script === "latin"
        ? "Tumanlararo hisoblagichlar"
        : "Туманлараро ҳисоблагичлар",
    grp: "ГТҚ",
    reports: script === "latin" ? "Hisobotlar" : "Ҳисоботлар",
    dataEntry: script === "latin" ? "Ma'lumot kiritish" : "Маълумот киритиш",
    viewReports:
      script === "latin" ? "Hisobotlarni ko'rish" : "Ҳисоботларни кўриш",
    editPermissions: script === "latin" ? "O'zgartirish" : "Ўзгартириш",
    consumers: script === "latin" ? "Iste'molchilar" : "Истеъмолчилар",
    consumersList:
      script === "latin" ? "Iste'molchilar ro'yxati" : "Истеъмолчилар рўйхати",
    consumersTypes:
      script === "latin" ? "Iste'molchilar turi" : "Истеъмолчилар тури",
    users: script === "latin" ? "Foydalanuvchilar" : "Фойдаланувчилар",
    logs: script === "latin" ? "Amallar jurnali" : "Амаллар журнали",
    logout: script === "latin" ? "Chiqish" : "Чиқиш",
    form1: script === "latin" ? "Forma-1" : "Форма-1",
    form2: script === "latin" ? "Forma-2" : "Форма-2",
    form3: script === "latin" ? "Forma-3" : "Форма-3",
    form4: script === "latin" ? "Forma-4" : "Форма-4",
    // Переводы для Фондлар
    funds: script === "latin" ? "Fondlar" : "Фондлар",
    fundBalance: script === "latin" ? "Fond balansi" : "Фонд баланси",
    fundTransactions:
      script === "latin" ? "Fond operatsiyalari" : "Фонд операциялари",
    fundReports: script === "latin" ? "Fond hisobotlari" : "Фонд ҳисоботлари",
    fundSettings: script === "latin" ? "Fond sozlamalari" : "Фонд созламалари",
    fundBalance: script === "latin" ? "Fond balansi" : "Фонд баланси",
  };

  // Функции проверки доступа к разделам
  const canAccess = {
    // Бошкарув панели - доступен всем
    dashboard: () => true,

    // Худудлар - доступен admin, vil_disp, metrolog
    regions: () => {
      const allowedRoles = ["admin", "vil_disp", "metrolog"];
      return allowedRoles.includes(userRole);
    },

    // Улчаш жойлари - доступен admin, vil_disp, metrolog
    dataPoints: () => {
      const allowedRoles = ["admin", "vil_disp", "metrolog"];
      return allowedRoles.includes(userRole);
    },

    // Хисоботларни куриш - доступен всем
    viewReports: () => true,

    // Маълумот киритиш - доступен ray_disp и vil_disp
    dataEntry: () => {
      const allowedRoles = ["ray_disp", "vil_disp"];
      return allowedRoles.includes(userRole);
    },

    // Узгартириш - доступен только admin
    editPermissions: () => {
      const allowedRoles = ["admin"];
      return allowedRoles.includes(userRole);
    },

    // Истеъмолчилар - доступен admin, vil_disp, metrolog
    consumers: () => {
      const allowedRoles = ["admin", "vil_disp", "metrolog"];
      return allowedRoles.includes(userRole);
    },

    // Фойдаланувчилар - доступен только admin
    users: () => {
      const allowedRoles = ["admin"];
      return allowedRoles.includes(userRole);
    },

    // Амаллар журнали - доступен только dilik@mail.ru
    logs: () => userIsDilik,

    // Фондлар - доступен admin, vil_disp, metrolog (можно настроить под свои нужды)
    funds: () => {
      const allowedRoles = ["admin", "vil_disp", "metrolog"];
      return allowedRoles.includes(userRole);
    },
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate("/login");
  };

  const toggleRegions = () => {
    if (canAccess.regions()) {
      setOpenRegions(!openRegions);
    }
  };

  const toggleDataPoints = () => {
    if (canAccess.dataPoints()) {
      setOpenDataPoints(!openDataPoints);
    }
  };

  const toggleReports = () => {
    setOpenReports(!openReports);
  };

  const toggleViewReports = () => {
    if (canAccess.viewReports()) {
      setOpenViewReports(!openViewReports);
    }
  };

  const toggleConsumers = () => {
    if (canAccess.consumers()) {
      setOpenConsumers(!openConsumers);
    }
  };

  const toggleFunds = () => {
    if (canAccess.funds()) {
      setOpenFunds(!openFunds);
    }
  };

  return (
    <>
      {/* Оверлей */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Боковое меню */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Заголовок */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                GazBoshqar
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {script === "latin" ? "v1.0.0" : "v1.0.0"}
              </p>
            </div>
          </div>

          {/* Кнопка закрытия */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-300"
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

        {/* Меню */}
        <nav className="p-4 space-y-1">
          {/* Дашборд - доступен всем */}
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`
            }
          >
            <FiHome className="w-5 h-5" />
            <span className="font-medium">{translations.dashboard}</span>
          </NavLink>

          {/* Худудлар / Регионы - только admin, vil_disp, metrolog */}
          {canAccess.regions() && (
            <div>
              <button
                onClick={toggleRegions}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <FiMap className="w-5 h-5" />
                  <span className="font-medium">{translations.regions}</span>
                </div>
                {openRegions ? (
                  <FiChevronDown className="w-4 h-4" />
                ) : (
                  <FiChevronRight className="w-4 h-4" />
                )}
              </button>

              {openRegions && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                  <NavLink
                    to="/regions/viloyat"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    <FiLayers className="w-4 h-4" />
                    <span>{translations.viloyat}</span>
                  </NavLink>

                  <NavLink
                    to="/regions/districts"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    <FiFolder className="w-4 h-4" />
                    <span>{translations.districts}</span>
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* Ўлчаш жойлари / Места сбора данных - только admin, vil_disp, metrolog */}
          {canAccess.dataPoints() && (
            <div>
              <button
                onClick={toggleDataPoints}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <FiActivity className="w-5 h-5" />
                  <span className="font-medium">{translations.dataPoints}</span>
                </div>
                {openDataPoints ? (
                  <FiChevronDown className="w-4 h-4" />
                ) : (
                  <FiChevronRight className="w-4 h-4" />
                )}
              </button>

              {openDataPoints && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                  <NavLink
                    to="/data-points/grs"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    <FiGlobe className="w-4 h-4" />
                    <span>{translations.grs}</span>
                  </NavLink>

                  <NavLink
                    to="/data-points/nodes"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    <FiBox className="w-4 h-4" />
                    <span>{translations.nodes}</span>
                  </NavLink>

                  <NavLink
                    to="/data-points/interdistrict"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    <FiSliders className="w-4 h-4" />
                    <span>{translations.interdistrict}</span>
                  </NavLink>

                  <NavLink
                    to="/data-points/grp"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    <FiGlobe className="w-4 h-4" />
                    <span>{translations.grp}</span>
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* Ҳисоботлар / Отчеты - доступен всем */}
          <div>
            <button
              onClick={toggleReports}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <FiFileText className="w-5 h-5" />
                <span className="font-medium">{translations.reports}</span>
              </div>
              {openReports ? (
                <FiChevronDown className="w-4 h-4" />
              ) : (
                <FiChevronRight className="w-4 h-4" />
              )}
            </button>

            {openReports && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                {/* Маълумот киритиш - ray_disp и vil_disp */}
                {canAccess.dataEntry() && (
                  <NavLink
                    to="/reports/data-entry"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    <FiDatabase className="w-4 h-4" />
                    <span>{translations.dataEntry}</span>
                  </NavLink>
                )}

                {/* Хисоботларни куриш - с подменю */}
                {canAccess.viewReports() && (
                  <div>
                    <button
                      onClick={toggleViewReports}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <FiBarChart2 className="w-4 h-4" />
                        <span>{translations.viewReports}</span>
                      </div>
                      {openViewReports ? (
                        <FiChevronDown className="w-3 h-3" />
                      ) : (
                        <FiChevronRight className="w-3 h-3" />
                      )}
                    </button>

                    {openViewReports && (
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                        <NavLink
                          to="/reports/view/form-1"
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                              isActive
                                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`
                          }
                        >
                          <FiFile className="w-3.5 h-3.5" />
                          <span>{translations.form1}</span>
                        </NavLink>

                        <NavLink
                          to="/reports/view/form-2"
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                              isActive
                                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`
                          }
                        >
                          <FiFile className="w-3.5 h-3.5" />
                          <span>{translations.form2}</span>
                        </NavLink>

                        <NavLink
                          to="/reports/view/form-3"
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                              isActive
                                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`
                          }
                        >
                          <FiFile className="w-3.5 h-3.5" />
                          <span>{translations.form3}</span>
                        </NavLink>

                        <NavLink
                          to="/reports/view/form-4"
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                              isActive
                                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`
                          }
                        >
                          <FiFile className="w-3.5 h-3.5" />
                          <span>{translations.form4}</span>
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}

                {/* Узгартириш - только admin */}
                {canAccess.editPermissions() && (
                  <NavLink
                    to="/reports/edit-permissions"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    <FiEdit className="w-4 h-4" />
                    <span>{translations.editPermissions}</span>
                  </NavLink>
                )}
              </div>
            )}
          </div>

          {/* Истеъмолчилар / Потребители - только admin, vil_disp, metrolog */}
          {canAccess.consumers() && (
            <div>
              <button
                onClick={toggleConsumers}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <FiUsers className="w-5 h-5" />
                  <span className="font-medium">{translations.consumers}</span>
                </div>
                {openConsumers ? (
                  <FiChevronDown className="w-4 h-4" />
                ) : (
                  <FiChevronRight className="w-4 h-4" />
                )}
              </button>

              {openConsumers && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                  <NavLink
                    to="/consumers/list"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    <FiList className="w-4 h-4" />
                    <span>{translations.consumersList}</span>
                  </NavLink>

                  <NavLink
                    to="/consumers/types"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    <FiTag className="w-4 h-4" />
                    <span>{translations.consumersTypes}</span>
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* Фондлар / Фонды - новое меню */}
          {canAccess.funds() && (
            <div>
              <button
                onClick={toggleFunds}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <FiDollarSign className="w-5 h-5" />
                  <span className="font-medium">{translations.funds}</span>
                </div>
                {openFunds ? (
                  <FiChevronDown className="w-4 h-4" />
                ) : (
                  <FiChevronRight className="w-4 h-4" />
                )}
              </button>

              {openFunds && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                  <NavLink
                    to="/funds/balance"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    <FiPieChart className="w-4 h-4" />
                    <span>{translations.fundBalance}</span>
                  </NavLink>

                  <NavLink
                    to="/funds/transactions"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    <FiTrendingUp className="w-4 h-4" />
                    <span>{translations.fundTransactions}</span>
                  </NavLink>

                  <NavLink
                    to="/funds/reports"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    <FiFileText className="w-4 h-4" />
                    <span>{translations.fundReports}</span>
                  </NavLink>

                  <NavLink
                    to="/funds/settings"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    <FiSliders className="w-4 h-4" />
                    <span>{translations.fundSettings}</span>
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* Фойдаланувчилар / Пользователи - только admin */}
          {canAccess.users() && (
            <NavLink
              to="/users"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`
              }
            >
              <FiUsers className="w-5 h-5" />
              <span className="font-medium">{translations.users}</span>
            </NavLink>
          )}

          {/* Амаллар журнали / Логи - только dilik@mail.ru */}
          {canAccess.logs() && (
            <NavLink
              to="/logs"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`
              }
            >
              <FiClipboard className="w-5 h-5" />
              <span className="font-medium">{translations.logs}</span>
            </NavLink>
          )}
        </nav>

        {/* Нижняя часть с кнопкой выхода */}
        <div className="sticky bottom-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
          >
            <FiLogOut className="w-5 h-5" />
            <span className="font-medium">{translations.logout}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
