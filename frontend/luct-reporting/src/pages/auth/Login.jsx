import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck, Sparkles } from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import InputGroup from "../../components/ui/InputGroup.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const demoUsers = [
  {
    role: "Admin",
    email: "admin@luct.ac.ls",
    password: "admin123",
  },
  {
    role: "Program Leader",
    email: "naledi.molefe@luct.ac.ls",
    password: "secure123",
  },
  {
    role: "Principal Lecturer",
    email: "thabo.makoanyane@luct.ac.ls",
    password: "secure123",
  },
  {
    role: "Lecturer",
    email: "boitumelo.tebello@luct.ac.ls",
    password: "secure123",
  },
  {
    role: "Student",
    email: "lerato.sechele@luct.ac.ls",
    password: "learn123",
  },
];

const Login = () => {
  const { login, loading, error, setError } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

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

    console.log("=== LOGIN FORM DEBUG ===");
    console.log("Raw form data:", {
      email: form.email,
      password: form.password ? "***" : "(empty)",
      emailLength: form.email?.length,
      passwordLength: form.password?.length,
    });

    // Validate form data
    const email = form.email?.trim();
    const password = form.password?.trim();

    console.log("After trimming:", {
      email,
      password: password ? "***" : "(empty)",
      emailLength: email?.length,
      passwordLength: password?.length,
      emailEmpty: !email,
      passwordEmpty: !password,
    });

    if (!email || !password) {
      console.error("Validation failed - missing fields");
      setError("Email and password are required");
      return;
    }

    console.log("Validation passed, calling login API");

    try {
      await login({ email, password });
      console.log("Login successful, navigating...");
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error message:", err.message);
      // Error is already set by AuthContext
    }
  };

  const fillDemo = (credentials) => {
    console.log("Filling demo credentials:", credentials);
    setForm(credentials);
    setError(null);
  };

  return (
    <div className="auth-grid">
      <section className="auth-copy">
        <div className="badge">
          <Sparkles size={16} />
          <span>Modern academic reporting</span>
        </div>
        <h1>Welcome back to LUCT Reporting</h1>
        <p className="muted">
          Sign in to continue your reporting journey with a calmer, smarter
          workspace.
        </p>
        <ul className="auth-highlights">
          <li>Role-aware dashboards</li>
          <li>Instant monitoring snapshots</li>
          <li>Minimalistic native design</li>
        </ul>
      </section>
      <section className="auth-panel">
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>
            <LogIn size={18} /> Sign in
          </h2>
          <InputGroup
            label="Email address"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@luct.ac.ls"
            required
          />
          <InputGroup
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Access workspace"}
          </Button>
          <p className="form-footer">
            New here? <Link to="/register">Request access</Link>
          </p>
        </form>
        <div className="demo-users">
          <h3>
            <ShieldCheck size={16} /> Quick demo logins
          </h3>
          <div className="demo-grid">
            {demoUsers.map((user) => (
              <button
                key={user.email}
                type="button"
                onClick={() =>
                  fillDemo({ email: user.email, password: user.password })
                }
              >
                <span>{user.role}</span>
                <small>{user.email}</small>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
