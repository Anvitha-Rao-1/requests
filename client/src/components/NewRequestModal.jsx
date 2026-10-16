import { useState } from "react";
import { api } from "../api";

// Props: onClose (close the modal), onCreated (tell the parent a request was made).
// Props are how a parent passes data and callbacks into a child component.
function NewRequestModal({ onClose, onCreated }) {
  // One state object holding all form fields — cleaner than many useStates.
  const [form, setForm] = useState({
    title: "",
    category: "",
    department: "",
    amount: "",
    otherPeople: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // One handler updates whichever field changed, by its name attribute.
  function handleChange(e) {
    const { name, value } = e.target;
    // Spread the existing form, override just the changed field.
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      // Convert the comma-separated people string into an array of names.
      const otherPeople = form.otherPeople
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0); // drop empties

      // Send to the API. The token is added automatically by our api() helper.
      const created = await api("/api/requests", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          department: form.department,
          amount: Number(form.amount) || 0, // text input → number
          otherPeople,
        }),
      });

      onCreated(created); // hand the new request back to the parent
      onClose();          // close the modal
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    // The dark overlay. Clicking it (but not the card) closes the modal.
    <div className="modal-overlay" onClick={onClose}>
      {/* stopPropagation stops a click inside the card from reaching the overlay */}
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Request</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <label className="field">
            <span className="field-label">Title *</span>
            <input
              className="input" name="title" value={form.title}
              onChange={handleChange} placeholder="Short title for your request" required
            />
          </label>

          <label className="field">
            <span className="field-label">Category *</span>
            <input
              className="input" name="category" value={form.category}
              onChange={handleChange} placeholder="e.g. Procurement, Travel, Event" required
            />
          </label>

          <label className="field">
            <span className="field-label">Department</span>
            <input
              className="input" name="department" value={form.department}
              onChange={handleChange} placeholder="Your department"
            />
          </label>

          <label className="field">
            <span className="field-label">Amount (₹, if any)</span>
            <input
              className="input" name="amount" type="number" min="0" value={form.amount}
              onChange={handleChange} placeholder="0"
            />
          </label>

          <label className="field">
            <span className="field-label">Other people involved</span>
            <input
              className="input" name="otherPeople" value={form.otherPeople}
              onChange={handleChange} placeholder="Comma-separated names"
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewRequestModal;