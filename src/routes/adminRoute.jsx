import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { isAdminAuthenticated } from "../utils/adminAuth.js";

export default function AdminRoute({ children }) {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    (async () => {
      const ok = await isAdminAuthenticated();
      setAllowed(ok);
    })();
  }, []);

  if (allowed === null) return null; // or loading screen
  if (!allowed) return <Navigate to="/login" replace />;

  return children ?? <Outlet />;
}
