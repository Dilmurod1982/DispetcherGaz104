import useLanguageStore from "../../store/languageStore";

const LanguageToggle = () => {
  const { script, toggleScript } = useLanguageStore();

  return (
    <button
      onClick={toggleScript}
      className="px-3 py-1 rounded-lg bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors duration-200 text-sm font-medium"
    >
      {script === "latin" ? "КИР" : "LOT"}
    </button>
  );
};

export default LanguageToggle;
