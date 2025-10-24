import { useState } from "react";
import api from "../../../services/api.js";
import Button from "../../../components/ui/Button.jsx";
import Card from "../../../components/ui/Card.jsx";
import InputGroup from "../../../components/ui/InputGroup.jsx";
import "./Export.css";

const Export = () => {
  const [exportType, setExportType] = useState("reports");
  const [format, setFormat] = useState("csv");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "",
  });

  const handleExport = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const requestBody = {
        format,
        filters,
        scope: "all",
      };

      let endpoint = `/export/${exportType}`;

      // Determine content type based on format
      const contentTypes = {
        csv: "text/csv",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        pdf: "application/pdf",
        json: "application/json",
      };

      const response = await api.post(endpoint, requestBody, {
        responseType: format === "json" ? "json" : "blob",
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: contentTypes[format] || "application/octet-stream",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${exportType}-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Export completed successfully!" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Export failed",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-container">
      <h2>Export Data</h2>

      {message && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <Card className="export-form-card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExport();
          }}
        >
          {/* Export Type */}
          <InputGroup
            label="What to Export"
            as="select"
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
          >
            <option value="reports">Reports</option>
            <option value="users">Users</option>
            <option value="programs">Programs</option>
          </InputGroup>

          {/* Format */}
          <InputGroup
            label="Export Format"
            as="select"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="csv">CSV</option>
            <option value="xlsx">Excel (XLSX)</option>
            <option value="pdf">PDF</option>
            <option value="json">JSON</option>
          </InputGroup>

          {/* Filters */}
          <div className="filter-section">
            <h3>Filters (Optional)</h3>
            <div className="filters-grid">
              <InputGroup
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
              <InputGroup
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
              {exportType === "reports" && (
                <InputGroup
                  label="Status"
                  as="select"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                >
                  <option value="">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                </InputGroup>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="export-actions">
            <Button type="submit" disabled={loading}>
              {loading ? "Exporting..." : "Export"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Export Information */}
      <Card className="export-info">
        <h3>Export Information</h3>
        <ul>
          <li>Select the data type you want to export</li>
          <li>Choose between CSV, XLSX (Excel), PDF, or JSON format</li>
          <li>Apply filters to narrow down the data</li>
          <li>Click Export to download the file</li>
          <li>All exports are logged for audit purposes</li>
        </ul>
      </Card>
    </div>
  );
};

export default Export;
