import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  setDoc,
  increment,
} from "firebase/firestore";
import { db } from "../firebase/config";

// === Константы ===
const METADATA_COLLECTION = "report_metadata";

// === Вспомогательные функции ===

// Получение текущего месяца в формате YYYY_MM
export const getCurrentMonthKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}_${month}`;
};

// Получение названия месяца на узбекском
export const getMonthName = (monthKey) => {
  const [year, month] = monthKey.split("_");
  const monthNames = {
    "01": "Yanvar",
    "02": "Fevral",
    "03": "Mart",
    "04": "Aprel",
    "05": "May",
    "06": "Iyun",
    "07": "Iyul",
    "08": "Avgust",
    "09": "Sentyabr",
    10: "Oktyabr",
    11: "Noyabr",
    12: "Dekabr",
  };
  return `${monthNames[month]} ${year}`;
};

// Получение имени коллекции для месяца
export const getReportCollectionName = (monthKey) => {
  return `reports_${monthKey}`;
};

// Получение типа отчета по времени
export const getReportType = (hour) => {
  if (hour === 0) return "daily";
  if (hour % 6 === 0) return "six_hour";
  return "two_hour";
};

// === Работа с метаданными месяцев ===

// Получить список всех месяцев
export const getMonthsList = async () => {
  try {
    const metadataRef = collection(db, METADATA_COLLECTION);
    const q = query(
      metadataRef,
      orderBy("year", "desc"),
      orderBy("month", "desc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting months list:", error);
    return [];
  }
};

// Проверить существование месяца
export const checkMonthExists = async (monthKey) => {
  try {
    const docRef = doc(db, METADATA_COLLECTION, monthKey);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error("Error checking month exists:", error);
    return false;
  }
};

// Создать новый месяц
export const createMonth = async (monthKey) => {
  try {
    const [year, month] = monthKey.split("_");
    const monthData = {
      year: parseInt(year),
      month: parseInt(month),
      monthKey: monthKey,
      monthName: getMonthName(monthKey),
      collectionName: getReportCollectionName(monthKey),
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      reportCount: 0,
      status: "active",
      regions: [],
      lastReportDate: null,
    };

    await setDoc(doc(db, METADATA_COLLECTION, monthKey), monthData);
    return monthData;
  } catch (error) {
    console.error("Error creating month:", error);
    throw error;
  }
};

// Обновить метаданные месяца - ПОЛНОСТЬЮ ПЕРЕРАБОТАНА
export const updateMonthMetadata = async (monthKey, data) => {
  try {
    const docRef = doc(db, METADATA_COLLECTION, monthKey);
    const docSnap = await getDoc(docRef);

    let currentData = {};
    if (docSnap.exists()) {
      currentData = docSnap.data();
    } else {
      // Если документ не существует, создаем его
      await createMonth(monthKey);
      const newDocSnap = await getDoc(docRef);
      currentData = newDocSnap.exists() ? newDocSnap.data() : {};
    }

    // Подготавливаем данные для обновления
    const updateData = {};

    // 1. Обновляем reportCount если передан
    if (data.reportCount !== undefined) {
      // Если reportCount - это объект increment, используем его
      if (
        typeof data.reportCount === "object" &&
        data.reportCount.constructor === increment().constructor
      ) {
        updateData.reportCount = data.reportCount;
      } else {
        // Иначе просто устанавливаем значение
        updateData.reportCount = data.reportCount;
      }
    }

    // 2. Обновляем lastReportDate если передан
    if (data.lastReportDate) {
      updateData.lastReportDate = data.lastReportDate;
    }

    // 3. Обновляем регионы, если передан новый регион
    if (data.regionId) {
      // Безопасно получаем текущий массив регионов
      let regions = [];
      if (currentData.regions && Array.isArray(currentData.regions)) {
        regions = currentData.regions;
      }

      // Проверяем, существует ли уже регион в списке
      if (!regions.includes(data.regionId)) {
        // Добавляем новый регион
        updateData.regions = [...regions, data.regionId];
      } else {
        // Регион уже существует, оставляем как есть
        updateData.regions = regions;
      }
    }

    // 4. Обновляем статус если передан
    if (data.status) {
      updateData.status = data.status;
    }

    // Добавляем время обновления
    updateData.lastUpdated = serverTimestamp();

    // Если есть данные для обновления - применяем
    if (Object.keys(updateData).length > 0) {
      await updateDoc(docRef, updateData);
    }

    return true;
  } catch (error) {
    console.error("Error updating month metadata:", error);
    // Не выбрасываем ошибку, чтобы не прерывать создание отчета
    return false;
  }
};

// Получить метаданные месяца
export const getMonthMetadata = async (monthKey) => {
  try {
    const docRef = doc(db, METADATA_COLLECTION, monthKey);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting month metadata:", error);
    return null;
  }
};

// === Работа с отчетами ===

// Создать отчет
export const createReport = async (monthKey, reportData) => {
  try {
    const collectionName = getReportCollectionName(monthKey);
    const reportsRef = collection(db, collectionName);

    const newReport = {
      ...reportData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
    };

    const docRef = await addDoc(reportsRef, newReport);

    // Обновляем метаданные месяца
    try {
      const regionId = reportData.regionId;
      await updateMonthMetadata(monthKey, {
        reportCount: increment(1),
        lastReportDate: reportData.date,
        regionId: regionId,
      });
    } catch (metaError) {
      console.warn(
        "Error updating month metadata, but report was created:",
        metaError,
      );
      // Не останавливаем выполнение, если метаданные не обновились
    }

    return { id: docRef.id, ...newReport };
  } catch (error) {
    console.error("Error creating report:", error);
    throw error;
  }
};

// Получить отчет по ID
export const getReportById = async (monthKey, reportId) => {
  try {
    const collectionName = getReportCollectionName(monthKey);
    const docRef = doc(db, collectionName, reportId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting report:", error);
    return null;
  }
};

// Получить отчеты за день
export const getReportsByDate = async (monthKey, date, regionId = null) => {
  try {
    const collectionName = getReportCollectionName(monthKey);
    const reportsRef = collection(db, collectionName);

    let q;
    if (regionId) {
      q = query(
        reportsRef,
        where("date", "==", date),
        where("regionId", "==", regionId),
        orderBy("hour", "asc"),
      );
    } else {
      q = query(reportsRef, where("date", "==", date), orderBy("hour", "asc"));
    }

    const snapshot = await getDocs(q);
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Reports loaded for ${date} (region: ${regionId}):`, reports); // Для отладки

    return reports;
  } catch (error) {
    console.error("Error getting reports by date:", error);
    return [];
  }
};

// Получить последний отчет для региона
export const getLastReport = async (monthKey, regionId) => {
  try {
    const collectionName = getReportCollectionName(monthKey);
    const reportsRef = collection(db, collectionName);

    const q = query(
      reportsRef,
      where("regionId", "==", regionId),
      orderBy("timestamp", "desc"),
      limit(1),
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting last report:", error);
    return null;
  }
};

// Получить отчет по времени
export const getReportByTime = async (monthKey, regionId, date, hour) => {
  try {
    const collectionName = getReportCollectionName(monthKey);
    const reportsRef = collection(db, collectionName);

    const q = query(
      reportsRef,
      where("regionId", "==", regionId),
      where("date", "==", date),
      where("hour", "==", hour),
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting report by time:", error);
    return null;
  }
};

// Обновить отчет
export const updateReport = async (monthKey, reportId, data) => {
  try {
    const collectionName = getReportCollectionName(monthKey);
    const docRef = doc(db, collectionName, reportId);

    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error updating report:", error);
    throw error;
  }
};

// Удалить отчет
export const deleteReport = async (monthKey, reportId) => {
  try {
    const collectionName = getReportCollectionName(monthKey);
    const docRef = doc(db, collectionName, reportId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting report:", error);
    throw error;
  }
};

// Получить статистику по месяцу
export const getMonthStats = async (monthKey, regionId = null) => {
  try {
    const collectionName = getReportCollectionName(monthKey);
    const reportsRef = collection(db, collectionName);

    let q = query(reportsRef);
    if (regionId) {
      q = query(q, where("regionId", "==", regionId));
    }

    const snapshot = await getDocs(q);
    const reports = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const stats = {
      total: reports.length,
      byType: {
        two_hour: reports.filter((r) => r.type === "two_hour").length,
        six_hour: reports.filter((r) => r.type === "six_hour").length,
        daily: reports.filter((r) => r.type === "daily").length,
      },
      byDate: {},
      lastReport: reports.length > 0 ? reports[reports.length - 1] : null,
    };

    reports.forEach((report) => {
      if (!stats.byDate[report.date]) {
        stats.byDate[report.date] = 0;
      }
      stats.byDate[report.date]++;
    });

    return stats;
  } catch (error) {
    console.error("Error getting month stats:", error);
    return null;
  }
};

// === Работа с прикрепленными объектами пользователя ===

// Получить прикрепленные объекты для пользователя
export const getUserAssignedItems = async (userId) => {
  try {
    const docRef = doc(db, "user_regions", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting user assigned items:", error);
    return null;
  }
};

// Сохранить прикрепленные объекты пользователя
export const saveUserAssignedItems = async (userId, data) => {
  try {
    await setDoc(doc(db, "user_regions", userId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error saving user assigned items:", error);
    throw error;
  }
};

// === Проверка наличия отчета за конкретное время ===

// Проверить, есть ли отчет за указанное время
export const checkReportExists = async (monthKey, regionId, date, hour) => {
  try {
    const report = await getReportByTime(monthKey, regionId, date, hour);
    return !!report;
  } catch (error) {
    console.error("Error checking report exists:", error);
    return false;
  }
};

// === Получение отчетов за период ===

// Получить отчеты за период
export const getReportsByPeriod = async (
  monthKey,
  regionId,
  startDate,
  endDate,
) => {
  try {
    const collectionName = getReportCollectionName(monthKey);
    const reportsRef = collection(db, collectionName);

    const q = query(
      reportsRef,
      where("regionId", "==", regionId),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "asc"),
      orderBy("hour", "asc"),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting reports by period:", error);
    return [];
  }
};

// === Экспорт данных ===

// Экспортировать отчеты в CSV
export const exportReportsToCSV = (reports) => {
  if (!reports || reports.length === 0) return "";

  const headers = ["Дата", "Время", "Тип", "Регион", "Данные"];
  const rows = reports.map((report) => [
    report.date,
    `${report.hour}:00`,
    report.type,
    report.regionName,
    JSON.stringify(report.data),
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
    "\n",
  );
  return csv;
};
