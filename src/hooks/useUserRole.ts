import { useCallback, useEffect, useState } from "react";

export type UserRole = "buyer" | "seller";

const KEY = "orin.userRole";

function read(): UserRole | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "buyer" || v === "seller" ? v : null;
  } catch {
    return null;
  }
}

export function useUserRole() {
  const [role, setRoleState] = useState<UserRole | null>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setRoleState(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setRole = useCallback((next: UserRole) => {
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    setRoleState(next);
  }, []);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setRoleState(null);
  }, []);

  return { role, setRole, clear };
}
