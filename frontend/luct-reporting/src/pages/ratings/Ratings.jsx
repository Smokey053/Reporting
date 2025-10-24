import { useEffect, useState } from "react";
import api from "../../services/api.js";
import Card from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Tag from "../../components/ui/Tag.jsx";
import { Search, X } from "lucide-react";

const Ratings = () => {
  const [ratings, setRatings] = useState([]);
  const [filteredRatings, setFilteredRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [minRating, setMinRating] = useState("");

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const { data } = await api.get("/prl/ratings");
        setRatings(data);
        setFilteredRatings(data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load ratings");
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, []);

  // Filter ratings based on search and rating
  useEffect(() => {
    let filtered = ratings;

    if (searchTerm) {
      filtered = filtered.filter(
        (rating) =>
          rating.report?.course?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          rating.comment?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (minRating) {
      filtered = filtered.filter((rating) => {
        const average = Math.round(
          (rating.engagement + rating.clarity + rating.preparedness) / 3
        );
        return average >= parseInt(minRating);
      });
    }

    setFilteredRatings(filtered);
  }, [searchTerm, minRating, ratings]);

  const clearFilters = () => {
    setSearchTerm("");
    setMinRating("");
  };

  if (loading) {
    return <p className="loading">Pulling feedback...</p>;
  }

  if (error) {
    return <EmptyState title="Ratings unavailable" message={error} />;
  }

  if (!ratings.length) {
    return (
      <EmptyState
        title="No feedback yet"
        message="Student feedback will appear as soon as surveys are submitted."
      />
    );
  }

  return (
    <div className="ratings-page">
      {/* Search and Filter Bar */}
      <Card className="filter-bar">
        <div className="filter-controls">
          <div className="search-group">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search feedback by course or comment..."
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

          <div className="rating-filter">
            <label>Min Rating:</label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
            >
              <option value="">All</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5</option>
            </select>
          </div>

          {(searchTerm || minRating) && (
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          )}
        </div>
      </Card>

      {/* Results Info */}
      <div className="results-info">
        Showing {filteredRatings.length} of {ratings.length} ratings
      </div>

      {/* Ratings Grid */}
      {!filteredRatings.length ? (
        <EmptyState
          title="No matching ratings"
          message="Try adjusting your search or filters"
        />
      ) : (
        <div className="ratings-grid">
          {filteredRatings.map((rating) => {
            const average = Math.round(
              (rating.engagement + rating.clarity + rating.preparedness) / 3
            );
            return (
              <Card
                key={rating.id}
                title={rating.report?.course?.name || "Course feedback"}
              >
                <div className="rating-pill">
                  <Tag tone="accent">{average}/5</Tag>
                  <span>
                    Engagement {rating.engagement} • Clarity {rating.clarity} •
                    Preparedness {rating.preparedness}
                  </span>
                </div>
                <p>{rating.comment}</p>
              </Card>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .ratings-page {
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
          min-width: 250px;
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

        .rating-filter {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .rating-filter label {
          color: var(--text-muted);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .rating-filter select {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--divider);
          border-radius: 0.75rem;
          padding: 0.7rem 0.85rem;
          color: var(--text);
          font: inherit;
          cursor: pointer;
        }

        .rating-filter select:focus {
          outline: none;
          border-color: var(--primary);
        }

        .clear-filters-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--divider);
          border-radius: 0.75rem;
          padding: 0.7rem 1rem;
          color: var(--text-muted);
          font: inherit;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-filters-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text);
        }

        .results-info {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .ratings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
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

          .rating-filter {
            width: 100%;
            justify-content: space-between;
          }

          .rating-filter select {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Ratings;
