import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import useReportStore from "../store/reportStore";
import {
  getCurrentHour,
  getToday,
  shouldCreateReport,
} from "../services/reportUtils";

const useReportNotifications = () => {
  const [lastNotifiedHour, setLastNotifiedHour] = useState(null);
  const { loadReports, currentMonth, userAssignedItems } = useReportStore();

  useEffect(() => {
    // Проверяем каждые 30 секунд
    const interval = setInterval(() => {
      const currentHour = getCurrentHour();
      const today = getToday();

      // Проверяем, нужно ли создать отчет
      if (shouldCreateReport(currentHour) && lastNotifiedHour !== currentHour) {
        // Проверяем, есть ли уже отчет за этот час
        const checkReport = async () => {
          const regionId = userAssignedItems?.regions?.[0]?.id;
          if (!regionId) return;

          // Здесь нужно проверить существование отчета
          // Если отчета нет - показываем уведомление
          toast.info(
            `${today} ${currentHour}:00 uchun hisobot yozish vaqti keldi!`,
            {
              position: "top-right",
              autoClose: 10000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              onClick: () => {
                // Переход на страницу ввода данных
                window.location.href = "/reports/data-entry";
              },
            },
          );
          setLastNotifiedHour(currentHour);
        };

        checkReport();
      }
    }, 30000); // 30 секунд

    return () => clearInterval(interval);
  }, [lastNotifiedHour, userAssignedItems]);

  return { lastNotifiedHour };
};

export default useReportNotifications;
