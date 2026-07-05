import { create } from "zustand";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase/config.js";

const useAuthStore = create((set, get) => ({
  user: null,
  userData: null,
  loading: true,
  error: null,
  logoutTimer: null,
  lastActivity: Date.now(),
  _isLoggingOut: false,

  // === Установка пользователя ===
  setUser: (user) => {
    set(() => {
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
        localStorage.removeItem("userData");
        localStorage.removeItem("lastActivityTime");
      }
      return { user };
    });
  },

  setUserData: (userData) => {
    set(() => {
      if (userData) {
        localStorage.setItem("userData", JSON.stringify(userData));
      } else {
        localStorage.removeItem("userData");
      }
      return { userData };
    });
  },

  // === Очистка таймера ===
  clearLogoutTimer: () => {
    const state = get();
    if (state.logoutTimer) {
      clearTimeout(state.logoutTimer);
      set({ logoutTimer: null });
    }
  },

  // === Обновление активности ===
  updateActivity: () => {
    const state = get();
    if (!state.user) return;

    const now = Date.now();
    set({ lastActivity: now });
    localStorage.setItem("lastActivityTime", now.toString());
    state.resetLogoutTimer();
  },

  // === Сброс таймера выхода ===
  resetLogoutTimer: () => {
    const state = get();
    state.clearLogoutTimer();

    if (!state.user) return;

    const SESSION_TIMEOUT = 10 * 60 * 1000;

    const timer = setTimeout(() => {
      state.autoLogout();
    }, SESSION_TIMEOUT);

    set({ logoutTimer: timer });
  },

  // === Автоматический выход ===
  autoLogout: async () => {
    const state = get();
    if (state._isLoggingOut || !state.user) return;

    console.log("Автоматический выход из-за бездействия");
    state._isLoggingOut = true;

    try {
      await signOut(auth);
      const { toast } = await import("react-toastify");
      toast.info("Актив бўлмаганингиз учун сеанс тугатилди!");
    } catch (error) {
      console.error("Ошибка при автоматическом выходе:", error);
    } finally {
      state.clearLogoutTimer();
      set({
        user: null,
        userData: null,
        loading: false,
        lastActivity: null,
        _isLoggingOut: false,
      });
      localStorage.removeItem("lastActivityTime");
      localStorage.removeItem("userData");
      localStorage.removeItem("user");
    }
  },

  // === Загрузка данных пользователя из Firestore ===
  loadUserData: async (user) => {
    if (!user || !user.email) {
      console.warn("No user or email provided for loadUserData");
      return null;
    }

    try {
      // console.log("🔄 Loading user data from Firestore for:", user.email);

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", user.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // console.warn("❌ User not found in Firestore:", user.email);
        const newUserData = {
          email: user.email,
          uid: user.uid,
          displayName: user.displayName || user.email,
          role: "guest",
          isActive: true,
          createdAt: new Date(),
        };

        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, newUserData);
        // console.log("✅ New user document created:", user.email);

        get().setUserData(newUserData);
        return newUserData;
      }

      const userDoc = querySnapshot.docs[0];
      const userDataFromFirestore = userDoc.data();

      // console.log("✅ User data loaded:", userDataFromFirestore);

      get().setUserData(userDataFromFirestore);
      return userDataFromFirestore;
    } catch (error) {
      console.error("❌ Error loading user data:", error);
      return null;
    }
  },

  // === Вход в систему ===
  login: async (email, password) => {
    try {
      // console.log("Попытка входа:", email);
      set({ loading: true, error: null, _isLoggingOut: false });

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // console.log("Успешный вход:", user.email);

      get().setUser(user);
      const userData = await get().loadUserData(user);

      const now = Date.now();
      set({
        lastActivity: now,
        loading: false,
        error: null,
      });
      localStorage.setItem("lastActivityTime", now.toString());

      get().resetLogoutTimer();

      return {
        success: true,
        user,
        userData,
      };
    } catch (error) {
      // console.error("Ошибка входа:", error.code, error.message);

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

      set({
        error: errorMessage,
        loading: false,
      });

      return { success: false, error: errorMessage };
    }
  },

  // === Выход из системы ===
  logout: async () => {
    const state = get();
    if (state._isLoggingOut) return;

    state._isLoggingOut = true;
    state.clearLogoutTimer();

    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      set({
        user: null,
        userData: null,
        loading: false,
        error: null,
        lastActivity: null,
        _isLoggingOut: false,
      });
      localStorage.removeItem("lastActivityTime");
      localStorage.removeItem("userData");
      localStorage.removeItem("user");
    }
  },

  // === Инициализация аутентификации ===
  initAuth: () => {
    try {
      const savedUser = localStorage.getItem("user");
      const savedUserData = localStorage.getItem("userData");
      const savedLastActivity = localStorage.getItem("lastActivityTime");

      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          let userData = null;

          if (savedUserData) {
            userData = JSON.parse(savedUserData);
            set({ user, userData, loading: false });
          } else {
            get()
              .loadUserData(user)
              .then((data) => {
                set({ user, userData: data, loading: false });
              });
          }

          if (savedLastActivity) {
            const timeSinceLastActivity =
              Date.now() - parseInt(savedLastActivity);
            const SESSION_TIMEOUT = 10 * 60 * 1000;

            if (timeSinceLastActivity > SESSION_TIMEOUT) {
              // console.log("Сессия истекла при загрузке");
              get().logout();
            } else {
              set({ lastActivity: parseInt(savedLastActivity) });
              get().resetLogoutTimer();
            }
          } else {
            const now = Date.now();
            set({ lastActivity: now });
            localStorage.setItem("lastActivityTime", now.toString());
            get().resetLogoutTimer();
          }
        } catch (e) {
          // console.error("Error parsing saved user:", e);
          localStorage.removeItem("user");
          localStorage.removeItem("userData");
          localStorage.removeItem("lastActivityTime");
          set({ loading: false });
        }
      } else {
        set({ loading: false });
      }

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        // console.log("Auth state changed:", user ? user.email : "No user");

        if (get()._isLoggingOut) {
          // console.log("Logging out in progress, ignoring auth state change");
          return;
        }

        if (user) {
          const currentUser = get().user;
          if (currentUser && currentUser.uid === user.uid) {
            // console.log("User already exists, skipping");
            set({ loading: false });
            return;
          }

          get().setUser(user);
          const userData = await get().loadUserData(user);

          const now = Date.now();
          set({
            user,
            userData,
            loading: false,
            error: null,
            lastActivity: now,
          });
          localStorage.setItem("lastActivityTime", now.toString());
          get().resetLogoutTimer();
        } else {
          // console.log("User logged out");
          const currentUser = get().user;
          if (currentUser) {
            const state = get();
            state.clearLogoutTimer();
            set({
              user: null,
              userData: null,
              loading: false,
              lastActivity: null,
            });
            localStorage.removeItem("lastActivityTime");
            localStorage.removeItem("userData");
            localStorage.removeItem("user");
          } else {
            set({ loading: false });
          }
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error("Ошибка initAuth:", error);
      set({ loading: false });
      return () => {};
    }
  },

  // === Проверка прав пользователя ===
  hasRole: (role) => {
    const state = get();
    if (!state.userData) return false;
    return state.userData.role === role;
  },

  // === Проверка является ли пользователь администратором ===
  isAdmin: () => {
    const state = get();
    if (!state.userData) return false;
    return state.userData.role === "admin" || state.userData.role === "Админ";
  },

  // === Проверка является ли пользователь dilik@mail.ru ===
  isDilik: () => {
    const state = get();
    if (!state.user) return false;
    return state.user.email === "dilik@mail.ru";
  },

  // === Получение роли пользователя ===
  getUserRole: () => {
    const state = get();
    return state.userData?.role || null;
  },
}));

export default useAuthStore;
