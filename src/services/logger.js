import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import useAuthStore from "../store/authStore";

// Типы действий
export const ActionTypes = {
  // Регионы
  REGION_CREATE: "region_create",
  REGION_UPDATE: "region_update",
  REGION_DELETE: "region_delete",

  // Города
  CITY_CREATE: "city_create",
  CITY_UPDATE: "city_update",
  CITY_DELETE: "city_delete",

  // ГРС
  GRS_CREATE: "grs_create",
  GRS_UPDATE: "grs_update",
  GRS_DELETE: "grs_delete",

  // Узлы
  NODE_CREATE: "node_create",
  NODE_UPDATE: "node_update",
  NODE_DELETE: "node_delete",

  // Межрайонные
  INTERDISTRICT_CREATE: "interdistrict_create",
  INTERDISTRICT_UPDATE: "interdistrict_update",
  INTERDISTRICT_DELETE: "interdistrict_delete",

  // ГРП
  GRP_CREATE: "grp_create",
  GRP_UPDATE: "grp_update",
  GRP_DELETE: "grp_delete",

  // Потребители
  CONSUMER_CREATE: "consumer_create",
  CONSUMER_UPDATE: "consumer_update",
  CONSUMER_DELETE: "consumer_delete",

  // Пользователи
  USER_CREATE: "user_create",
  USER_UPDATE: "user_update",
  USER_DELETE: "user_delete",
  USER_LOGIN: "user_login",
  USER_LOGOUT: "user_logout",

  REPORT_PERMISSION_GRANTED: "report_permission_granted",
  REPORT_EDITED: "report_edited",

  // Добавьте в ActionTypes:
  CONSUMER_TYPE_CREATE: "consumer_type_create",
  CONSUMER_TYPE_UPDATE: "consumer_type_update",
  CONSUMER_TYPE_DELETE: "consumer_type_delete",

  FUND_CREATE: "fund_create",
  FUND_UPDATE: "fund_update",
  FUND_DELETE: "fund_delete",
};

// Основная функция логирования
export const logAction = async (actionType, details = {}, user = null) => {
  try {
    const logEntry = {
      actionType,
      details,
      timestamp: serverTimestamp(),
      user: user
        ? {
            uid: user.uid || null,
            email: user.email || null,
            displayName: user.displayName || user.email || null,
            role: user.role || null,
          }
        : null,
      userAgent: navigator.userAgent,
    };

    await addDoc(collection(db, "logs"), logEntry);
    // console.log(`[LOG] ${actionType}:`, details);
  } catch (error) {
    // console.error("Error logging action:", error);
  }
};

// Хук для использования в компонентах
export const useLogger = () => {
  const { user, userData } = useAuthStore();

  const log = async (actionType, details = {}) => {
    const userInfo = user
      ? {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
          role: userData?.role || null,
        }
      : null;

    await logAction(actionType, details, userInfo);
  };

  return { log };
};
