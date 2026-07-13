import { create } from "zustand";
import {
  getCurrentMonthKey,
  getReportCollectionName,
  getMonthsList,
  checkMonthExists,
  createMonth,
  getMonthMetadata,
  getReportsByDate,
  getLastReport,
  getReportByTime,
  createReport,
  updateReport,
  deleteReport,
  getReportById,
  getUserAssignedItems,
  checkReportExists,
} from "./../services/reportService";

const useReportStore = create((set, get) => ({
  // Состояние
  currentMonth: null,
  months: [],
  reports: [],
  currentReport: null,
  lastReport: null,
  loading: false,
  error: null,
  userAssignedItems: null,
  selectedDate: null,
  selectedHour: null,

  // === Инициализация ===
  initialize: async () => {
    set({ loading: true, error: null });
    try {
      const currentMonthKey = getCurrentMonthKey();

      // Проверяем существование месяца
      const exists = await checkMonthExists(currentMonthKey);
      if (!exists) {
        await createMonth(currentMonthKey);
      }

      // Получаем метаданные месяца
      const metadata = await getMonthMetadata(currentMonthKey);

      // Получаем список всех месяцев
      const months = await getMonthsList();

      set({
        currentMonth: currentMonthKey,
        months: months,
        loading: false,
      });

      return { success: true, currentMonth: currentMonthKey, metadata };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // === Загрузка отчетов ===
  loadReports: async (date, regionId = null) => {
    set({ loading: true, error: null });
    try {
      const { currentMonth } = get();
      const reports = await getReportsByDate(currentMonth, date, regionId);

      set({
        reports: reports || [], // Убеждаемся, что это массив
        selectedDate: date,
        loading: false,
      });

      return { success: true, reports };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // === Загрузка последнего отчета ===
  loadLastReport: async (regionId) => {
    set({ loading: true, error: null });
    try {
      const { currentMonth } = get();
      const lastReport = await getLastReport(currentMonth, regionId);

      set({
        lastReport,
        loading: false,
      });

      return { success: true, lastReport };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // === Получение отчета по времени ===
  getReportByTime: async (date, hour, regionId) => {
    set({ loading: true, error: null });
    try {
      const { currentMonth } = get();
      const report = await getReportByTime(currentMonth, regionId, date, hour);

      set({
        currentReport: report,
        selectedDate: date,
        selectedHour: hour,
        loading: false,
      });

      return { success: true, report };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // === Создание отчета ===
  createReport: async (reportData) => {
    set({ loading: true, error: null });
    try {
      const { currentMonth } = get();
      const newReport = await createReport(currentMonth, reportData);

      // Обновляем список отчетов
      const { reports, selectedDate } = get();
      if (selectedDate === reportData.date) {
        set({ reports: [...reports, newReport] });
      }

      set({ loading: false });
      return { success: true, report: newReport };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // === Обновление отчета ===
  updateReport: async (reportId, data) => {
    set({ loading: true, error: null });
    try {
      const { currentMonth } = get();
      await updateReport(currentMonth, reportId, data);

      // Обновляем в списке
      const { reports } = get();
      const updatedReports = reports.map((r) =>
        r.id === reportId ? { ...r, ...data } : r,
      );
      set({ reports: updatedReports, loading: false });

      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // === Удаление отчета ===
  deleteReport: async (reportId) => {
    set({ loading: true, error: null });
    try {
      const { currentMonth } = get();
      await deleteReport(currentMonth, reportId);

      // Удаляем из списка
      const { reports } = get();
      set({
        reports: reports.filter((r) => r.id !== reportId),
        loading: false,
      });

      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // === Загрузка прикрепленных объектов ===
  loadUserAssignedItems: async (userId) => {
    set({ loading: true, error: null });
    try {
      const items = await getUserAssignedItems(userId);
      set({
        userAssignedItems: items,
        loading: false,
      });
      return { success: true, items };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // === Проверка существования отчета ===
  checkReportExists: async (date, hour, regionId) => {
    try {
      const { currentMonth } = get();
      const exists = await checkReportExists(
        currentMonth,
        regionId,
        date,
        hour,
      );
      return { success: true, exists };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // === Смена месяца ===
  switchMonth: async (monthKey) => {
    set({ loading: true, error: null });
    try {
      // Проверяем существование месяца
      const exists = await checkMonthExists(monthKey);
      if (!exists) {
        await createMonth(monthKey);
      }

      const metadata = await getMonthMetadata(monthKey);

      set({
        currentMonth: monthKey,
        reports: [],
        currentReport: null,
        loading: false,
      });

      return { success: true, metadata };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // === Очистка состояния ===
  reset: () => {
    set({
      currentMonth: null,
      months: [],
      reports: [],
      currentReport: null,
      lastReport: null,
      loading: false,
      error: null,
      userAssignedItems: null,
      selectedDate: null,
      selectedHour: null,
    });
  },
}));

export default useReportStore;
