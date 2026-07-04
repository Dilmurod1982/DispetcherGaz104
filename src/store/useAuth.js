import { useEffect } from "react";
import useAuthStore from "../store/authStore";

const useAuth = () => {
  const { user, loading, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  return { user, loading };
};

export default useAuth;
