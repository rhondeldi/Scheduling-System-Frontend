// ===================== IMPORTS =====================
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { fetchWho } from "../js/departments.js";

// ===================== MAIN COMPONENT =====================
export default function ProtectedRoute({ children }) {
  // ---- STATE ----
  const [allowed, setAllowed] = useState(() =>
    localStorage.getItem("departmentCode") ? true : null,
  );

  // ---- EFFECTS ----
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const who = await fetchWho();
        setAllowed(who !== "no one is logged in");
      } catch {
        setAllowed(false);
      }
    };

    checkAuth();
  }, []);

  if (allowed === null) return null;

  if (!allowed) return <Navigate to="/login" replace />;

  return children ?? <Outlet />;
}
