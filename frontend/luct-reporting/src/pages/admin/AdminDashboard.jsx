import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api.js";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import FacultyManagement from "./components/FacultyManagement";
import ProgramManagement from "./components/ProgramManagement";
import CourseManagement from "./components/CourseManagement";
import UserManagement from "./components/UserManagement";
import RegistrationCodeManagement from "./components/RegistrationCodeManagement";
import LecturerAssignment from "./components/LecturerAssignment";
import Analytics from "./components/Analytics";
import Search from "./components/Search";
import AuditLogs from "./components/AuditLogs";
import Export from "./components/Export";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchStatistics();
    }
  }, [user]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/statistics");
      setStatistics(response.data);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch statistics"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="admin-overview">
      <div className="stats-grid">
        <Card title="Total Users" subtle>
          <div className="stat-value">{statistics?.totalUsers || 0}</div>
          <div className="stat-breakdown">
            {Object.entries(statistics?.usersByRole || {}).map(
              ([role, count]) => (
                <div key={role} className="stat-row">
                  <span className="stat-label">
                    {role.replace(/_/g, " ").toUpperCase()}
                  </span>
                  <span className="stat-count">{count}</span>
                </div>
              )
            )}
          </div>
        </Card>

        <Card title="Academic Structure" subtle>
          <div className="stat-item">
            <span>Faculties:</span>
            <strong>{statistics?.totalFaculties || 0}</strong>
          </div>
          <div className="stat-item">
            <span>Programs:</span>
            <strong>{statistics?.totalPrograms || 0}</strong>
          </div>
          <div className="stat-item">
            <span>Courses:</span>
            <strong>{statistics?.totalCourses || 0}</strong>
          </div>
        </Card>

        <Card title="System Activity" subtle>
          <div className="stat-item">
            <span>Total Reports:</span>
            <strong>{statistics?.totalReports || 0}</strong>
          </div>
          <div className="stat-item">
            <span>Pending Approvals:</span>
            <strong className="alert">
              {statistics?.pendingApprovals || 0}
            </strong>
          </div>
          <div className="stat-item">
            <span>Active Reg. Codes:</span>
            <strong>{statistics?.activeRegistrationCodes || 0}</strong>
          </div>
        </Card>

        <Card title="Report Status" subtle>
          {Object.entries(statistics?.reportsByStatus || {}).map(
            ([status, count]) => (
              <div key={status} className="stat-row">
                <span className="stat-label">{status || "Pending"}</span>
                <span className="stat-count">{count}</span>
              </div>
            )
          )}
        </Card>
      </div>
    </div>
  );

  const renderFaculties = () => <FacultyManagement />;

  const renderPrograms = () => <ProgramManagement />;

  const renderCourses = () => <CourseManagement />;

  const renderUsers = () => <UserManagement />;

  const renderRegistrationCodes = () => <RegistrationCodeManagement />;

  if (!user || user.role !== "admin") {
    return (
      <div className="dashboard">
        <div className="error-state">
          <h2>Access Denied</h2>
          <p>You do not have permission to access the admin workspace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Workspace</h1>
        <p>Manage all system resources, users, and settings</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
        <button
          className={`tab ${activeTab === "search" ? "active" : ""}`}
          onClick={() => setActiveTab("search")}
        >
          Search
        </button>
        <button
          className={`tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
        <button
          className={`tab ${activeTab === "faculties" ? "active" : ""}`}
          onClick={() => setActiveTab("faculties")}
        >
          Faculties
        </button>
        <button
          className={`tab ${activeTab === "programs" ? "active" : ""}`}
          onClick={() => setActiveTab("programs")}
        >
          Programs
        </button>
        <button
          className={`tab ${activeTab === "courses" ? "active" : ""}`}
          onClick={() => setActiveTab("courses")}
        >
          Courses
        </button>
        <button
          className={`tab ${activeTab === "assignments" ? "active" : ""}`}
          onClick={() => setActiveTab("assignments")}
        >
          Lecturer Assignment
        </button>
        <button
          className={`tab ${activeTab === "codes" ? "active" : ""}`}
          onClick={() => setActiveTab("codes")}
        >
          Registration Codes
        </button>
        <button
          className={`tab ${activeTab === "audit" ? "active" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          Audit Logs
        </button>
        <button
          className={`tab ${activeTab === "export" ? "active" : ""}`}
          onClick={() => setActiveTab("export")}
        >
          Export
        </button>
      </div>

      <div className="admin-content">
        {loading && <div className="loading">Loading...</div>}

        {!loading && activeTab === "overview" && renderOverview()}
        {!loading && activeTab === "analytics" && <Analytics />}
        {!loading && activeTab === "search" && <Search />}
        {!loading && activeTab === "users" && renderUsers()}
        {!loading && activeTab === "faculties" && renderFaculties()}
        {!loading && activeTab === "programs" && renderPrograms()}
        {!loading && activeTab === "courses" && renderCourses()}
        {!loading && activeTab === "assignments" && <LecturerAssignment />}
        {!loading && activeTab === "codes" && renderRegistrationCodes()}
        {!loading && activeTab === "audit" && <AuditLogs />}
        {!loading && activeTab === "export" && <Export />}
      </div>
    </div>
  );
};

export default AdminDashboard;
