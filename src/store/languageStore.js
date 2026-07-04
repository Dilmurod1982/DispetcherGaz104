import { create } from "zustand";
import { persist } from "zustand/middleware";

const useLanguageStore = create(
  persist(
    (set) => ({
      script: "latin", // 'latin' or 'cyrillic'
      toggleScript: () =>
        set((state) => ({
          script: state.script === "latin" ? "cyrillic" : "latin",
        })),
    }),
    {
      name: "language-storage",
    },
  ),
);

export default useLanguageStore;
