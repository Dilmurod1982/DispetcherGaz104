// === Форматирование даты и времени ===

// Форматировать дату
export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Форматировать дату для отображения
export const formatDateDisplay = (date) => {
  const d = new Date(date);
  const months = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentyabr",
    "Oktyabr",
    "Noyabr",
    "Dekabr",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

// Форматировать время
export const formatTime = (hour) => {
  return `${String(hour).padStart(2, "0")}:00`;
};

// Получить текущую дату в формате YYYY-MM-DD
export const getToday = () => {
  return formatDate(new Date());
};

// Получить текущий час
export const getCurrentHour = () => {
  return new Date().getHours();
};

// === Определение типа отчета ===

// Получить тип отчета по часу
export const getReportTypeByHour = (hour) => {
  if (hour === 0) return "daily";
  if (hour % 6 === 0) return "six_hour";
  return "two_hour";
};

// Получить часы для отчета по типу
export const getHoursForType = (type) => {
  switch (type) {
    case "daily":
      return [0];
    case "six_hour":
      return [0, 6, 12, 18];
    case "two_hour":
      return [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
    default:
      return [];
  }
};

// === Проверка времени отчета ===

// Проверить, нужно ли создавать отчет в текущее время
export const shouldCreateReport = (hour) => {
  // Проверяем часы: 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22
  return hour % 2 === 0;
};

// Получить следующее время отчета
export const getNextReportTime = () => {
  const now = new Date();
  let hour = now.getHours();
  let minutes = now.getMinutes();

  // Если время прошло, берем следующий час
  if (minutes > 0) {
    hour += 1;
  }

  // Округляем до ближайшего четного часа
  if (hour % 2 !== 0) {
    hour += 1;
  }

  // Если час > 22, то следующий день
  if (hour > 22) {
    hour = 0;
    now.setDate(now.getDate() + 1);
  }

  const date = formatDate(now);
  return { date, hour };
};

// === Валидация данных отчета ===

// Проверить данные узла
export const validateNodeData = (data) => {
  const errors = [];
  if (!data.flow && data.flow !== 0) {
    errors.push("Расход не указан");
  }
  if (data.flow < 0) {
    errors.push("Расход не может быть отрицательным");
  }
  if (data.pressure !== undefined && data.pressure < 0) {
    errors.push("Давление не может быть отрицательным");
  }
  return errors;
};

// Проверить данные потребителя
export const validateConsumerData = (data) => {
  const errors = [];
  if (!data.flow && data.flow !== 0) {
    errors.push("Расход не указан");
  }
  if (data.flow < 0) {
    errors.push("Расход не может быть отрицательным");
  }
  return errors;
};

// Проверить данные ГРП
export const validateGrpData = (data) => {
  const errors = [];
  if (!data.pressure && data.pressure !== 0) {
    errors.push("Давление не указано");
  }
  if (data.pressure < 0) {
    errors.push("Давление не может быть отрицательным");
  }
  return errors;
};

// === Преобразование данных ===

// Преобразовать данные отчета в формат для сохранения
export const prepareReportData = (
  data,
  type,
  regionId,
  regionName,
  userId,
  userName,
) => {
  return {
    type,
    regionId,
    regionName,
    userId,
    userName,
    date: data.date,
    hour: data.hour,
    data: {
      nodes: data.nodes || {},
      interdistrict: data.interdistrict || {},
      consumers: data.consumers || {},
      grp: data.grp || {},
      ...(type === "daily" && {
        totals: {
          totalPopulation: data.totalPopulation || 0,
          totalWholesale: data.totalWholesale || 0,
          losses: data.losses || 0,
        },
      }),
    },
    timestamp: new Date(),
  };
};

// === Статистика ===

// Подсчитать общий расход по объектам
export const calculateTotalFlow = (items) => {
  let total = 0;
  Object.values(items).forEach((item) => {
    if (item.flow) {
      total += parseFloat(item.flow) || 0;
    }
  });
  return total;
};

// Подсчитать среднее давление
export const calculateAveragePressure = (items) => {
  let total = 0;
  let count = 0;
  Object.values(items).forEach((item) => {
    if (item.pressure !== undefined && item.pressure !== null) {
      total += parseFloat(item.pressure) || 0;
      count++;
    }
  });
  return count > 0 ? total / count : 0;
};

// === Экспорт ===

// Экспортировать данные в Excel (CSV)
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] || "")).join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};
