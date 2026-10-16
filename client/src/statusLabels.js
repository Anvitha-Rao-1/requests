// Maps internal status codes to human-readable labels and a colour class.
export const STATUS_INFO = {
  submitted:          { label: "Submitted",          cls: "status-pill-indigo" },
  under_office_check: { label: "Under office check",  cls: "status-pill-amber" },
  needs_correction:   { label: "Needs correction",    cls: "status-pill-red" },
  with_specialist:    { label: "Under expert review", cls: "status-pill-indigo" },
  decision_made:      { label: "Decision made",       cls: "status-pill-green" },
  closed:             { label: "Closed",              cls: "status-pill-gray" },
};

// Helper to safely get info for a status (falls back if unknown).
export function statusInfo(status) {
  return STATUS_INFO[status] || { label: status, cls: "status-pill-gray" };
}