// ===================== IMPORTS =====================
import { useEffect, useState } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";

import Login from "./login/Login";
import AccountSettings from "./accountSettings";
import Subjects from "./subjects/Subjects";
import Departments from "./departments/Departments";
import Curriculums from "./curriculums/CurriculumsTableList";
import Schedule from "./schedule/class_schedule";
import Rooms from "./rooms/Rooms";
import Instructors from "./instructors/InstructorPage";

import AdminRoute from "./routes/adminRoute";
import ProtectedRoute from "./routes/protectedRoute";
import { isAdminAuthenticated } from "./utils/adminAuth";
import { fetchWho } from "./js/departments";

function AccountSettingsRoute() {
  const location = useLocation();
  const [accountType, setAccountType] = useState(location.state?.accountType || null);

  useEffect(() => {
    if (accountType) return;

    (async () => {
      const isAdmin = await isAdminAuthenticated();
      if (isAdmin) {
        setAccountType("admin");
        return;
      }

      try {
        const who = await fetchWho();
        setAccountType(who !== "no one is logged in" ? "department" : "unauthorized");
      } catch {
        setAccountType("unauthorized");
      }
    })();
  }, [accountType]);

  if (accountType === null) return null;
  if (accountType === "unauthorized") return <Navigate to="/login" replace />;

  return <AccountSettings accountType={accountType} />;
}

// ===================== MAIN COMPONENT =====================
function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="" element={<Login />} />
      <Route path="/login" element={<Login />} />

      {/* DEPARTMENT ROUTES */}
      <Route element={<ProtectedRoute />}>
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/instructors" element={<Instructors />} />
      </Route>

      {/* ADMIN ROUTES */}
      <Route element={<AdminRoute />}>
        <Route path="/departments" element={<Departments />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/curriculums" element={<Curriculums />} />
        <Route path="/admin-rooms" element={<Rooms adminMode={true} pageName="admin-rooms" />} />
        <Route path="/admin-instructors" element={<Instructors adminMode={true} pageName="admin-instructors" />} />
      </Route>

      {/* SHARED AUTHENTICATED ROUTES */}
      <Route path="/account-settings" element={<AccountSettingsRoute />} />

      {/* CATCH ALL */}
      <Route path="*" element={<div>Page not found</div>} />
    </Routes>
  );
}

export default App;
