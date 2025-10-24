import { useState, useEffect } from "react";
import api from "../../../services/api.js";
import Button from "../../../components/ui/Button.jsx";
import Card from "../../../components/ui/Card.jsx";
import InputGroup from "../../../components/ui/InputGroup.jsx";

const FacultyManagement = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/faculties");
      setFaculties(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch faculties");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      setError("Code and name are required");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await api.put(`/admin/faculties/${editingId}`, formData);
      } else {
        await api.post("/admin/faculties", formData);
      }
      setFormData({ code: "", name: "", description: "" });
      setEditingId(null);
      setShowForm(false);
      fetchFaculties();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faculty) => {
    setFormData({
      code: faculty.code,
      name: faculty.name,
      description: faculty.description || "",
    });
    setEditingId(faculty.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this faculty?")) {
      try {
        setLoading(true);
        await api.delete(`/admin/faculties/${id}`);
        fetchFaculties();
      } catch (err) {
        setError("Failed to delete faculty");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="management-section">
      <div className="section-header">
        <h3>Faculty Management</h3>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingId(null);
              setFormData({ code: "", name: "", description: "" });
            }
          }}
        >
          {showForm ? "Cancel" : "Add Faculty"}
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit}>
            <InputGroup
              label="Faculty Code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              placeholder="e.g., FICT"
              required
            />
            <InputGroup
              label="Faculty Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Faculty of Information and Communication Technology"
              required
            />
            <InputGroup
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Faculty description (optional)"
              as="textarea"
            />
            <div className="form-actions">
              <Button type="submit" disabled={loading}>
                {editingId ? "Update" : "Create"} Faculty
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading && !showForm ? (
        <p className="loading">Loading faculties...</p>
      ) : (
        <div className="list-container">
          {faculties.length === 0 ? (
            <p className="empty">No faculties found</p>
          ) : (
            faculties.map((faculty) => (
              <Card key={faculty.id} className="item-card">
                <div className="item-header">
                  <div>
                    <h4>{faculty.name}</h4>
                    <p className="code-badge">{faculty.code}</p>
                  </div>
                  <div className="item-actions">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleEdit(faculty)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDelete(faculty.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {faculty.description && (
                  <p className="description">{faculty.description}</p>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FacultyManagement;
