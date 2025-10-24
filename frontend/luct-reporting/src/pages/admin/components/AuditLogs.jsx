import { useState, useEffect } from "react";
import api from "../../../services/api.js";
import Card from "../../../components/ui/Card.jsx";
import InputGroup from "../../../components/ui/InputGroup.jsx";
import "./AuditLogs.css";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    entityType: "",
    limit: 50,
    offset: 0,
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: filters.limit,
        offset: filters.offset,
      });

      if (filters.entityType) {
        params.append("entityType", filters.entityType);
      }

      const response = await api.get(`/admin/audit-logs?${params}`);
      setLogs(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch audit logs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      CREATE: "#4caf50",
      UPDATE: "#ff9800",
      DELETE: "#f44336",
      APPROVE: "#2196f3",
      REJECT: "#f44336",
    };
    return colors[action] || "#999";
  };

  const getActionIcon = (action) => {
    const icons = {
      CREATE: "✨",
      UPDATE: "✏️",
      DELETE: "🗑️",
      APPROVE: "✅",
      REJECT: "❌",
    };
    return icons[action] || "📝";
  };

  const getEntityColor = (type) => {
    const colors = {
      User: "#667eea",
      Faculty: "#764ba2",
      Program: "#4caf50",
      Course: "#ff9800",
      Class: "#2196f3",
      Report: "#f44336",
    };
    return colors[type] || "#999";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="audit-logs-container">
      <h2>Audit Logs</h2>

      {error && <div className="error-message">{error}</div>}

      {/* Filters */}
      <Card className="filters-card">
        <h3>Filters</h3>
        <div className="filters-grid">
          <InputGroup
            label="Entity Type"
            as="select"
            value={filters.entityType}
            onChange={(e) =>
              setFilters({ ...filters, entityType: e.target.value, offset: 0 })
            }
          >
            <option value="">All Types</option>
            <option value="User">User</option>
            <option value="Faculty">Faculty</option>
            <option value="Program">Program</option>
            <option value="Course">Course</option>
            <option value="Class">Class</option>
            <option value="Report">Report</option>
          </InputGroup>

          <InputGroup
            label="Results Per Page"
            type="number"
            value={filters.limit}
            onChange={(e) =>
              setFilters({
                ...filters,
                limit: parseInt(e.target.value) || 50,
                offset: 0,
              })
            }
            min="10"
            max="200"
          />
        </div>
      </Card>

      {/* Logs Table */}
      {loading ? (
        <div className="loading">Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <Card className="no-logs">
          <p>No audit logs found</p>
        </Card>
      ) : (
        <Card className="logs-card">
          <div className="logs-table-wrapper">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin</th>
                  <th>Entity Type</th>
                  <th>Action</th>
                  <th>Changes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={index} className="log-row">
                    <td className="timestamp">{formatDate(log.created_at)}</td>
                    <td className="admin-name">
                      {log.admin_name || `Admin #${log.admin_id}`}
                    </td>
                    <td>
                      <span
                        className="entity-type-badge"
                        style={{
                          backgroundColor: getEntityColor(log.entity_type),
                        }}
                      >
                        {log.entity_type}
                      </span>
                    </td>
                    <td>
                      <span
                        className="action-badge"
                        style={{
                          backgroundColor: getActionColor(log.action),
                        }}
                      >
                        {getActionIcon(log.action)} {log.action}
                      </span>
                    </td>
                    <td className="changes-cell">
                      {log.action === "DELETE" ? (
                        <span className="deleted-info">
                          Deleted ID: {log.entity_id}
                        </span>
                      ) : (
                        <LogChanges
                          oldValues={log.old_values}
                          newValues={log.new_values}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Info */}
          <div className="pagination-info">
            <p>
              Showing {logs.length} results
              {filters.entityType && ` for ${filters.entityType}`}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

// Helper component to display changes
const LogChanges = ({ oldValues, newValues }) => {
  const changes = [];

  if (oldValues && newValues) {
    const oldObj =
      typeof oldValues === "string" ? JSON.parse(oldValues) : oldValues || {};
    const newObj =
      typeof newValues === "string" ? JSON.parse(newValues) : newValues || {};

    Object.keys(newObj).forEach((key) => {
      if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        changes.push({
          field: key,
          old: oldObj[key],
          new: newObj[key],
        });
      }
    });
  }

  if (changes.length === 0) {
    return <span className="no-changes">No changes recorded</span>;
  }

  return (
    <div className="changes-detail">
      {changes.map((change, index) => (
        <div key={index} className="change-row">
          <span className="change-field">{change.field}:</span>
          <span className="change-value">
            {String(change.old).substring(0, 30)}
            {String(change.old).length > 30 ? "..." : ""}
            {" → "}
            {String(change.new).substring(0, 30)}
            {String(change.new).length > 30 ? "..." : ""}
          </span>
        </div>
      ))}
    </div>
  );
};

export default AuditLogs;
