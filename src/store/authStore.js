import { create } from "zustand";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { toast } from "react-toastify";
import { auth } from "../firebase/config.js";

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,
  logoutTimer: null,
  lastActivity: Date.now(),

  // === Обновление активности ===
  updateActivity: () => {
    const now = Date.now();
    set({ lastActivity: now });
    localStorage.setItem("lastActivityTime", now.toString());
    const state = get();
    state.resetLogoutTimer();
  },

  // === Сброс таймера выхода ===
  resetLogoutTimer: () => {
    const state = get();
    if (state.logoutTimer) {
      clearTimeout(state.logoutTimer);
      set({ logoutTimer: null });
    }

    const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 минут

    const timer = setTimeout(() => {
      state.autoLogout();
    }, SESSION_TIMEOUT);

    set({ logoutTimer: timer });
  },

  // === Автоматический выход ===
  autoLogout: async () => {
    console.log("Автоматический выход из-за бездействия");

    // Показываем тостер перед выходом
    toast.warning(
      "Актив бўлмаганингиз учун сеанс тугатилди! / Сеанс завершен из-за бездействия!",
      {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      },
    );

    try {
      await signOut(auth);
    } catch (error) {
      console.error("Ошибка при автоматическом выходе:", error);
    } finally {
      set({
        user: null,
        loading: false,
        logoutTimer: null,
        lastActivity: null,
      });
      localStorage.removeItem("user");
      localStorage.removeItem("userData");
      localStorage.removeItem("lastActivityTime");

      // Перенаправляем на страницу логина через 1 секунду (чтобы тостер показался)
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    }
  },

  // === Вход в систему ===
  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      console.log("Попытка входа:", email);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      console.log("Успешный вход:", user.email);

      // Показываем тостер при успешном входе
      toast.success("Xush kelibsiz! / Добро пожаловать!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Сохраняем пользователя
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("lastActivityTime", Date.now().toString());

      set({
        user,
        loading: false,
        error: null,
        lastActivity: Date.now(),
      });

      // Запускаем таймер бездействия
      get().resetLogoutTimer();

      return { success: true };
    } catch (error) {
      console.error("Ошибка входа:", error.code, error.message);

      let errorMessage = error.message;
      if (error.code === "auth/user-not-found") {
        errorMessage = "Foydalanuvchi topilmadi / Пользователь не найден";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Noto'g'ri parol / Неверный пароль";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage =
          "Juda ko'p urinishlar. Keyinroq urinib ko'ring / Слишком много попыток";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Noto'g'ri email / Неверный email";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Tarmoq xatosi. Internetni tekshiring / Ошибка сети";
      }

      // Показываем тостер при ошибке
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // === Выход из системы ===
  logout: async () => {
    try {
      if (get().logoutTimer) {
        clearTimeout(get().logoutTimer);
        set({ logoutTimer: null });
      }

      // Показываем тостер при выходе
      toast.info("Tizimdan chiqildi / Выход из системы", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      await signOut(auth);
    } catch (error) {
      console.error("Ошибка выхода:", error);
    } finally {
      set({
        user: null,
        loading: false,
        logoutTimer: null,
        lastActivity: null,
      });
      localStorage.removeItem("user");
      localStorage.removeItem("userData");
      localStorage.removeItem("lastActivityTime");
    }
  },

  // === Инициализация аутентификации ===
  initAuth: () => {
    try {
      // Проверяем localStorage при инициализации
      const savedUser = localStorage.getItem("user");
      const lastActivity = localStorage.getItem("lastActivityTime");

      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);

          // Проверяем время бездействия
          if (lastActivity) {
            const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
            const SESSION_TIMEOUT = 5 * 60 * 1000;

            if (timeSinceLastActivity > SESSION_TIMEOUT) {
              // Сессия истекла
              console.log("Сессия истекла");
              localStorage.removeItem("user");
              localStorage.removeItem("lastActivityTime");
              set({ user: null, loading: false });
            } else {
              set({
                user,
                loading: false,
                lastActivity: parseInt(lastActivity),
              });
              // Запускаем таймер бездействия
              get().resetLogoutTimer();
            }
          } else {
            set({ user, loading: false });
            get().resetLogoutTimer();
          }
        } catch (e) {
          localStorage.removeItem("user");
          set({ loading: false });
        }
      } else {
        set({ loading: false });
      }

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log("Auth state changed:", user ? user.email : "No user");

        if (user) {
          set({ user, loading: false });
          localStorage.setItem("user", JSON.stringify(user));
          get().resetLogoutTimer();
        } else {
          if (get().logoutTimer) {
            clearTimeout(get().logoutTimer);
            set({ logoutTimer: null });
          }
          set({ user: null, loading: false });
          localStorage.removeItem("user");
          localStorage.removeItem("lastActivityTime");
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error("Ошибка initAuth:", error);
      set({ loading: false });
    }
  },
}));

export default useAuthStore;
