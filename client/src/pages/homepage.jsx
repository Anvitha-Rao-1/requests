// HomePage is the public landing page shown before login.
// It's a function component that returns the page markup.
import { Link } from "react-router-dom";
import Star from "../components/star";

// HomePage is the public landing page shown before login.
// It's a function component that returns the page markup.
function HomePage() {
  return (
    <div className="home">
      {/* NAVBAR — fixed at top, shows brand + login action */}
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Brand mark: a small logo box + the name */}
          <div className="brand">
            <span className="brand-mark"><Star size={22} /></span>
            <span className="brand-name">Requests Office</span>
          </div>

          {/* Right side: a login button (just a placeholder link for now) */}
            <Link to="/login" className="btn btn-primary">Log in</Link>
        </div>
      </nav>

      {/* Page content will go below the navbar in the next sub-steps */}
          {/* HERO — two columns: message on the left, visual panel on the right */}
      <main className="home-main">
        <section className="hero">
          {/* LEFT: headline + supporting text + actions */}
          <div className="hero-text">
            <span className="hero-badge">Main · North · City campuses</span>
            <h1 className="hero-title">
              One place for every request, from submission to decision.
            </h1>
            <p className="hero-sub">
              Raise a request with your organisation email, track it at every
              stage, and get a clear decision. No lost files, no chasing updates.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary">Raise a request</Link>
              <a href="#how-it-works" className="btn btn-secondary">How it works</a>
            </div>
          </div>

          {/* RIGHT: a visual panel. For now, a styled status-card mockup. */}
          <div className="hero-visual">
            <div className="status-card">
              <div className="status-card-row">
                <span className="status-dot" />
                <span>Request #RO-1042</span>
              </div>
              <h3>Lab equipment purchase</h3>
              <p className="status-card-meta">Main campus · Procurement</p>
              <div className="status-pill status-pill-amber">Under office check</div>
            </div>
          </div>
        </section>
                {/* HOW IT WORKS — 4-step process visual */}
        <section id="how-it-works" className="steps-section">
          <h2 className="section-title">How a request moves</h2>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <h3>Submit</h3>
              <p>Raise a request with your details and documents.</p>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <h3>Office check</h3>
              <p>The office reviews within 2 working days and may ask for corrections.</p>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <h3>Expert review</h3>
              <p>Some requests go for expert review, taking up to 7 working days.</p>
            </div>
            <div className="step">
              <span className="step-num">4</span>
              <h3>Confirm & close</h3>
              <p>You confirm you have seen the decision, and only then is it closed.</p>
            </div>
          </div>
        </section>

        {/* APPLICANT INFO — the required facts, as cards */}
        <section className="info-section">
          <h2 className="section-title">Information for applicants</h2>
          <div className="info-grid">
            <div className="info-card">
              <h3>Who can apply</h3>
              <p>Anyone with an organisation email, from the main, north or city campus.</p>
            </div>
            <div className="info-card">
              <h3>What you provide</h3>
              <p>Your name, campus, department, a short title, the category, names of other people involved, and the amount if any.</p>
            </div>
            <div className="info-card">
              <h3>Documents to attach</h3>
              <p>A signed covering letter, a short description, and any quotations or invoices. Files must be readable and under 10 MB.</p>
            </div>
            <div className="info-card">
              <h3>Timelines</h3>
              <p>The office checks your request within 2 working days and may ask you to correct things more than once. Expert review takes up to 7 working days.</p>
            </div>
            <div className="info-card">
              <h3>About the expert</h3>
              <p>You never deal with the expert directly. When a decision is made, you confirm you have seen it, and only then is the request closed.</p>
            </div>
            <div className="info-card">
              <h3>Office hours & help</h3>
              <p>Open Monday to Friday, 9:30 AM to 4:30 PM, closed on public holidays. For help, visit or call 080 0000 0000.</p>
            </div>
          </div>
        </section>
      </main>
            {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="brand">
            <span className="brand-mark"><Star size={22} /></span>
            <span className="brand-name">Requests Office</span>
          </div>
          <p>Monday–Friday, 9:30 AM – 4:30 PM · 080 0000 0000</p>
        </div>
      </footer>
    </div>
  );

}
export default HomePage;