import { useEffect } from "react";
import useAuthStore from "../store/authStore";

const useActivityTracker = () => {
  const { updateActivity, user } = useAuthStore();

  useEffect(() => {
    // Если пользователь не залогинен, не отслеживаем активность
    if (!user) return;

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "keypress",
      "wheel",
      "touchmove",
      "touchend",
      "focus",
      "input",
    ];

    let timeoutId = null;

    const handleActivity = () => {
      updateActivity();
    };

    const debouncedHandleActivity = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        handleActivity();
        timeoutId = null;
      }, 1000);
    };

    events.forEach((event) => {
      document.addEventListener(event, debouncedHandleActivity);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, debouncedHandleActivity);
      });
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [updateActivity, user]);
};

export default useActivityTracker;
