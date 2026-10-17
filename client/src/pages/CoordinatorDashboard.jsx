import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, logout } from "../auth";
import { api } from "../api";
import { statusInfo } from "../statusLabels";
import Star from "../components/star";

function CoordinatorDashboard() {
  const user = getUser();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state — which campus/status the coordinator is viewing.
  const [campusFilter, setCampusFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/requests/all");
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

  // Apply the filters in the browser (data's already loaded).
  // .filter keeps only requests matching both selected filters.
  const filtered = requests.filter((r) => {
    const campusOk = campusFilter === "all" || r.campus === campusFilter;
    const statusOk = statusFilter === "all" || r.status === statusFilter;
    return campusOk && statusOk;
  });

  // Summary counts for the stat cards.
  const stats = {
    total: requests.length,
    pending: requests.filter((r) =>
      ["submitted", "under_office_check"].includes(r.status)
    ).length,
    withSpecialist: requests.filter((r) => r.status === "with_specialist").length,
    closed: requests.filter((r) => r.status === "closed").length,
  };

  return (
    <div className="dash">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand" style={{ marginBottom: "32px" }}>
         <span className="brand-mark"><Star size={22} /></span>
          <span className="brand-name">Requests Office</span>
        </div>
        <nav className="side-nav">
          <a className="side-link active">All Requests</a>
        </nav>
        <div className="side-footer">
          <p className="side-user">{user?.name}</p>
          <p className="side-role">Coordinator</p>
          <button className="btn btn-secondary" style={{ width: "100%" }} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="dash-main">
        <div className="dash-header">
          <h1>All Requests</h1>
        </div>

        {/* STAT CARDS */}
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-label">Total</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pending check</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">With specialist</span>
            <span className="stat-value">{stats.withSpecialist}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Closed</span>
            <span className="stat-value">{stats.closed}</span>
          </div>
        </div>

        {/* FILTERS */}
        <div className="filter-bar">
          <select className="input select" value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)}>
            <option value="all">All campuses</option>
            <option value="main">Main</option>
            <option value="north">North</option>
            <option value="city">City</option>
          </select>
          <select className="input select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_office_check">Under office check</option>
            <option value="needs_correction">Needs correction</option>
            <option value="with_specialist">Under expert review</option>
            <option value="decision_made">Decision made</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {loading && <p>Loading requests...</p>}
        {error && <div className="form-error">{error}</div>}

        {/* TABLE */}
        {!loading && !error && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Title</th>
                  <th>Requester</th>
                  <th>Campus</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", color: "var(--gray-400)" }}>
                      No requests match these filters.
                    </td>
                  </tr>
                )}
                {filtered.map((r) => {
                  const info = statusInfo(r.status);
                  return (
                    <tr key={r._id} className="table-row" onClick={() => navigate(`/coordinator/request/${r._id}`)}>
                      <td className="cell-ref">{r.reference}</td>
                      <td>{r.title}</td>
                      <td>{r.requester?.name || "—"}</td>
                      <td style={{ textTransform: "capitalize" }}>{r.campus}</td>
                      <td><span className={`status-pill ${info.cls}`}>{info.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default CoordinatorDashboard;