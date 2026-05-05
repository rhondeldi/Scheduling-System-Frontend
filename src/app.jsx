import { Routes, Route } from "react-router-dom";

import Login from "./login/Login";
import Subjects from "./subjects/Subjects";
import Departments from "./departments/Departments";
import Curriculums from "./curriculums/CurriculumsTableList";
import Schedule from "./schedule/class_schedule";
import Rooms from "./rooms/Rooms";
import Instructors from "./instructors/InstructorPage";

import AdminRoute from "./routes/adminRoute";
import ProtectedRoute from "./routes/protectedRoute";

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
      </Route>

      {/* CATCH ALL */}
      <Route path="*" element={<div>Page not found</div>} />
    </Routes>
  );
}

export default App;
