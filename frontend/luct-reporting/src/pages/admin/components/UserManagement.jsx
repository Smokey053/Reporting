import { useState, useEffect } from "react";
import api from "../../../services/api.js";
import Button from "../../../components/ui/Button.jsx";
import Card from "../../../components/ui/Card.jsx";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/users");
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const response = await api.get("/admin/users/pending-approvals");
      setPendingUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch pending users");
    }
  };

  const handleApprove = async (userId) => {
    try {
      setLoading(true);
      await api.post(`/admin/users/${userId}/approve`);
      fetchPendingUsers();
      fetchUsers();
    } catch (err) {
      setError("Failed to approve user");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (userId) => {
    if (
      window.confirm("Are you sure you want to reject and delete this user?")
    ) {
      try {
        setLoading(true);
        await api.post(`/admin/users/${userId}/reject`);
        fetchPendingUsers();
        fetchUsers();
      } catch (err) {
        setError("Failed to reject user");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      setLoading(true);
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      setError("Failed to update user role");
    } finally {
      setLoading(false);
    }
  };

  const renderUserCard = (user) => (
    <Card key={user.id} className="user-card">
      <div className="user-info">
        <h4>{user.fullName}</h4>
        <p className="user-email">{user.email}</p>
        <div className="user-details">
          <span className="role-badge">{user.role.replace(/_/g, " ")}</span>
          <span className="faculty-badge">{user.facultyName || "N/A"}</span>
          <span
            className={`status-badge ${
              user.isApproved ? "approved" : "pending"
            }`}
          >
            {user.isApproved ? "Approved" : "Pending"}
          </span>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="management-section">
      <div className="section-tabs">
        <button
          className={`tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Users ({users.length})
        </button>
        <button
          className={`tab ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Approvals ({pendingUsers.length})
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <p className="loading">Loading users...</p>
      ) : activeTab === "all" ? (
        <div className="list-container">
          {users.length === 0 ? (
            <p className="empty">No users found</p>
          ) : (
            users.map((user) => renderUserCard(user))
          )}
        </div>
      ) : (
        <div className="list-container">
          {pendingUsers.length === 0 ? (
            <p className="empty">No pending approvals</p>
          ) : (
            pendingUsers.map((user) => (
              <Card key={user.id} className="user-card">
                <div className="user-info">
                  <h4>{user.fullName}</h4>
                  <p className="user-email">{user.email}</p>
                  <div className="user-details">
                    <span className="role-badge">
                      {user.role.replace(/_/g, " ")}
                    </span>
                    <span className="faculty-badge">
                      {user.facultyName || "N/A"}
                    </span>
                  </div>
                  <div className="user-actions">
                    <Button
                      variant="success"
                      size="small"
                      onClick={() => handleApprove(user.id)}
                      disabled={loading}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleReject(user.id)}
                      disabled={loading}
                    >
                      Reject
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

export default UserManagement;
