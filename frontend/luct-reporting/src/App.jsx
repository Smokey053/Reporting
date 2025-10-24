import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell.jsx";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import Reports from "./pages/reports/Reports.jsx";
import ReportForm from "./pages/reports/ReportForm.jsx";
import Classes from "./pages/classes/Classes.jsx";
import Monitoring from "./pages/monitoring/Monitoring.jsx";
import Ratings from "./pages/ratings/Ratings.jsx";
import Programs from "./pages/programs/Programs.jsx";
import { useAuth } from "./context/AuthContext.jsx";

const App = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/" replace />}
      />
      <Route
        path="/register"
        element={!user ? <Register /> : <Navigate to="/" replace />}
      />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/classes" element={<Classes />} />
        <Route
          element={
            <ProtectedRoute
              roles={["lecturer", "principal_lecturer", "program_leader"]}
            />
          }
        >
          <Route path="/reports/new" element={<ReportForm />} />
        </Route>
        <Route
          element={
            <ProtectedRoute roles={["principal_lecturer", "program_leader"]} />
          }
        >
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/ratings" element={<Ratings />} />
        </Route>
        <Route element={<ProtectedRoute roles={["program_leader"]} />}>
          <Route path="/programs" element={<Programs />} />
        </Route>
        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to={user ? "/" : "/login"} replace />}
      />
    </Routes>
  );
};

export default App;
