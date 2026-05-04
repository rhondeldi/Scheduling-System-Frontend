import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { fetchWho } from "../js/departments.js";

export default function ProtectedRoute({ children }) {
  const [allowed, setAllowed] = useState(null);

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

  if (allowed === null) return <div>Loading...</div>;

  if (!allowed) return <Navigate to="/login" replace />;

  return children ?? <Outlet />;
}
