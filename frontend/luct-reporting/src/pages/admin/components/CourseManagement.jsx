import { useState, useEffect } from "react";
import api from "../../../services/api.js";
import Button from "../../../components/ui/Button.jsx";
import Card from "../../../components/ui/Card.jsx";
import InputGroup from "../../../components/ui/InputGroup.jsx";

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    facultyId: "",
  });

  useEffect(() => {
    fetchCourses();
    fetchFaculties();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/courses");
      setCourses(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch courses");
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
        await api.put(`/admin/courses/${editingId}`, formData);
      } else {
        await api.post("/admin/courses", formData);
      }
      setFormData({
        code: "",
        name: "",
        description: "",
        facultyId: "",
      });
      setEditingId(null);
      setShowForm(false);
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setFormData({
      code: course.code,
      name: course.name,
      description: course.description || "",
      facultyId: course.facultyId || "",
    });
    setEditingId(course.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        setLoading(true);
        await api.delete(`/admin/courses/${id}`);
        fetchCourses();
      } catch (err) {
        setError("Failed to delete course");
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
        <h3>Course Management</h3>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingId(null);
              setFormData({
                code: "",
                name: "",
                description: "",
                facultyId: "",
              });
            }
          }}
        >
          {showForm ? "Cancel" : "Add Course"}
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit}>
            <InputGroup
              label="Course Code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              placeholder="e.g., CS101"
              required
            />
            <InputGroup
              label="Course Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Introduction to Programming"
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
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Course description (optional)"
              as="textarea"
            />
            <div className="form-actions">
              <Button type="submit" disabled={loading}>
                {editingId ? "Update" : "Create"} Course
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading && !showForm ? (
        <p className="loading">Loading courses...</p>
      ) : (
        <div className="list-container">
          {courses.length === 0 ? (
            <p className="empty">No courses found</p>
          ) : (
            courses.map((course) => (
              <Card key={course.id} className="item-card">
                <div className="item-header">
                  <div>
                    <h4>{course.name}</h4>
                    <div className="metadata">
                      <span className="code-badge">{course.code}</span>
                      <span className="faculty-badge">
                        {getFacultyName(course.facultyId)}
                      </span>
                    </div>
                  </div>
                  <div className="item-actions">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleEdit(course)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDelete(course.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {course.description && (
                  <p className="description">{course.description}</p>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
