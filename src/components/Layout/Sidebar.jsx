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
} from "react-icons/fi";
import useLanguageStore from "../../store/languageStore";
import useAuthStore from "../../store/authStore";
import { FiEdit } from "react-icons/fi";

const Sidebar = ({ isOpen, onClose }) => {
  const { script } = useLanguageStore();
  const { logout, isAdmin, isDilik } = useAuthStore();
  const navigate = useNavigate();

  const [openRegions, setOpenRegions] = useState(false);
  const [openDataPoints, setOpenDataPoints] = useState(false);
  const [openReports, setOpenReports] = useState(false);

  const userIsAdmin = isAdmin();
  const userIsDilik = isDilik();

  const translations = {
    dashboard: script === "latin" ? "Boshqaruv paneli" : "Бошқарув панели",
    dailyInfo: script === "latin" ? "Kunlik ma'lumotlar" : "Кунлик маълумотлар",
    regions: script === "latin" ? "Xududlar" : "Ҳудудлар",
    regionsRu: "Регионы",
    viloyat: script === "latin" ? "Viloyat" : "Вилоят",
    viloyatRu: "Область",
    districts: script === "latin" ? "Tuman/shaharlar" : "Туман/шаҳарлар",
    districtsRu: "Районы/города",
    dataPoints: script === "latin" ? "O'lchash joylari" : "Ўлчаш жойлари",
    dataPointsRu: "Места сбора данных",
    grs: "ГТШ",
    grsRu: "ГРС",
    nodes: script === "latin" ? "Tugunlar" : "Тугунлар",
    nodesRu: "Узлы",
    interdistrict:
      script === "latin"
        ? "Tumanlararo hisoblagichlar"
        : "Туманлараро ҳисоблагичлар",
    interdistrictRu: "Межрайонные узлы учета",
    grp: "ГТҚ",
    grpRu: "ГРП",
    reports: script === "latin" ? "Hisobotlar" : "Ҳисоботлар",
    reportsRu: "Отчеты",
    dataEntry: script === "latin" ? "Ma'lumot kiritish" : "Маълумот киритиш",
    viewReports:
      script === "latin" ? "Hisobotlarni ko'rish" : "Ҳисоботларни кўриш",
    consumers: script === "latin" ? "Iste'molchilar" : "Истеъмолчилар",
    consumersRu: "Потребители",
    users: script === "latin" ? "Foydalanuvchilar" : "Фойдаланувчилар",
    usersRu: "Пользователи",
    logs: script === "latin" ? "Amallar jurnali" : "Амаллар журнали",
    logout: script === "latin" ? "Chiqish" : "Чиқиш",
    editPermissions: script === "latin" ? "O'zgartirish" : "Ўзгартириш",
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate("/login");
  };

  const toggleRegions = () => {
    setOpenRegions(!openRegions);
  };

  const toggleDataPoints = () => {
    setOpenDataPoints(!openDataPoints);
  };

  const toggleReports = () => {
    setOpenReports(!openReports);
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
          {/* Дашборд */}
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

          {/* Кунлик маълумотлар */}
          <NavLink
            to="/daily-info"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`
            }
          >
            <FiCalendar className="w-5 h-5" />
            <span className="font-medium">{translations.dailyInfo}</span>
          </NavLink>

          {/* Худудлар / Регионы */}
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

          {/* Ўлчаш жойлари / Места сбора данных */}
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

          {/* Ҳисоботлар / Отчеты - с подменю */}
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

                <NavLink
                  to="/reports/view"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`
                  }
                >
                  <FiBarChart2 className="w-4 h-4" />
                  <span>{translations.viewReports}</span>
                </NavLink>
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
              </div>
            )}
          </div>

          {/* Истеъмолчилар / Потребители */}
          <NavLink
            to="/consumers"
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
            <span className="font-medium">{translations.consumers}</span>
          </NavLink>

          {/* Фойдаланувчилар / Пользователи - только для админов */}
          {userIsAdmin && (
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

          {/* Амаллар журнали / Логи - только для dilik@mail.ru */}
          {userIsDilik && (
            <NavLink
              to="/logs"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
