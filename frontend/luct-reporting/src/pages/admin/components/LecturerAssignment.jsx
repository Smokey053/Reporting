import { useState, useEffect } from "react";
import {
  UserCheck,
  Users,
  BookOpen,
  Calendar,
  MapPin,
  Monitor,
} from "lucide-react";
import api from "../../../services/api";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import InputGroup from "../../../components/ui/InputGroup";

const LecturerAssignment = () => {
  const [classes, setClasses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedLecturer, setSelectedLecturer] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterSemester, setFilterSemester] = useState("");

  useEffect(() => {
    fetchData();
  }, [filterCourse, filterSemester]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (filterCourse) params.courseId = filterCourse;
      if (filterSemester) params.semester = filterSemester;

      const [classesRes, lecturersRes, coursesRes] = await Promise.all([
        api.get("/admin/classes", { params }),
        api.get("/admin/lecturers"),
        api.get("/admin/courses"),
      ]);

      setClasses(classesRes.data);
      setLecturers(lecturersRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLecturer = async () => {
    if (!selectedClass || !selectedLecturer) return;

    try {
      setLoading(true);
      await api.put(`/admin/classes/${selectedClass.id}/assign-lecturer`, {
        lecturerId: selectedLecturer,
      });

      await fetchData();
      setSelectedClass(null);
      setSelectedLecturer("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign lecturer");
      console.error("Error assigning lecturer:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignLecturer = async (classId) => {
    if (!confirm("Are you sure you want to unassign this lecturer?")) return;

    try {
      setLoading(true);
      await api.delete(`/admin/classes/${classId}/assign-lecturer`);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unassign lecturer");
      console.error("Error unassigning lecturer:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (classItem) => {
    setSelectedClass(classItem);
    setSelectedLecturer(classItem.lecturerId || "");
  };

  const closeAssignModal = () => {
    setSelectedClass(null);
    setSelectedLecturer("");
  };

  if (loading && classes.length === 0) {
    return (
      <div className="admin-section">
        <div className="section-header">
          <h2>
            <UserCheck size={20} /> Lecturer Assignment
          </h2>
        </div>
        <p className="muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>
          <UserCheck size={20} /> Lecturer Assignment
        </h2>
        <p className="muted">
          Assign lecturers to classes. Lecturers will be able to submit reports
          for their assigned classes.
        </p>
      </div>

      {error && <p className="form-error">{error}</p>}

      {/* Filters */}
      <Card className="filter-card">
        <div className="form-row">
          <InputGroup
            label="Filter by Course"
            as="select"
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </InputGroup>

          <InputGroup
            label="Filter by Semester"
            as="select"
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
          >
            <option value="">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </InputGroup>
        </div>
      </Card>

      {/* Classes List */}
      <div className="classes-grid">
        {classes.length === 0 ? (
          <Card>
            <p className="muted">No classes found. Create classes first.</p>
          </Card>
        ) : (
          classes.map((classItem) => (
            <Card key={classItem.id} className="class-assignment-card">
              <div className="class-header">
                <div>
                  <h3>{classItem.code}</h3>
                  <p className="muted">
                    <BookOpen size={14} /> {classItem.courseCode} -{" "}
                    {classItem.courseName}
                  </p>
                </div>
              </div>

              <div className="class-details">
                <div className="detail-item">
                  <Calendar size={14} />
                  <span>
                    AY {classItem.academicYear}, Semester {classItem.semester}
                  </span>
                </div>

                {classItem.scheduledTime && (
                  <div className="detail-item">
                    <span>🕐 {classItem.scheduledTime}</span>
                  </div>
                )}

                {classItem.venue && (
                  <div className="detail-item">
                    <MapPin size={14} />
                    <span>{classItem.venue}</span>
                  </div>
                )}

                {classItem.modeOfDelivery && (
                  <div className="detail-item">
                    <Monitor size={14} />
                    <span>{classItem.modeOfDelivery}</span>
                  </div>
                )}
              </div>

              <div className="lecturer-assignment">
                {classItem.lecturerId ? (
                  <div className="assigned-lecturer">
                    <Users size={16} />
                    <span>{classItem.lecturerName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnassignLecturer(classItem.id)}
                      disabled={loading}
                    >
                      Unassign
                    </Button>
                  </div>
                ) : (
                  <div className="unassigned-lecturer">
                    <span className="muted">No lecturer assigned</span>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => openAssignModal(classItem)}
                  disabled={loading}
                >
                  {classItem.lecturerId ? "Change Lecturer" : "Assign Lecturer"}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Assignment Modal */}
      {selectedClass && (
        <div className="modal-overlay" onClick={closeAssignModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Lecturer to {selectedClass.code}</h3>
            </div>

            <div className="modal-body">
              <p className="muted">
                {selectedClass.courseCode} - {selectedClass.courseName}
              </p>

              <InputGroup
                label="Select Lecturer"
                as="select"
                value={selectedLecturer}
                onChange={(e) => setSelectedLecturer(e.target.value)}
                required
              >
                <option value="">Select a lecturer...</option>
                {lecturers.map((lecturer) => (
                  <option key={lecturer.id} value={lecturer.id}>
                    {lecturer.name} ({lecturer.email})
                    {lecturer.facultyName && ` - ${lecturer.facultyName}`}
                  </option>
                ))}
              </InputGroup>
            </div>

            <div className="modal-footer">
              <Button variant="ghost" onClick={closeAssignModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAssignLecturer}
                disabled={!selectedLecturer || loading}
              >
                {loading ? "Assigning..." : "Assign Lecturer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .classes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .class-assignment-card {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .class-header h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .class-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--muted);
        }

        .lecturer-assignment {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }

        .assigned-lecturer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: var(--primary-light);
          border-radius: 4px;
        }

        .unassigned-lecturer {
          padding: 0.5rem;
          background: var(--surface-secondary);
          border-radius: 4px;
          text-align: center;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: var(--surface-primary);
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .modal-header h3 {
          margin: 0;
        }

        .modal-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        .filter-card {
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};

export default LecturerAssignment;
