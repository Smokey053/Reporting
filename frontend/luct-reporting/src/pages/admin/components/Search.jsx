import { useState, useEffect } from "react";
import api from "../../../services/api.js";
import Card from "../../../components/ui/Card.jsx";
import Button from "../../../components/ui/Button.jsx";
import "./Search.css";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setMessage({ type: "warning", text: "Please enter a search term" });
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const params = new URLSearchParams({
        q: searchQuery,
        type: searchType === "all" ? undefined : searchType,
      });

      const response = await api.get(`/admin/search?${params}`);
      setResults(response.data || []);

      if (!response.data || response.data.length === 0) {
        setMessage({ type: "info", text: "No results found" });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Search failed",
      });
      console.error(error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (type) => {
    const icons = {
      faculty: "🏛️",
      program: "📚",
      course: "📖",
      user: "👤",
    };
    return icons[type] || "📄";
  };

  const getTypeColor = (type) => {
    const colors = {
      faculty: "#667eea",
      program: "#764ba2",
      course: "#4caf50",
      user: "#ff9800",
    };
    return colors[type] || "#999";
  };

  return (
    <div className="search-container">
      <h2>Search System</h2>

      <Card className="search-card">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search faculties, programs, courses, or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              autoFocus
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          <div className="search-filters">
            <label>Search in:</label>
            <div className="filter-options">
              <label>
                <input
                  type="radio"
                  name="searchType"
                  value="all"
                  checked={searchType === "all"}
                  onChange={(e) => setSearchType(e.target.value)}
                />
                All
              </label>
              <label>
                <input
                  type="radio"
                  name="searchType"
                  value="faculties"
                  checked={searchType === "faculties"}
                  onChange={(e) => setSearchType(e.target.value)}
                />
                Faculties
              </label>
              <label>
                <input
                  type="radio"
                  name="searchType"
                  value="programs"
                  checked={searchType === "programs"}
                  onChange={(e) => setSearchType(e.target.value)}
                />
                Programs
              </label>
              <label>
                <input
                  type="radio"
                  name="searchType"
                  value="courses"
                  checked={searchType === "courses"}
                  onChange={(e) => setSearchType(e.target.value)}
                />
                Courses
              </label>
              <label>
                <input
                  type="radio"
                  name="searchType"
                  value="users"
                  checked={searchType === "users"}
                  onChange={(e) => setSearchType(e.target.value)}
                />
                Users
              </label>
            </div>
          </div>
        </form>
      </Card>

      {message && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {results.length > 0 && (
        <div className="search-results">
          <h3>Results ({results.length})</h3>
          <div className="results-grid">
            {results.map((result, index) => (
              <Card key={index} className="result-card">
                <div
                  className="result-type"
                  style={{ borderTopColor: getTypeColor(result.type) }}
                >
                  <span className="result-icon">
                    {getResultIcon(result.type)}
                  </span>
                  <span className="result-type-label">
                    {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                  </span>
                </div>

                <div className="result-content">
                  <h4>{result.name || result.title || result.email}</h4>

                  {result.description && (
                    <p className="result-description">{result.description}</p>
                  )}

                  {result.faculty && (
                    <div className="result-info">
                      <strong>Faculty:</strong> {result.faculty}
                    </div>
                  )}

                  {result.program && (
                    <div className="result-info">
                      <strong>Program:</strong> {result.program}
                    </div>
                  )}

                  {result.role && (
                    <div className="result-info">
                      <strong>Role:</strong> {result.role}
                    </div>
                  )}

                  {result.level && (
                    <div className="result-info">
                      <strong>Level:</strong> {result.level}
                    </div>
                  )}

                  {result.code && (
                    <div className="result-info">
                      <strong>Code:</strong> {result.code}
                    </div>
                  )}

                  {result.email && result.type === "user" && (
                    <div className="result-info">
                      <strong>Email:</strong> {result.email}
                    </div>
                  )}

                  {result.matched_fields && (
                    <div className="result-matches">
                      <strong>Matched:</strong>{" "}
                      {result.matched_fields.join(", ")}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && !loading && searchQuery && !message && (
        <Card className="no-results">
          <p>No results found for "{searchQuery}"</p>
          <p className="hint">Try searching with different keywords</p>
        </Card>
      )}

      {!searchQuery && (
        <Card className="search-info">
          <h3>How to Use Search</h3>
          <ul>
            <li>Enter keywords to search across all system data</li>
            <li>Filter by type using the radio buttons</li>
            <li>
              Search in faculty names, program titles, course names, and user
              emails
            </li>
            <li>Results show matched fields and relevant information</li>
            <li>Results are case-insensitive</li>
          </ul>
        </Card>
      )}
    </div>
  );
};

export default Search;
