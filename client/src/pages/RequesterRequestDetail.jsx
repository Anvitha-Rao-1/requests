import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { statusInfo } from "../statusLabels";
import HistoryTimeline from "../components/HistoryTimeline";
import Documents from "../components/Documents";

function RequesterRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [resubmitNote, setResubmitNote] = useState("");
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

  async function runAction(path, body) {
    setActionError("");
    setBusy(true);
    try {
      const updated = await api(`/api/requests/${id}/${path}`, {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      });
      setRequest(updated);
      setResubmitNote("");
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

  // Find the most recent correction note from the history, to show the requester
  // what needs fixing. We search from newest to oldest for a correction entry.
  const lastCorrection = [...request.history].reverse()
    .find((h) => h.action.toLowerCase().includes("correction") && h.note);

  return (
    <div className="detail-wrap">
      <button className="btn btn-secondary" onClick={() => navigate("/requester")} style={{ marginBottom: "24px" }}>
        ← Back to my requests
      </button>

      <div className="detail-grid">
        <div>
          <div className="detail-card">
            <div className="request-card-top">
              <span className="request-ref">{request.reference}</span>
              <span className={`status-pill ${info.cls}`}>{info.label}</span>
            </div>
            <h1>{request.title}</h1>

            <dl className="detail-list">
              <div><dt>Category</dt><dd>{request.category}</dd></div>
              <div><dt>Campus</dt><dd style={{ textTransform: "capitalize" }}>{request.campus}</dd></div>
              <div><dt>Department</dt><dd>{request.department || "—"}</dd></div>
              <div><dt>Amount</dt><dd>{request.amount > 0 ? `₹${request.amount.toLocaleString("en-IN")}` : "—"}</dd></div>
              <div><dt>Other people</dt><dd>{request.otherPeople?.length ? request.otherPeople.join(", ") : "—"}</dd></div>
            </dl>
          </div>

          {/* DOCUMENTS — requester can upload when submitted or needs correction */}
          <div className="detail-card">
            <Documents
              request={request}
              canUpload={["submitted", "under_office_check", "needs_correction"].includes(request.status)}
              onUpdated={(updated) => setRequest(updated)}
            />
          </div>

          {/* CONTEXT-AWARE ACTIONS */}
          <div className="detail-card">
            <h3 style={{ marginBottom: "16px" }}>What you can do</h3>
            {actionError && <div className="form-error">{actionError}</div>}

            {/* NEEDS CORRECTION → show what was asked + resubmit */}
            {request.status === "needs_correction" && (
              <div>
                {lastCorrection && (
                  <div className="callout callout-amber">
                    <strong>Correction requested:</strong>
                    <p>{lastCorrection.note}</p>
                  </div>
                )}
                <textarea className="input" rows="3" placeholder="Describe what you changed (optional)"
                  value={resubmitNote} onChange={(e) => setResubmitNote(e.target.value)}
                  style={{ margin: "12px 0", resize: "vertical" }} />
                <button className="btn btn-primary" style={{ width: "100%" }}
                  disabled={busy} onClick={() => runAction("resubmit", { note: resubmitNote })}>
                  Resubmit request
                </button>
              </div>
            )}

            {/* DECISION MADE, not yet acknowledged → show decision + acknowledge */}
            {request.status === "decision_made" && !request.acknowledged && (
              <div>
                {request.decision && (
                  <div className="callout callout-indigo">
                    <strong>Decision:</strong>
                    <p>{request.decision}</p>
                  </div>
                )}
                <button className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }}
                  disabled={busy} onClick={() => runAction("acknowledge")}>
                  I have seen this decision
                </button>
              </div>
            )}

            {/* DECISION MADE, acknowledged → waiting for closure */}
            {request.status === "decision_made" && request.acknowledged && (
              <p style={{ color: "rgba(255,255,255,0.65)" }}>
                You've acknowledged the decision. The office will close this request shortly.
              </p>
            )}

            {/* Other statuses → informational */}
            {["submitted", "under_office_check", "with_specialist"].includes(request.status) && (
              <p style={{ color: "rgba(255,255,255,0.65)" }}>
                Your request is being processed. We'll let you know if anything is needed.
              </p>
            )}

            {request.status === "closed" && (
              <div className="callout callout-green">
                <strong>This request is closed.</strong>
                {request.decision && <p>{request.decision}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="detail-card">
          <h3 style={{ marginBottom: "16px" }}>Activity history</h3>
          <HistoryTimeline history={request.history} />
        </div>
      </div>
    </div>
  );
}

export default RequesterRequestDetail;