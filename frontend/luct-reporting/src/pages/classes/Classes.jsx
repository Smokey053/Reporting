import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";
import Card from "../../components/ui/Card.jsx";
import Tag from "../../components/ui/Tag.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Button from "../../components/ui/Button.jsx";
import InputGroup from "../../components/ui/InputGroup.jsx";
import { Plus, X, Users, Clock, MapPin, Monitor, Search } from "lucide-react";

const endpointByRole = {
  lecturer: "/lecturer/classes",
  principal_lecturer: "/lecturer/classes",
  program_leader: "/pl/classes",
  student: "/student/classes",
};

const Classes = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchClasses();
    if (user.role === "student") {
      fetchFaculties();
    }
  }, [user.role]);

  // Filter classes based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredClasses(classes);
      return;
    }

    const filtered = classes.filter(
      (cls) =>
        cls.course?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.classCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.lecturer?.firstName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        cls.lecturer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredClasses(filtered);
  }, [searchTerm, classes]);

  const fetchClasses = async () => {
    const endpoint = endpointByRole[user.role];
    if (!endpoint) {
      setClasses([]);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get(endpoint);
      setClasses(data);
      setFilteredClasses(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculties = async () => {
    try {
      const { data } = await api.get("/auth/faculties");
      setFaculties(data);
    } catch (err) {
      console.error("Failed to fetch faculties:", err);
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterFaculty) params.facultyId = filterFaculty;
      if (filterSemester) params.semester = filterSemester;

      const { data } = await api.get("/student/available-classes", { params });
      setAvailableClasses(data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load available classes"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (classId) => {
    try {
      setEnrolling(true);
      await api.post("/student/enroll", { classId });
      await fetchClasses();
      await fetchAvailableClasses();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to enroll in class");
    } finally {
      setEnrolling(false);
    }
  };

  const handleWithdraw = async (classId) => {
    if (!confirm("Are you sure you want to withdraw from this class?")) return;

    try {
      await api.post("/student/withdraw", { classId });
      await fetchClasses();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to withdraw from class");
    }
  };

  const openEnrollModal = () => {
    setShowEnrollModal(true);
    fetchAvailableClasses();
  };

  const closeEnrollModal = () => {
    setShowEnrollModal(false);
    setFilterFaculty("");
    setFilterSemester("");
    setAvailableClasses([]);
  };

  if (loading && !showEnrollModal) {
    return <p className="loading">Loading classes...</p>;
  }

  if (error && !showEnrollModal) {
    return (
      <EmptyState
        title="Classes unavailable"
        message={error}
        action={<Button onClick={() => window.location.reload()}>Retry</Button>}
      />
    );
  }

  return (
    <div className="classes-page">
      <div className="page-header">
        <div>
          <h1>{user.role === "student" ? "My Classes" : "Classes"}</h1>
          <p className="muted">
            {user.role === "student"
              ? "Classes you are currently enrolled in"
              : "Your teaching schedule"}
          </p>
        </div>
        {user.role === "student" && (
          <Button onClick={openEnrollModal}>
            <Plus size={16} />
            Enroll in Class
          </Button>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      {/* Search Bar */}
      {classes.length > 0 && (
        <Card className="search-bar">
          <div className="search-group">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search classes by name, code, venue, or lecturer..."
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
          {searchTerm && (
            <div className="results-info">
              Showing {filteredClasses.length} of {classes.length} classes
            </div>
          )}
        </Card>
      )}

      {!filteredClasses.length && !loading ? (
        <EmptyState
          title={searchTerm ? "No matching classes" : "No classes found"}
          message={
            searchTerm
              ? "Try adjusting your search"
              : user.role === "student"
              ? "Enroll in classes to get started"
              : "Once scheduled, your classes will show up here."
          }
        />
      ) : (
        <div className="class-grid">
          {filteredClasses.map((cls) => (
            <Card key={cls.id} className="class-card">
              <div className="class-header">
                <h3>{cls.course?.name || cls.classCode}</h3>
                <div className="class-meta">
                  <Tag tone="accent">{cls.classCode}</Tag>
                  <Tag tone="violet">Semester {cls.semester}</Tag>
                </div>
              </div>

              <div className="class-details">
                {cls.schedule && (
                  <div className="detail-item">
                    <Clock size={14} />
                    <span>{cls.schedule}</span>
                  </div>
                )}

                {cls.venue && (
                  <div className="detail-item">
                    <MapPin size={14} />
                    <span>{cls.venue}</span>
                  </div>
                )}

                {cls.mode && (
                  <div className="detail-item">
                    <Monitor size={14} />
                    <span>{cls.mode}</span>
                  </div>
                )}

                {cls.lecturer && (
                  <div className="detail-item">
                    <Users size={14} />
                    <span>
                      {cls.lecturer.firstName} {cls.lecturer.lastName}
                    </span>
                  </div>
                )}
              </div>

              {user.role === "student" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleWithdraw(cls.id)}
                  className="withdraw-btn"
                >
                  <X size={14} />
                  Withdraw
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Enrollment Modal */}
      {showEnrollModal && (
        <div className="modal-overlay" onClick={closeEnrollModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Enroll in a Class</h2>
              <button className="close-btn" onClick={closeEnrollModal}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <InputGroup
                  label="Filter by Faculty"
                  as="select"
                  value={filterFaculty}
                  onChange={(e) => setFilterFaculty(e.target.value)}
                >
                  <option value="">All Faculties</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
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

              <Button onClick={fetchAvailableClasses} disabled={loading}>
                {loading ? "Loading..." : "Search Classes"}
              </Button>

              <div className="available-classes">
                {availableClasses.length === 0 && !loading ? (
                  <p className="muted">
                    No classes found. Try adjusting filters.
                  </p>
                ) : (
                  availableClasses.map((cls) => (
                    <Card key={cls.id} className="available-class-card">
                      <div className="class-info">
                        <h4>{cls.courseName}</h4>
                        <div className="class-tags">
                          <Tag tone="accent" size="sm">
                            {cls.classCode}
                          </Tag>
                          <Tag tone="violet" size="sm">
                            Semester {cls.semester}
                          </Tag>
                          <Tag tone="gray" size="sm">
                            {cls.facultyName}
                          </Tag>
                        </div>
                        {cls.schedule && (
                          <p className="muted">
                            <Clock size={12} /> {cls.schedule}
                          </p>
                        )}
                        {cls.lecturerName && (
                          <p className="muted">
                            <Users size={12} /> {cls.lecturerName}
                          </p>
                        )}
                        <p className="muted">
                          {cls.enrolledCount} students enrolled
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleEnroll(cls.id)}
                        disabled={cls.isEnrolled === 1 || enrolling}
                      >
                        {cls.isEnrolled === 1 ? "Enrolled" : "Enroll"}
                      </Button>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .classes-page {
          padding: 1rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 2rem;
        }

        .page-header h1 {
          margin: 0 0 0.5rem 0;
        }

        .search-bar {
          margin-bottom: 1.5rem;
          padding: 1rem;
        }

        .search-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
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

        .results-info {
          color: var(--text-muted);
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .class-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .class-card {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .class-header h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.125rem;
        }

        .class-meta {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
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
          color: var(--text-muted);
        }

        .withdraw-btn {
          margin-top: auto;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(5, 7, 15, 0.85);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: var(--surface);
          border: 1px solid var(--divider);
          border-radius: 12px;
          width: 90%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--divider);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          margin: 0;
          color: var(--text);
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--divider);
          color: var(--text);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .modal-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .available-classes {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .available-class-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .class-info {
          flex: 1;
        }

        .class-info h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          color: var(--text);
        }

        .class-tags {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default Classes;
