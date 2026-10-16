// Shows a request's activity history as a vertical timeline.
// Props: history (array of { action, by, note, at }).
function HistoryTimeline({ history }) {
  if (!history || history.length === 0) {
    return <p style={{ color: "var(--gray-400)" }}>No activity yet.</p>;
  }

  return (
    <div className="timeline">
      {/* Newest first: copy the array and reverse so latest is on top. */}
      {[...history].reverse().map((h, i) => (
        <div className="timeline-item" key={i}>
          <div className="timeline-dot" />
          <div className="timeline-content">
            <p className="timeline-action">{h.action}</p>
            {h.note && <p className="timeline-note">{h.note}</p>}
            <p className="timeline-meta">
              {h.by} · {new Date(h.at).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default HistoryTimeline;