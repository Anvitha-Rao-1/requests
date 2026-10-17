import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { statusInfo } from "../statusLabels";
import HistoryTimeline from "../components/HistoryTimeline";
import Documents from "../components/Documents";

function CoordinatorRequestDetail() {
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
  }, [id]);

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

  async function runAction(path, body) {
    setActionError("");
    setBusy(true);
    try {
      const updated = await api(`/api/requests/${id}/${path}`, {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      });
      setRequest(updated);
      setCorrectionNote("");
      setDecisionText("");
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
      <button className="btn btn-secondary" onClick={() => navigate("/coordinator")} style={{ marginBottom: "24px" }}>
        ← Back to all requests
      </button>

      <div className="detail-grid">
        {/* LEFT: request details + documents + actions */}
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

          {/* DOCUMENTS */}
          <div className="detail-card">
            <Documents
              request={request}
              canUpload={true}
              onUpdated={(updated) => setRequest(updated)}
            />
          </div>

          {/* ACTIONS — one clear step at a time */}
          <div className="detail-card">
            <h3 style={{ marginBottom: "4px" }}>What to do now</h3>
            {actionError && <div className="form-error" style={{ marginTop: "12px" }}>{actionError}</div>}

            {/* SUBMITTED → start checking */}
            {request.status === "submitted" && (
              <>
                <p className="action-guide">This request is new. Start checking it, then decide whether to send it to the specialist or ask the requester to fix something.</p>
                <button className="btn btn-primary act-btn" disabled={busy} onClick={() => runAction("review")}>
                  Start checking this request
                </button>
              </>
            )}

            {/* UNDER OFFICE CHECK → forward, correct, or decide */}
            {request.status === "under_office_check" && (
              <>
                <p className="action-guide">You're checking this request. Choose one:</p>
                <button className="btn btn-primary act-btn" disabled={busy} onClick={() => runAction("forward")}>
                  Send to specialist for expert review
                </button>

                <div className="act-divider">or communicate a decision directly</div>
                <textarea className="input" rows="2" placeholder="Write the decision for the requester"
                  value={decisionText} onChange={(e) => setDecisionText(e.target.value)} style={{ marginBottom: "8px", resize: "vertical" }} />
                <button className="btn btn-secondary act-btn" disabled={busy || !decisionText.trim()}
                  onClick={() => runAction("decision", { decision: decisionText })}>
                  Send this decision
                </button>

                <div className="act-divider">or send back to fix something</div>
                <textarea className="input" rows="2" placeholder="What does the requester need to correct?"
                  value={correctionNote} onChange={(e) => setCorrectionNote(e.target.value)} style={{ marginBottom: "8px", resize: "vertical" }} />
                <button className="btn btn-secondary act-btn" disabled={busy || !correctionNote.trim()}
                  onClick={() => runAction("request-correction", { note: correctionNote })}>
                  Ask requester to correct
                </button>
              </>
            )}

            {/* WITH SPECIALIST → waiting */}
            {request.status === "with_specialist" && (
              <p className="action-guide">This is with the specialist for expert review. Wait for their recommendation.</p>
            )}

            {/* DECISION MADE → relay decision + close after acknowledgement */}
            {request.status === "decision_made" && (
              <>
                {request.recommendation && (
                  <div className="callout callout-indigo" style={{ margin: "12px 0" }}>
                    <strong>Specialist's recommendation:</strong>
                    <p>{request.recommendation}</p>
                  </div>
                )}
                {!request.decision ? (
                  <>
                    <p className="action-guide">The specialist has given their recommendation. Write the final decision to send to the requester.</p>
                    <textarea className="input" rows="2" placeholder="Write the decision for the requester"
                      value={decisionText} onChange={(e) => setDecisionText(e.target.value)} style={{ marginBottom: "8px", resize: "vertical" }} />
                    <button className="btn btn-primary act-btn" disabled={busy || !decisionText.trim()}
                      onClick={() => runAction("decision", { decision: decisionText })}>
                      Send decision to requester
                    </button>
                  </>
                ) : request.acknowledged ? (
                  <>
                    <p className="action-guide" style={{ color: "#86EFAC" }}>✓ The requester has seen the decision. You can close this request.</p>
                    <button className="btn btn-primary act-btn" disabled={busy} onClick={() => runAction("close")}>
                      Close this request
                    </button>
                  </>
                ) : (
                  <p className="action-guide">Decision sent. Waiting for the requester to confirm they've seen it before you can close.</p>
                )}
              </>
            )}

            {/* NEEDS CORRECTION → waiting on requester */}
            {request.status === "needs_correction" && (
              <p className="action-guide">Waiting for the requester to make the correction and resubmit.</p>
            )}

            {/* CLOSED */}
            {request.status === "closed" && (
              <div className="callout callout-green" style={{ marginTop: "12px" }}>
                <strong>This request is closed. Nothing more to do.</strong>
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