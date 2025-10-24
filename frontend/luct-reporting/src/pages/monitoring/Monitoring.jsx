import { useEffect, useState } from "react";
import api from "../../services/api.js";
import Card from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Button from "../../components/ui/Button.jsx";
import InputGroup from "../../components/ui/InputGroup.jsx";
import Tag from "../../components/ui/Tag.jsx";
import { format } from "date-fns";

const template = {
  reportId: "",
  findings: "",
  recommendations: "",
  status: "pending",
};

const Monitoring = () => {
  const [records, setRecords] = useState([]);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({ ...template });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadData = async () => {
    try {
      const [monitoringRes, reportRes] = await Promise.all([
        api.get("/prl/monitoring"),
        api.get("/prl/reports"),
      ]);
      setRecords(monitoringRes.data);
      setReports(reportRes.data);
      const defaultReportId = reportRes.data[0]?.id?.toString() || "";
      setForm((prev) => ({
        ...prev,
        reportId: prev.reportId || defaultReportId,
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load monitoring data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    try {
      const payload = {
        ...form,
        reportId: form.reportId ? Number(form.reportId) : "",
      };
      await api.post("/prl/monitoring", payload);
      setSuccess("Monitoring note captured");
      setForm({
        ...template,
        reportId: reports[0]?.id ? String(reports[0].id) : "",
      });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to capture note");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="loading">Loading monitoring workspace...</p>;
  }

  return (
    <div className="monitoring-layout">
      <form className="monitoring-form" onSubmit={handleSubmit}>
        <h3>New observation</h3>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}
        <InputGroup
          label="Report"
          as="select"
          name="reportId"
          value={form.reportId}
          onChange={handleChange}
          required
          disabled={!reports.length}
        >
          <option value="" disabled>
            Select report
          </option>
          {reports.map((report) => (
            <option key={report.id} value={report.id}>
              {report.class?.code || report.course?.code} —{" "}
              {report.course?.name}
            </option>
          ))}
        </InputGroup>
        {!reports.length && (
          <p
            className="muted"
            style={{ marginTop: "-0.5rem", marginBottom: "1rem" }}
          >
            Submit lecturer reports before logging monitoring notes.
          </p>
        )}
        <InputGroup
          label="Findings"
          name="findings"
          value={form.findings}
          onChange={handleChange}
          required
        />
        <InputGroup
          label="Recommendations"
          as="textarea"
          name="recommendations"
          value={form.recommendations}
          onChange={handleChange}
          rows={3}
        />
        <InputGroup
          label="Status"
          as="select"
          name="status"
          value={form.status}
          onChange={handleChange}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="satisfactory">Satisfactory</option>
        </InputGroup>
        <Button type="submit" disabled={submitting || !reports.length}>
          {submitting ? "Saving..." : "Save note"}
        </Button>
      </form>
      <div className="monitoring-feed">
        <Card title="Monitoring feed">
          {records.length ? (
            <ul className="timeline">
              {records.map((item) => (
                <li key={item.id}>
                  <div className="timeline-dot" />
                  <div>
                    <div className="timeline-header">
                      <strong>
                        {item.report?.courseName || "Monitoring note"}
                      </strong>
                      <Tag tone="violet">{item.status}</Tag>
                    </div>
                    <p className="muted">
                      {item.report?.classCode && `${item.report.classCode} · `}
                      {(() => {
                        const dateSource =
                          item.report?.dateOfLecture || item.createdAt;
                        return dateSource
                          ? format(new Date(dateSource), "dd MMM yyyy")
                          : "";
                      })()}
                    </p>
                    {item.findings && <p>{item.findings}</p>}
                    {item.report?.topicTaught && (
                      <p className="muted">Topic: {item.report.topicTaught}</p>
                    )}
                    {item.recommendations && (
                      <p className="muted">
                        Recommendations: {item.recommendations}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No monitoring yet"
              message="Capture a class visit to start tracking impact."
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default Monitoring;
