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

// Получить текущую дату и время
export const getCurrentDateTime = () => {
  return new Date();
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

// === Проверка доступности отчетов ===

// Проверка, доступен ли отчет для ввода (за 10 минут до наступления)
export const isReportAvailable = (date, hour) => {
  const now = new Date();
  const reportDateTime = new Date(
    `${date}T${String(hour).padStart(2, "0")}:00:00`,
  );

  // Отчет доступен за 10 минут до наступления (05:50 для отчета в 06:00)
  const availableFrom = new Date(reportDateTime.getTime() - 10 * 60 * 1000);

  // Отчет доступен до окончания времени отчета (можно редактировать в течение 2 часов)
  const availableUntil = new Date(
    reportDateTime.getTime() + 2 * 60 * 60 * 1000,
  );

  return now >= availableFrom && now <= availableUntil;
};

// Проверка, можно ли редактировать отчет (для уже сохраненных)
export const canEditReport = (reportDate, reportHour, userRole) => {
  const now = new Date();

  // Создаем дату отчета
  const reportDateTime = new Date(
    `${reportDate}T${String(reportHour).padStart(2, "0")}:00:00`,
  );

  // Начало периода редактирования - 06:00 дня отчета
  const startOfEdit = new Date(reportDateTime);
  startOfEdit.setHours(6, 0, 0, 0);

  // Конец периода редактирования - 06:00 следующего дня
  const endOfEdit = new Date(reportDateTime);
  endOfEdit.setDate(endOfEdit.getDate() + 1);
  endOfEdit.setHours(6, 0, 0, 0);

  // Для районных диспетчеров
  if (userRole === "ray_disp" || userRole === "Туман/шаҳар диспетчери") {
    return now >= startOfEdit && now <= endOfEdit;
  }

  // Для областных диспетчеров - можно редактировать всегда (с разрешения)
  if (userRole === "vil_disp" || userRole === "Вилоят диспетчери") {
    return true;
  }

  // Для администраторов - всегда можно редактировать
  if (userRole === "admin" || userRole === "Админ") {
    return true;
  }

  return false;
};

// Проверка, можно ли создать отчет для сегодняшнего дня
export const canCreateReportForToday = (date) => {
  const now = new Date();
  const today = getToday();

  if (date !== today) return false;

  // Начало периода создания - 06:00 текущего дня
  const todayStart = new Date(`${today}T06:00:00`);

  // Конец периода создания - 06:00 следующего дня
  const tomorrowStart = new Date(`${today}T06:00:00`);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  // Можно создавать отчеты с 06:00 до 06:00 следующего дня
  return now >= todayStart && now <= tomorrowStart;
};

// Проверка, можно ли создать конкретный отчет для сегодняшнего дня
export const canCreateSpecificReport = (date, hour, userRole) => {
  const now = new Date();
  const today = getToday();

  // Только для сегодняшнего дня
  if (date !== today) return false;

  // Только для районных диспетчеров
  if (userRole !== "ray_disp" && userRole !== "Туман/шаҳар диспетчери") {
    return false;
  }

  // Проверяем период создания (06:00 - 06:00 следующего дня)
  const todayStart = new Date(`${today}T06:00:00`);
  const tomorrowStart = new Date(`${today}T06:00:00`);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  // Если текущее время вне периода 06:00-06:00 - нельзя создавать
  if (now < todayStart || now > tomorrowStart) {
    return false;
  }

  // Проверяем, доступен ли отчет (за 10 минут до наступления или уже прошел)
  const reportDateTime = new Date(
    `${date}T${String(hour).padStart(2, "0")}:00:00`,
  );
  const availableFrom = new Date(reportDateTime.getTime() - 10 * 60 * 1000);

  // Если час уже прошел (текущее время > время_отчета) - разрешаем создание (пропущенный отчет)
  if (now > reportDateTime) {
    return true; // Пропущенный отчет можно создать
  }

  // Если час еще не наступил - проверяем доступность за 10 минут
  if (now < availableFrom) {
    return false; // Еще не время
  }

  // Все проверки пройдены - можно создавать отчет
  return true;
};

// Получить время до которого можно редактировать
export const getEditDeadline = (reportDate, reportHour) => {
  const reportDateTime = new Date(
    `${reportDate}T${String(reportHour).padStart(2, "0")}:00:00`,
  );

  // Конец периода редактирования - 06:00 следующего дня
  const endOfEdit = new Date(reportDateTime);
  endOfEdit.setDate(endOfEdit.getDate() + 1);
  endOfEdit.setHours(6, 0, 0, 0);

  return endOfEdit;
};

// Получить время, когда отчет станет доступен
export const getReportAvailableTime = (date, hour) => {
  const reportDateTime = new Date(
    `${date}T${String(hour).padStart(2, "0")}:00:00`,
  );
  const availableFrom = new Date(reportDateTime.getTime() - 10 * 60 * 1000);
  return availableFrom;
};

// === Проверка времени отчета ===

// Проверить, нужно ли создавать отчет в текущее время
export const shouldCreateReport = (hour) => {
  return hour % 2 === 0;
};

// Получить следующее время отчета
export const getNextReportTime = () => {
  const now = new Date();
  let hour = now.getHours();
  let minutes = now.getMinutes();

  if (minutes > 0) {
    hour += 1;
  }

  if (hour % 2 !== 0) {
    hour += 1;
  }

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
  if (data.flow === undefined || data.flow === null || data.flow === "") {
    errors.push("Расход не указан");
  }
  if (data.flow < 0) {
    errors.push("Расход не может быть отрицательным");
  }
  if (data.pressureIn !== undefined && data.pressureIn < 0) {
    errors.push("Входящее давление не может быть отрицательным");
  }
  if (data.pressureOut !== undefined && data.pressureOut < 0) {
    errors.push("Исходящее давление не может быть отрицательным");
  }
  return errors;
};

// Проверить данные потребителя
export const validateConsumerData = (data) => {
  const errors = [];
  if (data.flow === undefined || data.flow === null || data.flow === "") {
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
  if (
    data.pressureIn === undefined ||
    data.pressureIn === null ||
    data.pressureIn === ""
  ) {
    errors.push("Входящее давление не указано");
  }
  if (data.pressureIn < 0) {
    errors.push("Входящее давление не может быть отрицательным");
  }
  if (
    data.pressureOut === undefined ||
    data.pressureOut === null ||
    data.pressureOut === ""
  ) {
    errors.push("Исходящее давление не указано");
  }
  if (data.pressureOut < 0) {
    errors.push("Исходящее давление не может быть отрицательным");
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

// Подсчитать среднее давление (входящее)
export const calculateAveragePressureIn = (items) => {
  let total = 0;
  let count = 0;
  Object.values(items).forEach((item) => {
    if (item.pressureIn !== undefined && item.pressureIn !== null) {
      total += parseFloat(item.pressureIn) || 0;
      count++;
    }
  });
  return count > 0 ? total / count : 0;
};

// Подсчитать среднее давление (исходящее)
export const calculateAveragePressureOut = (items) => {
  let total = 0;
  let count = 0;
  Object.values(items).forEach((item) => {
    if (item.pressureOut !== undefined && item.pressureOut !== null) {
      total += parseFloat(item.pressureOut) || 0;
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
