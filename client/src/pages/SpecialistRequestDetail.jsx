import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";

function SpecialistRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [correctionNote, setCorrectionNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadRequest();
  }, [id]);

  async function loadRequest() {
    setLoading(true);
    try {
      const data = await api(`/api/requests/${id}`);
      setRequest(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitRecommendation() {
    setActionError("");
    setBusy(true);
    try {
      await api(`/api/requests/${id}/recommend`, {
        method: "PATCH",
        body: JSON.stringify({ recommendation }),
      });
      // Done — back to the queue.
      navigate("/specialist");
    } catch (err) {
      setActionError(err.message);
      setBusy(false);
    }
  }

  async function submitCorrection() {
    setActionError("");
    setBusy(true);
    try {
      await api(`/api/requests/${id}/specialist-correction`, {
        method: "PATCH",
        body: JSON.stringify({ note: correctionNote }),
      });
      navigate("/specialist");
    } catch (err) {
      setActionError(err.message);
      setBusy(false);
    }
  }

  if (loading) return <div style={{ padding: "48px" }}>Loading...</div>;
  if (error) return <div style={{ padding: "48px" }}><div className="form-error">{error}</div></div>;
  if (!request) return null;

  return (
    <div className="spec-wrap">
      <header className="spec-header">
        <div className="brand">
          <span className="brand-mark">RO</span>
          <span className="brand-name">Requests Office</span>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate("/specialist")}>← Back to queue</button>
      </header>

      <main className="spec-review">
        <span className="request-ref">{request.reference}</span>
        <h1 className="spec-review-title">{request.title}</h1>

        {/* Request details — NO requester name/email shown to the specialist */}
        <div className="spec-detail-box">
          <div className="spec-detail-row"><span>Category</span><strong>{request.category}</strong></div>
          <div className="spec-detail-row"><span>Campus</span><strong style={{ textTransform: "capitalize" }}>{request.campus}</strong></div>
          <div className="spec-detail-row"><span>Department</span><strong>{request.department || "—"}</strong></div>
          <div className="spec-detail-row"><span>Amount</span><strong>{request.amount > 0 ? `₹${request.amount.toLocaleString("en-IN")}` : "—"}</strong></div>
        </div>

        {actionError && <div className="form-error">{actionError}</div>}

        {/* ACTION 1: Recommendation */}
        <div className="spec-action-block">
          <h2 className="spec-action-title">Your recommendation</h2>
          <textarea className="input spec-textarea" rows="4"
            placeholder="Write your recommendation for this request..."
            value={recommendation} onChange={(e) => setRecommendation(e.target.value)} />
          <button className="btn btn-primary spec-big-btn"
            disabled={busy || !recommendation.trim()} onClick={submitRecommendation}>
            Submit recommendation
          </button>
        </div>

        <div className="spec-divider"><span>or</span></div>

        {/* ACTION 2: Request correction */}
        <div className="spec-action-block">
          <h2 className="spec-action-title">Send back for correction</h2>
          <textarea className="input spec-textarea" rows="3"
            placeholder="Explain what needs to be corrected..."
            value={correctionNote} onChange={(e) => setCorrectionNote(e.target.value)} />
          <button className="btn btn-secondary spec-big-btn"
            disabled={busy || !correctionNote.trim()} onClick={submitCorrection}>
            Request correction
          </button>
        </div>
      </main>
    </div>
  );
}

export default SpecialistRequestDetail;