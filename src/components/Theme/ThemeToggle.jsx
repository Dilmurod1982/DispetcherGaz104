import { FiSun, FiMoon } from "react-icons/fi";
import useThemeStore from "../../store/themeStore";

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <FiSun className="text-yellow-400 text-xl" />
      ) : (
        <FiMoon className="text-gray-700 dark:text-gray-300 text-xl" />
      )}
    </button>
  );
};

export default ThemeToggle;
