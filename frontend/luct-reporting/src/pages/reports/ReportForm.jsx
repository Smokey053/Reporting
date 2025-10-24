import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";
import InputGroup from "../../components/ui/InputGroup.jsx";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";

const initialState = {
  classId: "",
  dateOfLecture: "",
  studentsPresent: "",
  topicTaught: "",
  learningOutcomes: "",
  recommendations: "",
};

const ReportForm = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ ...initialState });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data } = await api.get("/lecturer/classes");
        setClasses(data);
        if (data.length) {
          setForm((prev) => ({ ...prev, classId: prev.classId || data[0].id }));
        }
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load classes");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "studentsPresent" && value !== "" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/lecturer/reports", form);
      setSuccess("Report submitted successfully");
      setForm({ ...initialState, classId: form.classId });
      setTimeout(() => navigate("/reports"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (
    !["lecturer", "principal_lecturer", "program_leader"].includes(user.role)
  ) {
    return (
      <EmptyState
        title="Staff only"
        message="Only lecturers and academic staff can submit reports."
      />
    );
  }

  if (loading) {
    return <p className="loading">Loading teaching schedule...</p>;
  }

  if (!classes.length) {
    return (
      <EmptyState
        title="No classes assigned"
        message="You need an assigned class before submitting a report."
      />
    );
  }

  return (
    <form className="report-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <InputGroup
          label="Class"
          as="select"
          name="classId"
          value={form.classId}
          onChange={handleChange}
          required
        >
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.classCode} — {cls.course?.name}
            </option>
          ))}
        </InputGroup>
        <InputGroup
          label="Date of lecture"
          type="date"
          name="dateOfLecture"
          value={form.dateOfLecture}
          onChange={handleChange}
          required
        />
        <InputGroup
          label="Students present"
          type="number"
          name="studentsPresent"
          min="0"
          value={form.studentsPresent}
          onChange={handleChange}
          required
        />
      </div>
      {form.classId && (
        <p
          className="muted"
          style={{ marginTop: "-0.5rem", marginBottom: "1rem" }}
        >
          Registered students:{" "}
          {classes.find((cls) => cls.id === form.classId)
            ?.totalRegisteredStudents ?? "0"}
        </p>
      )}
      <InputGroup
        label="Topic taught"
        as="textarea"
        name="topicTaught"
        value={form.topicTaught}
        onChange={handleChange}
        placeholder="What did you cover?"
        rows={4}
        required
      />
      <InputGroup
        label="Learning outcomes"
        as="textarea"
        name="learningOutcomes"
        value={form.learningOutcomes}
        onChange={handleChange}
        rows={3}
        required
      />
      <InputGroup
        label="Recommendations"
        hint="Optional next steps"
        as="textarea"
        name="recommendations"
        value={form.recommendations}
        onChange={handleChange}
        rows={3}
      />
      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit report"}
      </Button>
    </form>
  );
};

export default ReportForm;
