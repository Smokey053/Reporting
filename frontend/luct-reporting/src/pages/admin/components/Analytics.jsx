import { useState, useEffect } from "react";
import api from "../../../services/api.js";
import Card from "../../../components/ui/Card.jsx";
import "./Analytics.css";

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/analytics");
      setAnalytics(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch analytics");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!analytics) return null;

  return (
    <div className="analytics-container">
      <h2>System Analytics</h2>

      {/* Health Metrics */}
      <div className="metrics-grid">
        <Card className="metric-card">
          <h3>Total Users</h3>
          <div className="metric-value">
            {analytics.healthMetrics?.totalUsers || 0}
          </div>
        </Card>
        <Card className="metric-card">
          <h3>Total Reports</h3>
          <div className="metric-value">
            {analytics.healthMetrics?.totalReports || 0}
          </div>
        </Card>
        <Card className="metric-card">
          <h3>Active Faculties</h3>
          <div className="metric-value">
            {analytics.healthMetrics?.activeFaculties || 0}
          </div>
        </Card>
        <Card className="metric-card">
          <h3>Total Courses</h3>
          <div className="metric-value">
            {analytics.healthMetrics?.totalCourses || 0}
          </div>
        </Card>
      </div>

      {/* Users by Role */}
      <Card className="analytics-card">
        <h3>Users by Role</h3>
        <div className="chart-container">
          {analytics.usersByRole?.map((item) => (
            <div key={item.role} className="role-stat">
              <span className="label">{item.role.replace(/_/g, " ")}</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${
                      (item.count /
                        (analytics.healthMetrics?.totalUsers || 1)) *
                      100
                    }%`,
                  }}
                />
              </div>
              <span className="count">{item.count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Programs by Faculty */}
      <Card className="analytics-card">
        <h3>Programs by Faculty</h3>
        <div className="faculty-stats">
          {analytics.programsByFaculty?.map((item) => (
            <div key={item.faculty} className="faculty-stat">
              <span className="faculty-name">
                {item.faculty || "Unassigned"}
              </span>
              <span className="program-count">{item.count} programs</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Approval Stats */}
      <Card className="analytics-card">
        <h3>User Approval Status</h3>
        <div className="approval-stats">
          <div className="stat-item approved">
            <span className="label">Approved</span>
            <span className="value">
              {analytics.approvalStats?.approved || 0}
            </span>
          </div>
          <div className="stat-item pending">
            <span className="label">Pending</span>
            <span className="value">
              {analytics.approvalStats?.pending || 0}
            </span>
          </div>
          <div className="stat-item">
            <span className="label">Total Staff</span>
            <span className="value">{analytics.approvalStats?.total || 0}</span>
          </div>
        </div>
      </Card>

      {/* Course Stats */}
      <Card className="analytics-card">
        <h3>Course Statistics</h3>
        <div className="course-stats">
          <div className="stat-row">
            <span>Total Courses</span>
            <strong>{analytics.courseStats?.totalCourses || 0}</strong>
          </div>
          <div className="stat-row">
            <span>Programs with Courses</span>
            <strong>{analytics.courseStats?.programsWithCourses || 0}</strong>
          </div>
        </div>
      </Card>

      {/* Report Trends (Last 30 days) */}
      <Card className="analytics-card">
        <h3>Report Submission Trends (Last 30 Days)</h3>
        <div className="trends-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Total</th>
                <th>Submitted</th>
                <th>Draft</th>
              </tr>
            </thead>
            <tbody>
              {analytics.reportTrends?.slice(0, 10).map((trend) => (
                <tr key={trend.date}>
                  <td>{trend.date}</td>
                  <td>{trend.count}</td>
                  <td className="submitted">{trend.submitted || 0}</td>
                  <td className="draft">{trend.draft || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
