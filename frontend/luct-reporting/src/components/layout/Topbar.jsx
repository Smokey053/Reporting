import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { format } from "date-fns";
import { Menu } from "lucide-react";

const titles = {
  "/": "Today’s Pulse",
  "/reports": "Reports Overview",
  "/reports/new": "Submit Teaching Report",
  "/classes": "Classes & Schedule",
  "/monitoring": "Monitoring Notes",
  "/ratings": "Experience Ratings",
  "/programs": "Programmes",
};

const Topbar = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const location = useLocation();
  const title = titles[location.pathname] || "Workspace";

  const greeting = useMemo(() => {
    if (!user) return "";
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  }, [user]);

  return (
    <header className="app-topbar">
      <button
        className="menu-toggle"
        onClick={() => onMenuToggle?.(true)}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>
      <div>
        <p className="eyebrow">{format(new Date(), "EEEE, dd MMM")}</p>
        <h1>{title}</h1>
      </div>
      {user && (
        <div className="welcome-card">
          <span className="greeting">Good {greeting},</span>
          <span className="name">{user.name}</span>
        </div>
      )}
    </header>
  );
};

export default Topbar;
