import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { authApi, profileApi, notificationApi, attendanceApi } from '../api/services';
import type { User, EmployeeItem, AttendanceRecord, NotificationItem, Role } from '../types';
import { toast } from 'sonner';

interface AppContextType {
  user: User | null;
  employee: EmployeeItem | null;
  theme: 'light' | 'dark';
  isLoading: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  todayAttendance: AttendanceRecord | null;
  signIn: (identifier: string, password?: string, role?: Role) => Promise<{ success: boolean; message?: string }>;
  signUp: (name: string, email: string, password?: string, role?: Role) => Promise<{ success: boolean; message?: string }>;
  signOut: () => void;
  toggleTheme: () => void;
  refreshProfile: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshTodayAttendance: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const Context = createContext<AppContextType | null>(null);

const readLocal = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readLocal('dayflow_user', null));
  const [employee, setEmployee] = useState<EmployeeItem | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => readLocal('dayflow_theme', 'light'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    localStorage.setItem('dayflow_theme', JSON.stringify(theme));
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('dayflow_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await profileApi.get();
      if (res.success && res.data) {
        setEmployee(res.data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    const token = localStorage.getItem('dayflow_token');
    if (!token) return;
    try {
      const res = await notificationApi.getAll();
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  const refreshTodayAttendance = useCallback(async () => {
    const token = localStorage.getItem('dayflow_token');
    if (!token) return;
    try {
      const res = await attendanceApi.getMyAttendance();
      if (res.success && res.data) {
        setTodayAttendance(res.data.todayRecord || null);
      }
    } catch (err) {
      console.error('Error fetching attendance status:', err);
    }
  }, []);

  // Initialize and verify session on load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('dayflow_token');
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.success && res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('dayflow_user', JSON.stringify(res.data.user));
            await Promise.all([refreshProfile(), refreshNotifications(), refreshTodayAttendance()]);
          } else {
            setUser(null);
            localStorage.removeItem('dayflow_token');
            localStorage.removeItem('dayflow_user');
          }
        } catch {
          setUser(null);
          localStorage.removeItem('dayflow_token');
          localStorage.removeItem('dayflow_user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [refreshProfile, refreshNotifications, refreshTodayAttendance]);

  const signIn = async (identifier: string, password = 'Employee@123', role: Role = 'employee') => {
    try {
      setIsLoading(true);
      // Auto-fallback for demo speed if standard password used
      const effectivePassword = password || (role === 'admin' ? 'Admin@123' : 'Employee@123');
      const res = await authApi.login({
        email: identifier,
        password: effectivePassword,
      });

      if (res.success && res.data) {
        localStorage.setItem('dayflow_token', res.data.token);
        localStorage.setItem('dayflow_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        await Promise.all([refreshProfile(), refreshNotifications(), refreshTodayAttendance()]);
        toast.success(`Welcome back, ${res.data.user.name}!`);
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid email or password. Please try again.';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password = 'Dayflow@123', role: Role = 'employee') => {
    try {
      setIsLoading(true);
      const res = await authApi.signup({
        name,
        email,
        password: password || 'Dayflow@123',
        role,
      });

      if (res.success && res.data) {
        localStorage.setItem('dayflow_token', res.data.token);
        localStorage.setItem('dayflow_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        await Promise.all([refreshProfile(), refreshNotifications(), refreshTodayAttendance()]);
        toast.success(`Account created! Welcome to Dayflow, ${res.data.user.name}.`);
        return { success: true };
      }
      return { success: false, message: res.message || 'Signup failed' };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not create account. Please check your information.';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('dayflow_token');
    localStorage.removeItem('dayflow_user');
    setUser(null);
    setEmployee(null);
    setTodayAttendance(null);
    setNotifications([]);
    toast.info('Signed out successfully');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const markNotificationRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  return (
    <Context.Provider
      value={{
        user,
        employee,
        theme,
        isLoading,
        notifications,
        unreadCount,
        todayAttendance,
        signIn,
        signUp,
        signOut,
        toggleTheme,
        refreshProfile,
        refreshNotifications,
        refreshTodayAttendance,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useApp() {
  const context = useContext(Context);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}