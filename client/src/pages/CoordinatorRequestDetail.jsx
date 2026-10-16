import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { statusInfo } from "../statusLabels";
import HistoryTimeline from "../components/HistoryTimeline";


function CoordinatorRequestDetail() {
  // useParams reads the :id from the URL (/coordinator/request/:id).
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [correctionNote, setCorrectionNote] = useState("");
  const [busy, setBusy] = useState(false);
    const [decisionText, setDecisionText] = useState("");

  useEffect(() => {
    loadRequest();
  }, [id]); // reload if the id changes

  async function loadRequest() {
    setLoading(true);
    setError("");
    try {
      const data = await api(`/api/requests/${id}`);
      setRequest(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Generic action runner: calls an endpoint, updates the request with the result.
  async function runAction(path, body) {
    setActionError("");
    setBusy(true);
    try {
      const updated = await api(`/api/requests/${id}/${path}`, {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      });
      setRequest(updated);       // refresh with the new state
      setCorrectionNote("");   
            setDecisionText("");  // clear the note field
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div style={{ padding: "48px" }}>Loading...</div>;
  if (error) return <div style={{ padding: "48px" }}><div className="form-error">{error}</div></div>;
  if (!request) return null;

  const info = statusInfo(request.status);

  return (
    <div className="detail-wrap">
      {/* Back link */}
      <button className="btn btn-secondary" onClick={() => navigate("/coordinator")} style={{ marginBottom: "24px" }}>
        ← Back to all requests
      </button>

      <div className="detail-grid">
        {/* LEFT: request details + actions */}
        <div>
          <div className="detail-card">
            <div className="request-card-top">
              <span className="request-ref">{request.reference}</span>
              <span className={`status-pill ${info.cls}`}>{info.label}</span>
            </div>
            <h1>{request.title}</h1>

            <dl className="detail-list">
              <div><dt>Requester</dt><dd>{request.requester?.name}</dd></div>
              <div><dt>Email</dt><dd>{request.requester?.email}</dd></div>
              <div><dt>Campus</dt><dd style={{ textTransform: "capitalize" }}>{request.campus}</dd></div>
              <div><dt>Department</dt><dd>{request.department || "—"}</dd></div>
              <div><dt>Category</dt><dd>{request.category}</dd></div>
              <div><dt>Amount</dt><dd>{request.amount > 0 ? `₹${request.amount.toLocaleString("en-IN")}` : "—"}</dd></div>
              <div><dt>Other people</dt><dd>{request.otherPeople?.length ? request.otherPeople.join(", ") : "—"}</dd></div>
            </dl>
          </div>

          {/* ACTIONS */}
          <div className="detail-card">
            <h3 style={{ marginBottom: "16px" }}>Actions</h3>
            {actionError && <div className="form-error">{actionError}</div>}

            {/* Start review — only shown when submitted */}
            {request.status === "submitted" && (
              <button className="btn btn-primary" style={{ width: "100%", marginBottom: "12px" }}
                disabled={busy} onClick={() => runAction("review")}>
                Start office check
              </button>
            )}

            {/* Forward — only when under office check */}
            {request.status === "under_office_check" && (
              <button className="btn btn-primary" style={{ width: "100%", marginBottom: "12px" }}
                disabled={busy} onClick={() => runAction("forward")}>
                Forward to specialist
              </button>
            )}

            {/* Request correction — available at a few stages */}
            {["submitted", "under_office_check", "with_specialist"].includes(request.status) && (
              <div>
                <textarea className="input" rows="3" placeholder="What needs correcting?"
                  value={correctionNote} onChange={(e) => setCorrectionNote(e.target.value)}
                  style={{ marginBottom: "8px", resize: "vertical" }} />
                <button className="btn btn-secondary" style={{ width: "100%" }}
                  disabled={busy || !correctionNote.trim()}
                  onClick={() => runAction("request-correction", { note: correctionNote })}>
                  Request correction
                </button>
              </div>
            )}

                       {/* Communicate a decision — available after office check or specialist review */}
            {["under_office_check", "decision_made"].includes(request.status) && (
              <div style={{ marginTop: "12px" }}>
                {/* Show the specialist's recommendation if there is one, to inform the decision */}
                {request.recommendation && (
                  <div className="callout callout-indigo" style={{ marginBottom: "12px" }}>
                    <strong>Specialist's recommendation:</strong>
                    <p>{request.recommendation}</p>
                  </div>
                )}
                <textarea className="input" rows="3" placeholder="Write the decision to communicate to the requester"
                  value={decisionText} onChange={(e) => setDecisionText(e.target.value)}
                  style={{ marginBottom: "8px", resize: "vertical" }} />
                <button className="btn btn-primary" style={{ width: "100%" }}
                  disabled={busy || !decisionText.trim()}
                  onClick={() => runAction("decision", { decision: decisionText })}>
                  {request.decision ? "Update decision" : "Communicate decision"}
                </button>
              </div>
            )}

            {/* Acknowledgement status + close */}
            {request.status === "decision_made" && (
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--gray-200)" }}>
                {request.acknowledged ? (
                  <>
                    <p style={{ color: "var(--green)", fontWeight: 600, marginBottom: "8px" }}>
                      ✓ Requester has acknowledged the decision.
                    </p>
                    <button className="btn btn-primary" style={{ width: "100%" }}
                      disabled={busy} onClick={() => runAction("close")}>
                      Close request
                    </button>
                  </>
                ) : (
                  <p style={{ color: "var(--gray-600)", fontSize: "0.9rem" }}>
                    Waiting for the requester to acknowledge before this can be closed.
                  </p>
                )}
              </div>
            )}

            {/* Needs correction — informational */}
            {request.status === "needs_correction" && (
              <p style={{ color: "var(--gray-600)", fontSize: "0.9rem", marginTop: "12px" }}>
                Waiting on the requester's correction.
              </p>
            )}

            {/* Closed */}
            {request.status === "closed" && (
              <div className="callout callout-green" style={{ marginTop: "12px" }}>
                <strong>This request is closed.</strong>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: history timeline */}
        <div className="detail-card">
          <h3 style={{ marginBottom: "16px" }}>Activity history</h3>
          <HistoryTimeline history={request.history} />
        </div>
      </div>
    </div>
  );
}

export default CoordinatorRequestDetail;