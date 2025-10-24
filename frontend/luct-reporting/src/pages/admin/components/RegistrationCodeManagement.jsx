import { useState, useEffect } from "react";
import api from "../../../services/api.js";
import Button from "../../../components/ui/Button.jsx";
import Card from "../../../components/ui/Card.jsx";
import InputGroup from "../../../components/ui/InputGroup.jsx";

const RegistrationCodeManagement = () => {
  const [codes, setCodes] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    role: "lecturer",
    facultyId: "",
    expiresAt: "",
  });

  useEffect(() => {
    fetchCodes();
    fetchFaculties();
  }, []);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/registration-codes");
      setCodes(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch registration codes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await api.get("/admin/faculties");
      setFaculties(response.data);
    } catch (err) {
      console.error("Failed to fetch faculties");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role) {
      setError("Role is required");
      return;
    }

    try {
      setLoading(true);
      await api.post("/admin/registration-codes", formData);
      setFormData({
        role: "lecturer",
        facultyId: "",
        expiresAt: "",
      });
      setShowForm(false);
      fetchCodes();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (window.confirm("Are you sure you want to deactivate this code?")) {
      try {
        setLoading(true);
        await api.post(`/admin/registration-codes/${id}/deactivate`);
        fetchCodes();
      } catch (err) {
        setError("Failed to deactivate code");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this code?")) {
      try {
        setLoading(true);
        await api.delete(`/admin/registration-codes/${id}`);
        fetchCodes();
      } catch (err) {
        setError("Failed to delete code");
      } finally {
        setLoading(false);
      }
    }
  };

  const getFacultyName = (id) => {
    if (!id) return "All Faculties";
    const faculty = faculties.find((f) => f.id === parseInt(id));
    return faculty?.name || "Unknown";
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  return (
    <div className="management-section">
      <div className="section-header">
        <h3>Registration Code Management</h3>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setFormData({
                role: "lecturer",
                facultyId: "",
                expiresAt: "",
              });
            }
          }}
        >
          {showForm ? "Cancel" : "Generate Code"}
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit}>
            <InputGroup
              label="Role"
              as="select"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              required
            >
              <option value="lecturer">Lecturer</option>
              <option value="principal_lecturer">Principal Lecturer</option>
              <option value="program_leader">Program Leader</option>
            </InputGroup>
            <InputGroup
              label="Faculty (Optional)"
              as="select"
              value={formData.facultyId}
              onChange={(e) =>
                setFormData({ ...formData, facultyId: e.target.value })
              }
            >
              <option value="">All Faculties</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </InputGroup>
            <InputGroup
              label="Expires At (Optional)"
              type="date"
              value={formData.expiresAt}
              onChange={(e) =>
                setFormData({ ...formData, expiresAt: e.target.value })
              }
            />
            <div className="form-actions">
              <Button type="submit" disabled={loading}>
                Generate Registration Code
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading && !showForm ? (
        <p className="loading">Loading codes...</p>
      ) : (
        <div className="list-container">
          {codes.length === 0 ? (
            <p className="empty">No registration codes found</p>
          ) : (
            codes.map((code) => (
              <Card key={code.id} className="code-card">
                <div className="code-header">
                  <div>
                    <h4 className="code-display">{code.code}</h4>
                    <div className="code-details">
                      <span className="role-badge">
                        {code.role.replace(/_/g, " ")}
                      </span>
                      <span className="faculty-badge">
                        {getFacultyName(code.facultyId)}
                      </span>
                      <span
                        className={`status-badge ${
                          code.isActive ? "active" : "inactive"
                        }`}
                      >
                        {code.isActive ? "Active" : "Inactive"}
                      </span>
                      {code.expiresAt && (
                        <span className="expires-badge">
                          Expires:{" "}
                          {new Date(code.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="code-actions">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => copyToClipboard(code.code)}
                    >
                      Copy
                    </Button>
                    {code.isActive && (
                      <Button
                        variant="warning"
                        size="small"
                        onClick={() => handleDeactivate(code.id)}
                      >
                        Deactivate
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDelete(code.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default RegistrationCodeManagement;
