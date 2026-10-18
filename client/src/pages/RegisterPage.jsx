import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { saveAuth } from "../auth";
import Star from "../components/star";

function RegisterPage() {
  const navigate = useNavigate();

  // One state object for all the form fields.
  const [form, setForm] = useState({
    name: "", email: "", password: "", campus: "main", department: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // One handler updates whichever field changed, by its name.
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Calls the register endpoint. On success it returns a token + user,
      // same shape as login, so we log them straight in.
      const data = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      saveAuth(data.token, data.user);
      navigate("/requester"); // new users are always requesters
    } catch (err) {
      setError(err.message); // e.g. "Please use your organisation email"
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Link to="/" className="brand" style={{ justifyContent: "center", marginBottom: "24px" }}>
         <span className="brand-mark"><Star size={22} /></span>
          <span className="brand-name">Requests Office</span>
        </Link>

        <h2 className="auth-title">Create account</h2>
        <p className="auth-sub">Sign up with your organisation email.</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <label className="field">
            <span className="field-label">Full name</span>
            <input className="input" name="name" value={form.name}
              onChange={handleChange} placeholder="Your name" required />
          </label>

          <label className="field">
            <span className="field-label">Organisation email</span>
            <input className="input" type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@christuniversity.in" required />
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <input className="input" type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="At least 6 characters" required />
          </label>

          <label className="field">
            <span className="field-label">Campus</span>
            <select className="input" name="campus" value={form.campus} onChange={handleChange}>
              <option value="main">Main</option>
              <option value="north">North</option>
              <option value="city">City</option>
            </select>
          </label>

          <label className="field">
            <span className="field-label">Department (optional)</span>
            <input className="input" name="department" value={form.department}
              onChange={handleChange} placeholder="e.g. Computer Science" />
          </label>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }}
            disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "0.9rem" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--indigo)", fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;