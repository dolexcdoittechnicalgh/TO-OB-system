import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import CalendarPage from "./pages/calendar";
import Login from "./pages/Login";
import TOOBForm from "./pages/TOOBForm";
import ApprovingHome from "./pages/ApprovingHome";
import PassSlipInterface from "./pages/PassSlipInterface";

import { EditEmployee, StatisticsEmployee, TOSIGN } from "./pages/Functions";
import { OBESIGN } from "./pages/OBESIGN";
import AdminLayout from "./layouts/AdminLayout";
import { ContextProvider, useAppContext } from "./contexts/ContextProvider"; // Import context
import GuardLayout from "./layouts/GuardLayout";
import Unauthorized from "./pages/Unauthorized"; // adjust path if needed
function App() {
  return (
    <ContextProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<CalendarPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/to-form" element={<TOOBForm />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route element={<GuardLayout />}>
            <Route path="/PassSlipInterface" element={<PassSlipInterface />} />
          </Route>

          {/* Protected Routes under Admin Layout */}
          <Route element={<AdminLayout />}>
            <Route
              path="/approving-home"
              element={
                <ProtectedRoute allowedRoles={["admin", "evaluator"]}>
                  <ApprovingHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-employee"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <EditEmployee />
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistics-employee"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <StatisticsEmployee />
                </ProtectedRoute>
              }
            />
            <Route
              path="/obsign"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <OBESIGN />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tosign"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <TOSIGN />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </ContextProvider>
  );
}

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, userRole } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else if (!allowedRoles.includes(userRole)) {
      navigate("/"); // Redirect to home if role doesn't match
    }
  }, [token, userRole, allowedRoles, navigate]);

  // Only render children if conditions are met
  return token && allowedRoles.includes(userRole) ? children : null;
};

export default App;
