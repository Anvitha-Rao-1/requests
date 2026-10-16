import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, logout } from "../auth";
import { api } from "../api";
import { statusInfo } from "../statusLabels";
import NewRequestModal from "../components/NewRequestModal";

function RequesterDashboard() {
  const user = getUser();
  const navigate = useNavigate();

  // State for the list of requests, plus loading and error flags.
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  // useEffect runs code after the component renders.
  // The empty array [] means "run once, when the page first loads."
  useEffect(() => {
    loadRequests();
  }, []);

  // Fetch this requester's requests from the API.
  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/requests"); // token added automatically
      setRequests(data);
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
    <div className="dash">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand" style={{ marginBottom: "32px" }}>
          <span className="brand-mark">RO</span>
          <span className="brand-name">Requests Office</span>
        </div>
        <nav className="side-nav">
          <a className="side-link active">My Requests</a>
        </nav>
        <div className="side-footer">
          <p className="side-user">{user?.name}</p>
          <p className="side-role">{user?.campus} campus</p>
          <button className="btn btn-secondary" style={{ width: "100%" }} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dash-main">
        <div className="dash-header">
          <h1>My Requests</h1>
          {/* Button to open the new-request form — wired in 16b */}
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Request</button>
        </div>

        {/* Loading / error / empty / list states */}
        {loading && <p>Loading your requests...</p>}
        {error && <div className="form-error">{error}</div>}

        {!loading && !error && requests.length === 0 && (
          <div className="empty-state">
            <p>You have no requests yet. Create your first one.</p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="request-list">
                       {requests.map((r) => {
              const info = statusInfo(r.status);
              return (
                <div
                  className="request-card"
                  key={r._id}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/requester/request/${r._id}`)}
                >
                  <div className="request-card-top">
                    <span className="request-ref">{r.reference}</span>
                    <span className={`status-pill ${info.cls}`}>{info.label}</span>
                  </div>
                  <h3>{r.title}</h3>
                  <p className="request-meta">
                    {r.category} · {r.campus} campus
                    {r.amount > 0 && ` · ₹${r.amount.toLocaleString("en-IN")}`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
                {/* Modal only renders when showModal is true.
            onCreated adds the new request to the top of the list without a refetch. */}
        {showModal && (
          <NewRequestModal
            onClose={() => setShowModal(false)}
            onCreated={(created) => setRequests((prev) => [created, ...prev])}
          />
        )}
      </main>
    </div>
  );
}

export default RequesterDashboard;