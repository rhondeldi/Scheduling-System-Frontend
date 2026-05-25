// ===================== IMPORTS =====================
import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { hasAdminSessionHint, isAdminAuthenticated } from "../utils/adminAuth.js";

// ===================== MAIN COMPONENT =====================
export default function AdminRoute({ children }) {
  // ---- STATE ----
  const [allowed, setAllowed] = useState(() =>
    hasAdminSessionHint() ? true : null,
  );

  // ---- EFFECTS ----
  useEffect(() => {
    (async () => {
      const ok = await isAdminAuthenticated();
      setAllowed(ok);
    })();
  }, []);

  if (allowed === null) return null;
  if (!allowed) return <Navigate to="/login" replace />;

  return children ?? <Outlet />;
}
