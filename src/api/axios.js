import axios from "axios";
import { useAuth } from "../store/auth.store";
import { useLoader } from "../store/loader.store";

const api = axios.create({
  baseURL: "/userfacing", // Fallback to root for production API
  withCredentials: true, // ⬅️ enables cookies globally
});

const MUTATION_METHODS = new Set(["post", "put", "patch", "delete"]);

/** Monotonic id per in-flight mutating request (POST/PUT/PATCH/DELETE). */
let globalMutationLoaderSeq = 0;

api.interceptors.request.use((config) => {
  const method = String(config.method || "get").toLowerCase();
  if (MUTATION_METHODS.has(method) && !config.skipGlobalPostLoader) {
    const id = ++globalMutationLoaderSeq;
    const key = `axios-mutation-${id}`;
    config.__globalMutationLoaderKey = key;
    useLoader.getState().startLoading(key, "spinner");
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const token = localStorage.getItem("token") === "true";
      const { logout } = useAuth.getState();
      if (token) {
        logout();
      }
    }

    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const key = response.config?.__globalMutationLoaderKey;
    if (key) {
      useLoader.getState().stopLoading(key);
    }
    return response;
  },
  (error) => {
    const key = error.config?.__globalMutationLoaderKey;
    if (key) {
      useLoader.getState().stopLoading(key);
    }
    return Promise.reject(error);
  }
);

export default api;
