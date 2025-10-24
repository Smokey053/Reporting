import { useEffect, useState } from "react";
import api from "../../services/api.js";
import Card from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Tag from "../../components/ui/Tag.jsx";
import Button from "../../components/ui/Button.jsx";
import { Search, X } from "lucide-react";

const Programs = () => {
  const [programs, setPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const { data } = await api.get("/pl/programs");
        setPrograms(data);
        setFilteredPrograms(data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load programmes");
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  // Filter programs based on search and level
  useEffect(() => {
    let filtered = programs;

    if (searchTerm) {
      filtered = filtered.filter(
        (program) =>
          program.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          program.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          program.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (levelFilter) {
      filtered = filtered.filter((program) => program.level === levelFilter);
    }

    setFilteredPrograms(filtered);
  }, [searchTerm, levelFilter, programs]);

  const clearFilters = () => {
    setSearchTerm("");
    setLevelFilter("");
  };

  // Get unique levels for filter
  const uniqueLevels = [
    ...new Set(programs.map((p) => p.level).filter(Boolean)),
  ];

  if (loading) {
    return <p className="loading">Loading programmes...</p>;
  }

  if (error) {
    return (
      <EmptyState
        title="Programmes unavailable"
        message={error}
        action={<Button onClick={() => window.location.reload()}>Retry</Button>}
      />
    );
  }

  if (!programs.length) {
    return (
      <EmptyState
        title="No programmes"
        message="Create programmes from the admin workspace."
      />
    );
  }

  return (
    <div className="programs-page">
      {/* Search and Filter Bar */}
      <Card className="filter-bar">
        <div className="filter-controls">
          <div className="search-group">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search programs by name, code, or description..."
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

          {uniqueLevels.length > 0 && (
            <div className="level-filter">
              <label>Level:</label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
              >
                <option value="">All Levels</option>
                {uniqueLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(searchTerm || levelFilter) && (
            <Button variant="ghost" onClick={clearFilters} size="small">
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Results Count */}
      <div className="results-info">
        Showing {filteredPrograms.length} of {programs.length} programmes
      </div>

      {/* Programs Grid */}
      {!filteredPrograms.length ? (
        <EmptyState
          title="No matching programmes"
          message="Try adjusting your search or filters"
        />
      ) : (
        <div className="program-grid">
          {filteredPrograms.map((program) => (
            <Card key={program.id} title={program.name} subtle>
              <div className="program-meta">
                <Tag tone="accent">{program.code}</Tag>
                <Tag tone="violet">{program.level || "N/A"}</Tag>
              </div>
              <p className="muted">
                Duration {program.durationYears ?? "?"} years
              </p>
              {program.description && (
                <p className="program-description">{program.description}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <style jsx>{`
        .programs-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .filter-bar {
          padding: 1.5rem;
        }

        .filter-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          min-width: 300px;
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

        .level-filter {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .level-filter label {
          color: var(--text-muted);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .level-filter select {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--divider);
          border-radius: 0.75rem;
          padding: 0.7rem 0.85rem;
          color: var(--text);
          font: inherit;
          cursor: pointer;
        }

        .level-filter select:focus {
          outline: none;
          border-color: var(--primary);
        }

        .results-info {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .program-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }

        .program-meta {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 0.5rem;
        }

        .program-description {
          color: var(--text-muted);
          font-size: 0.875rem;
          margin-top: 0.5rem;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .filter-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-group {
            width: 100%;
            min-width: 0;
          }

          .level-filter {
            width: 100%;
            justify-content: space-between;
          }

          .level-filter select {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Programs;
