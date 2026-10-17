import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, logout } from "../auth";
import { api } from "../api";
import Star from "../components/star";

function SpecialistDashboard() {
  const user = getUser();
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/requests/specialist/queue");
      setQueue(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="spec-wrap">
      {/* Simple top bar instead of a sidebar — less to navigate */}
      <header className="spec-header">
        <div className="brand">
         <span className="brand-mark"><Star size={22} /></span>
          <span className="brand-name">Requests Office</span>
        </div>
        <div className="spec-header-right">
          <span className="spec-user">{user?.name}</span>
          <button className="btn btn-secondary" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <main className="spec-main">
        <h1 className="spec-title">Review Queue</h1>
        <p className="spec-subtitle">Requests waiting for your review</p>

        {loading && <p>Loading...</p>}
        {error && <div className="form-error">{error}</div>}

        {!loading && queue.length === 0 && (
          <div className="empty-state" style={{ marginTop: "24px" }}>
            <p>Your queue is empty. Nothing to review right now.</p>
          </div>
        )}

        {/* Large, tappable cards — one request each */}
        <div className="spec-queue">
          {queue.map((r) => (
            <button key={r._id} className="spec-queue-card"
              onClick={() => navigate(`/specialist/request/${r._id}`)}>
              <span className="request-ref">{r.reference}</span>
              <span className="spec-queue-title">{r.title}</span>
              <span className="spec-queue-meta">
                {r.category} · {r.requester?.campus} campus
              </span>
              <span className="spec-queue-arrow">Review →</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

export default SpecialistDashboard;