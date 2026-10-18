// useState lets a component remember values that change over time.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { saveAuth } from "../auth";
import Star from "../components/star";

function LoginPage() {
  const navigate = useNavigate();
  // Form field values.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Holds an error message to show the user (empty = no error).
  const [error, setError] = useState("");
  // True while the request is in flight, so we can disable the button.
  const [loading, setLoading] = useState(false);

  // async because we're waiting on a network request.
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");       // clear any previous error
    setLoading(true);   // show we're working

    try {
      // fetch() makes an HTTP request from the browser.
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // Parse the JSON the server sent back.
      const data = await response.json();

      // response.ok is true for status 200–299. If not, it was a 400/401/500.
      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Success: store the login so the app remembers us.
      saveAuth(data.token, data.user);

      // Send the user to the dashboard that matches their role.
      if (data.user.role === "requester") navigate("/requester");
      else if (data.user.role === "coordinator") navigate("/coordinator");
      else if (data.user.role === "specialist") navigate("/specialist");
    } catch (err) {
      // This catch fires for network failures (server down, no connection).
      setError("Could not reach the server. Is it running?");
    } finally {
      // Runs whether we succeeded or failed — always stop the loading state.
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        {/* Brand at the top of the card, links back home */}
        <Link to="/" className="brand" style={{ justifyContent: "center", marginBottom: "24px" }}>
          <span className="brand-mark"><Star size={22} /></span>
          <span className="brand-name">Requests Office</span>
        </Link>

        <h2 className="auth-title">Log in</h2>
        <p className="auth-sub">Use your organisation account.</p>

        <form onSubmit={handleSubmit}>
          {/* Show an error banner only when error state is non-empty. */}
          {error && <div className="form-error">{error}</div>}

          {/* EMAIL FIELD */}
          <label className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              className="input"
              placeholder="you@christuniversity.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          {/* PASSWORD FIELD */}
          <label className="field">
            <span className="field-label">Password</span>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "8px" }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        {/* Link to the registration page */}
        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "0.9rem" }}>
          New here? <Link to="/register" style={{ color: "var(--indigo)", fontWeight: 600 }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;