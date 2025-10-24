import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

const AppShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggle = (value) => {
    setSidebarOpen(typeof value === "boolean" ? value : (prev) => !prev);
  };

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onToggle={handleToggle} />
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => handleToggle(false)} />
      )}
      <main className="app-main">
        <Topbar onMenuToggle={handleToggle} />
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppShell;
