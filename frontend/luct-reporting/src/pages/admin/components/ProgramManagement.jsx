import { useState, useEffect } from "react";
import api from "../../../services/api.js";
import Button from "../../../components/ui/Button.jsx";
import Card from "../../../components/ui/Card.jsx";
import InputGroup from "../../../components/ui/InputGroup.jsx";

const ProgramManagement = () => {
  const [programs, setPrograms] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    level: "",
    durationYears: "",
    facultyId: "",
  });

  useEffect(() => {
    fetchPrograms();
    fetchFaculties();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/programs");
      setPrograms(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch programs");
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
    if (!formData.code || !formData.name || !formData.facultyId) {
      setError("Code, name, and faculty are required");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await api.put(`/admin/programs/${editingId}`, formData);
      } else {
        await api.post("/admin/programs", formData);
      }
      setFormData({
        code: "",
        name: "",
        level: "",
        durationYears: "",
        facultyId: "",
      });
      setEditingId(null);
      setShowForm(false);
      fetchPrograms();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (program) => {
    setFormData({
      code: program.code,
      name: program.name,
      level: program.level || "",
      durationYears: program.durationYears || "",
      facultyId: program.facultyId || "",
    });
    setEditingId(program.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this program?")) {
      try {
        setLoading(true);
        await api.delete(`/admin/programs/${id}`);
        fetchPrograms();
      } catch (err) {
        setError("Failed to delete program");
      } finally {
        setLoading(false);
      }
    }
  };

  const getFacultyName = (id) => {
    const faculty = faculties.find((f) => f.id === parseInt(id));
    return faculty?.name || "Unknown";
  };

  return (
    <div className="management-section">
      <div className="section-header">
        <h3>Program Management</h3>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingId(null);
              setFormData({
                code: "",
                name: "",
                level: "",
                durationYears: "",
                facultyId: "",
              });
            }
          }}
        >
          {showForm ? "Cancel" : "Add Program"}
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit}>
            <InputGroup
              label="Program Code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              placeholder="e.g., CS101"
              required
            />
            <InputGroup
              label="Program Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Bachelor of Computer Science"
              required
            />
            <InputGroup
              label="Faculty"
              as="select"
              value={formData.facultyId}
              onChange={(e) =>
                setFormData({ ...formData, facultyId: e.target.value })
              }
              required
            >
              <option value="">Select a faculty</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </InputGroup>
            <InputGroup
              label="Level"
              value={formData.level}
              onChange={(e) =>
                setFormData({ ...formData, level: e.target.value })
              }
              placeholder="e.g., Bachelor, Master, Diploma"
            />
            <InputGroup
              label="Duration (Years)"
              type="number"
              value={formData.durationYears}
              onChange={(e) =>
                setFormData({ ...formData, durationYears: e.target.value })
              }
              placeholder="e.g., 3"
            />
            <div className="form-actions">
              <Button type="submit" disabled={loading}>
                {editingId ? "Update" : "Create"} Program
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading && !showForm ? (
        <p className="loading">Loading programs...</p>
      ) : (
        <div className="list-container">
          {programs.length === 0 ? (
            <p className="empty">No programs found</p>
          ) : (
            programs.map((program) => (
              <Card key={program.id} className="item-card">
                <div className="item-header">
                  <div>
                    <h4>{program.name}</h4>
                    <div className="metadata">
                      <span className="code-badge">{program.code}</span>
                      <span className="faculty-badge">
                        {getFacultyName(program.facultyId)}
                      </span>
                      {program.level && (
                        <span className="level-badge">{program.level}</span>
                      )}
                      {program.durationYears && (
                        <span className="duration-badge">
                          {program.durationYears} years
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="item-actions">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleEdit(program)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDelete(program.id)}
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

export default ProgramManagement;
