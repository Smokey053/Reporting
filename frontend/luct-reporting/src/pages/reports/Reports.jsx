import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";
import Card from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Tag from "../../components/ui/Tag.jsx";
import { format } from "date-fns";
import Button from "../../components/ui/Button.jsx";
import InputGroup from "../../components/ui/InputGroup.jsx";
import { Download, Search, X } from "lucide-react";

const endpointByRole = {
  lecturer: "/lecturer/reports",
  program_leader: "/pl/reports",
  principal_lecturer: "/prl/reports",
  student: "/student/reports",
};

const Reports = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      const endpoint = endpointByRole[user.role];
      if (!endpoint) {
        setRecords([]);
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get(endpoint);
        setRecords(data);
        setFilteredRecords(data);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load reports");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user.role]);

  // Filter reports based on search term and status
  useEffect(() => {
    let filtered = records;

    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.course?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.class?.code
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.topicTaught
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.lecturer?.firstName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.lecturer?.lastName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    setFilteredRecords(filtered);
  }, [searchTerm, statusFilter, records]);

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const response = await api.post(
        `/export/reports`,
        {
          format,
          filters: {
            facultyId: user.facultyId,
          },
        },
        {
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const timestamp = format(new Date(), "yyyyMMdd_HHmmss");
      const extension =
        format === "xlsx" ? "xlsx" : format === "csv" ? "csv" : "pdf";
      link.setAttribute("download", `reports_${timestamp}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to export reports");
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
  };

  if (loading) {
    return <p className="loading">Fetching reports...</p>;
  }

  if (error) {
    return (
      <EmptyState
        title="Reports unavailable"
        message={error}
        action={<Button onClick={() => window.location.reload()}>Retry</Button>}
      />
    );
  }

  const canExport =
    user.role === "program_leader" ||
    user.role === "principal_lecturer" ||
    user.role === "admin";

  return (
    <div className="reports-page">
      {/* Search and Filter Bar */}
      {records.length > 0 && (
        <Card className="filter-bar">
          <div className="filter-controls">
            <div className="search-group">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="clear-btn">
                  <X size={16} />
                </button>
              )}
            </div>

            <InputGroup
              label="Status"
              as="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </InputGroup>

            {(searchTerm || statusFilter) && (
              <Button variant="ghost" onClick={clearFilters} size="small">
                Clear Filters
              </Button>
            )}
          </div>

          {canExport && (
            <div className="export-actions">
              <span className="export-label">Export:</span>
              <Button
                variant="secondary"
                size="small"
                onClick={() => handleExport("csv")}
                disabled={exporting}
              >
                <Download size={16} />
                CSV
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => handleExport("xlsx")}
                disabled={exporting}
              >
                <Download size={16} />
                Excel
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => handleExport("pdf")}
                disabled={exporting}
              >
                <Download size={16} />
                PDF
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Results Count */}
      {records.length > 0 && (
        <div className="results-info">
          Showing {filteredRecords.length} of {records.length} reports
        </div>
      )}

      {/* Reports Grid */}
      {!filteredRecords.length && !loading ? (
        <EmptyState
          title={
            searchTerm || statusFilter
              ? "No matching reports"
              : "No records yet"
          }
          message={
            searchTerm || statusFilter
              ? "Try adjusting your search or filters"
              : "Once reports are captured, you will see them here."
          }
        />
      ) : (
        <div className="reports-grid">
          {filteredRecords.map((report) => (
            <Card
              key={report.id}
              title={report.course?.name || report.class?.code || "Report"}
            >
              <div className="report-meta">
                {(() => {
                  const source = report.dateOfLecture || report.createdAt;
                  if (!source) return null;
                  return (
                    <Tag tone="accent">
                      {format(new Date(source), "dd MMM yyyy")}
                    </Tag>
                  );
                })()}
                {report.status && <Tag tone="violet">{report.status}</Tag>}
                {report.class?.code && (
                  <Tag tone="neutral">{report.class.code}</Tag>
                )}
              </div>
              {report.lecturer && (
                <p className="muted">
                  Lecturer: {report.lecturer.firstName}{" "}
                  {report.lecturer.lastName}
                </p>
              )}
              {report.topicTaught && (
                <p className="muted">Topic: {report.topicTaught}</p>
              )}
              {report.attendancePercentage !== null && (
                <p className="muted">
                  Attendance: {report.actualStudentsPresent}/
                  {report.totalRegisteredStudents} (
                  {report.attendancePercentage}%)
                </p>
              )}
              {report.learningOutcomes && <p>{report.learningOutcomes}</p>}
              {report.recommendations && (
                <div className="report-actions">
                  <span>Recommendations</span>
                  <p>{report.recommendations}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <style jsx>{`
        .reports-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .filter-bar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .filter-controls {
          display: flex;
          gap: 1rem;
          align-items: end;
          flex-wrap: wrap;
        }

        .search-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          min-width: 250px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--divider);
          border-radius: 0.75rem;
          padding: 0.7rem 0.85rem;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text);
          font: inherit;
        }

        .clear-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0.25rem;
          border-radius: 4px;
        }

        .clear-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text);
        }

        .status-filter {
          min-width: 150px;
        }

        .export-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid var(--divider);
        }

        .export-label {
          color: var(--text-muted);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .results-info {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .reports-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }

        @media (max-width: 768px) {
          .filter-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-group {
            width: 100%;
          }

          .export-actions {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

export default Reports;
