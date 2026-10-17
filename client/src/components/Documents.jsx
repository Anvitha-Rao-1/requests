import { useState } from "react";
import { uploadFile } from "../api";

function Documents({ request, canUpload, onUpdated }) {
  const [label, setLabel] = useState("Covering letter");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [openId, setOpenId] = useState(null);

  const docs = request.documents || [];

  async function handleUpload(e) {
    e.preventDefault();
    setError("");
    if (!file) { setError("Please choose a file first."); return; }
    const okTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!okTypes.includes(file.type)) { setError("Only PDF, JPG, or PNG files are allowed."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("File must be under 10 MB."); return; }

    setUploading(true);
    try {
      const updated = await uploadFile(`/api/requests/${request._id}/documents`, file, label);
      onUpdated(updated);
      setFile(null);
      e.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="docs">
      <h3 className="docs-heading">Documents</h3>

      {/* SECTION 1: already uploaded */}
      {docs.length === 0 ? (
        <p className="docs-empty">No documents uploaded yet.</p>
      ) : (
        <ul className="doc-list">
          {[...docs].reverse().map((d) => {
            const isOpen = openId === d._id;
            const isImage = d.fileType === "jpg" || d.fileType === "png";
            return (
              <li key={d._id} className="doc-item-wrap">
                <div className="doc-item">
                  <div className="doc-info">
                    <p className="doc-name">{d.label} <span className="doc-type">{d.fileType}</span></p>
                    <p className="doc-meta">Uploaded by {d.uploadedBy} · version {d.version}</p>
                  </div>
                  <button className="btn btn-secondary doc-view" onClick={() => setOpenId(isOpen ? null : d._id)}>
                    {isOpen ? "Hide" : "View"}
                  </button>
                </div>
                {isOpen && (
                  <div className="doc-preview">
                    {isImage ? (
                      <img src={d.url} alt={d.label} className="doc-preview-img" />
                    ) : (
                      <iframe src={d.url} title={d.label} className="doc-preview-frame" />
                    )}
                    <a href={d.url} target="_blank" rel="noreferrer" className="doc-openfull">Open full size ↗</a>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* SECTION 2: upload a new one — clearly separated */}
      {canUpload && (
        <form onSubmit={handleUpload} className="doc-upload">
          <p className="doc-upload-title">Add a document</p>
          {error && <div className="form-error">{error}</div>}
          <label className="doc-field-label">What is this document?</label>
          <select className="input doc-input" value={label} onChange={(e) => setLabel(e.target.value)}>
            <option>Covering letter</option>
            <option>Description</option>
            <option>Quotation</option>
            <option>Invoice</option>
            <option>Other</option>
          </select>
          <label className="doc-field-label">Choose the file</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files[0])}
            className="input doc-input" />
          <button type="submit" className="btn btn-primary doc-upload-btn" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload document"}
          </button>
          <p className="doc-hint">PDF, JPG or PNG · under 10 MB</p>
        </form>
      )}
    </div>
  );
}

export default Documents;