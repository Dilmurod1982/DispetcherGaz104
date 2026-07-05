import { useCallback } from "react";
import useAuthStore from "../store/authStore";
import { logAction } from "../services/logger";

export const useLogger = () => {
  const { user, userData } = useAuthStore();

  const log = useCallback(
    async (actionType, details = {}) => {
      const userInfo = user
        ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email,
            role: userData?.role || null,
          }
        : null;

      await logAction(actionType, details, userInfo);
    },
    [user, userData],
  );

  return { log };
};

export default useLogger;
