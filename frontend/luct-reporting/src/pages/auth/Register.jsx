import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus2 } from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import InputGroup from "../../components/ui/InputGroup.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";

const defaultForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "student",
  facultyId: "",
  registrationCode: "",
};

const Register = () => {
  const { register, loading, error, setError } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [faculties, setFaculties] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const { data } = await api.get("/auth/faculties");
        setFaculties(data);
        // Set default faculty if available
        if (data.length > 0 && !form.facultyId) {
          setForm((prev) => ({ ...prev, facultyId: data[0].id.toString() }));
        }
      } catch (err) {
        console.error("Failed to fetch faculties:", err);
      }
    };
    fetchFaculties();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    console.log("Input changed:", { name, value, valueLength: value?.length });
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      console.log("Updated form state:", updated);
      return updated;
    });
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null); // Clear any previous errors

    console.log("=== REGISTER FORM DEBUG ===");
    console.log("Raw form data:", {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password ? "***" : "(empty)",
      role: form.role,
      facultyId: form.facultyId,
      registrationCode: form.registrationCode || "(empty)",
    });

    // Trim all string fields
    const firstName = form.firstName?.trim();
    const lastName = form.lastName?.trim();
    const email = form.email?.trim();
    const password = form.password?.trim();
    const registrationCode = form.registrationCode?.trim();

    console.log("After trimming:", {
      firstName,
      lastName,
      email,
      password: password ? "***" : "(empty)",
      role: form.role,
      facultyId: form.facultyId,
      registrationCode: registrationCode || "(empty)",
      firstNameEmpty: !firstName,
      lastNameEmpty: !lastName,
      emailEmpty: !email,
      passwordEmpty: !password,
      roleEmpty: !form.role,
      facultyIdEmpty: !form.facultyId,
    });

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !form.role ||
      !form.facultyId
    ) {
      console.error("Validation failed - missing required fields");
      setError("All fields are required");
      return;
    }

    // Validate registration code for non-students
    if (form.role !== "student" && !registrationCode) {
      console.error(
        "Validation failed - registration code required for non-students"
      );
      setError("Registration code is required for staff accounts");
      return;
    }

    const payload = {
      firstName,
      lastName,
      email,
      password,
      role: form.role,
      facultyId: form.facultyId,
      registrationCode,
    };

    console.log("Validation passed, calling register API with payload:", {
      ...payload,
      password: "***",
    });

    try {
      await register(payload);
      console.log("Registration successful, navigating...");
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Registration error:", err);
      console.error("Error message:", err.message);
      // Error is already set by AuthContext
    }
  };

  return (
    <div className="auth-grid">
      <section className="auth-copy">
        <div className="badge">
          <UserPlus2 size={16} />
          <span>Faculty access</span>
        </div>
        <h1>Request access to LUCT Reporting</h1>
        <p className="muted">
          Provide your faculty details and role. Admin approvals happen in less
          than 24 hours.
        </p>
      </section>
      <section className="auth-panel">
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>
            <UserPlus2 size={18} /> Create workspace profile
          </h2>
          <div className="form-row">
            <InputGroup
              label="First name"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
            />
            <InputGroup
              label="Last name"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </div>
          <InputGroup
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <InputGroup
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <div className="form-row">
            <InputGroup
              label="Role"
              as="select"
              name="role"
              value={form.role}
              onChange={handleChange}
              required
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="principal_lecturer">Principal Lecturer</option>
              <option value="program_leader">Program Leader</option>
            </InputGroup>
            <InputGroup
              label="Faculty"
              as="select"
              name="facultyId"
              value={form.facultyId}
              onChange={handleChange}
              required
            >
              <option value="">Select Faculty</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </InputGroup>
          </div>
          {form.role !== "student" && (
            <InputGroup
              label="Registration code"
              hint="Provided by faculty admin"
              name="registrationCode"
              value={form.registrationCode}
              onChange={handleChange}
              required
            />
          )}
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Request access"}
          </Button>
          <p className="form-footer">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </div>
  );
};

export default Register;
