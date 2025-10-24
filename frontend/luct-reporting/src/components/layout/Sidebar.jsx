import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  NotebookPen,
  CalendarClock,
  GraduationCap,
  GaugeCircle,
  LibraryBig,
  BarChart4,
  LogOut,
  Menu,
  X,
  Settings,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext.jsx";

const iconMap = {
  dashboard: LayoutDashboard,
  reports: NotebookPen,
  monitoring: GaugeCircle,
  classes: GraduationCap,
  programs: LibraryBig,
  analytics: BarChart4,
  schedule: CalendarClock,
  admin: Settings,
};

const navigationByRole = {
  lecturer: [
    { label: "Snapshot", path: "/", icon: "dashboard" },
    { label: "My Classes", path: "/classes", icon: "classes" },
    { label: "Submit Report", path: "/reports/new", icon: "reports" },
    { label: "Reports", path: "/reports", icon: "analytics" },
  ],
  principal_lecturer: [
    { label: "Monitoring", path: "/monitoring", icon: "monitoring" },
    { label: "Ratings", path: "/ratings", icon: "analytics" },
  ],
  program_leader: [
    { label: "Faculty Pulse", path: "/", icon: "dashboard" },
    { label: "Classes", path: "/classes", icon: "classes" },
    { label: "Programs", path: "/programs", icon: "programs" },
    { label: "Reports", path: "/reports", icon: "reports" },
  ],
  student: [
    { label: "Journey", path: "/", icon: "dashboard" },
    { label: "My Classes", path: "/classes", icon: "classes" },
    { label: "Attendance", path: "/reports", icon: "analytics" },
  ],
  admin: [
    { label: "Overview", path: "/", icon: "dashboard" },
    { label: "Admin Workspace", path: "/admin", icon: "admin" },
  ],
};

const Sidebar = ({ open, onToggle = () => {} }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = useMemo(() => {
    if (!user) return [];
    const defaults = [{ label: "Overview", path: "/", icon: "dashboard" }];
    const specific = navigationByRole[user.role] || [];
    const merged = [...defaults];
    specific.forEach((item) => {
      if (!merged.some((entry) => entry.path === item.path)) {
        merged.push(item);
      }
    });
    return merged;
  }, [user]);

  const handleLogout = () => {
    logout();
    onToggle(false);
  };

  if (!user) return null;

  return (
    <aside className={clsx("app-sidebar", open && "is-open")}>
      <div className="sidebar-header">
        <button
          className="menu-toggle"
          onClick={() => onToggle(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
        <div className="brand">
          <span className="spark" />
          <span>LUCT Reporting</span>
        </div>
      </div>
      <nav>
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx("nav-link", active && "active")}
              onClick={() => onToggle(false)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="user-meta">
          <p>{user.name}</p>
          <small className="role-chip">{user.role.replace("_", " ")}</small>
        </div>
        <button className="logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
