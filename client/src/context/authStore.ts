import { create } from "zustand";
import { API_URL } from "@/config";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN" | "STAFF" | "SUPER_ADMIN";
  isActive: boolean;
  createdAt: string;
  addresses?: any[];
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; resetCode?: string; message?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
}

const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("zendora_token");
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: getStoredToken(),
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("zendora_token", data.data.token);
        set({
          user: data.data.user,
          token: data.data.token,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        set({ error: data.error, isLoading: false });
        return false;
      }
    } catch (err: any) {
      set({ error: err.message || "Login failed.", isLoading: false });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("zendora_token", data.data.token);
        set({
          user: data.data.user,
          token: data.data.token,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        set({ error: data.error, isLoading: false });
        return false;
      }
    } catch (err: any) {
      set({ error: err.message || "Registration failed.", isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("zendora_token");
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  loadUser: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        set({
          user: data.data,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Token expired or invalid
        localStorage.removeItem("zendora_token");
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      set({ isLoading: false });
      return { success: data.success, resetCode: data.resetCode, message: data.message };
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return { success: false, message: err.message };
    }
  },

  resetPassword: async (email, code, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      set({ isLoading: false });
      return { success: data.success, message: data.message || data.error };
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return { success: false, message: err.message };
    }
  },

  clearError: () => set({ error: null }),
}));
