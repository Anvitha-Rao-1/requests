# Requests Office

A role-based request-management portal built on the MERN stack.
Full Stack Development internship assignment — Centre for Artificial Intelligence, Christ University.

## Live links

- **Live application:** https://requests-ea3c.onrender.com
- **GitHub repository:** https://github.com/Anvitha-Rao-1/requests

> **First load note:** the backend runs on Render's free tier, which sleeps after inactivity. The first request after it has been idle can take 30–50 seconds to wake the server; after that it's fast.

## Overview

Requests Office replaces a fragmented office process — campus-wise Excel sheets, email and WhatsApp — with a single web application. A request travels from a **requester**, through a **coordinator**, to an external **specialist** and back, with every role seeing only what it should and every action recorded in an activity history.

It implements the full lifecycle: submission, document upload, office review, one or more correction rounds, expert review, a communicated decision, requester acknowledgement, and final closure.

## Demo accounts

Four demo users are created by a seed script (passwords are bcrypt-hashed; no real credentials are in source control). New requesters can also self-register from the login page using an organisation email.

| Role | Email | Password |
|---|---|---|
| Coordinator | coordinator@christuniversity.in | coord123 |
| Specialist | specialist@christuniversity.in | spec123 |
| Requester (Main) | requester.main@christuniversity.in | req123 |
| Requester (North) | requester.north@christuniversity.in | req123 |

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, plain CSS with design tokens |
| Backend | Node.js, Express |
| Database | MongoDB (Atlas), Mongoose |
| Auth | JSON Web Tokens (JWT), bcrypt password hashing |
| Files | Cloudinary (persistent cloud storage), Multer |
| Hosting | Render (single service serving API + built frontend) |

## Architecture

The React frontend is built to static files and served by the Express backend, so the app runs as a **single service on one origin** — no cross-origin complexity.

```
Browser (React SPA)
      |  HTTP requests to /api/...
      v
Express API  --  JWT auth + role checks on every protected route
      |  Mongoose queries
      v
MongoDB Atlas  (users, requests, documents, history)

Uploaded files  -->  Cloudinary (URLs + metadata stored in MongoDB)
```

### Repository structure

```
requests/
├── client/                 React frontend (Vite)
│   └── src/
│       ├── pages/          Home, Login, Register, role dashboards, detail pages
│       ├── components/     Documents, HistoryTimeline, NewRequestModal, Star
│       ├── api.js          fetch wrapper (adds JWT, handles JSON + uploads)
│       ├── auth.js         token + user storage helpers
│       ├── statusLabels.js plain-language status labels
│       └── index.css       design tokens + all styling
├── Server/
│   ├── config/             db.js (Mongoose), cloudinary.js (Multer storage)
│   ├── middleware/         auth.js (requireAuth, requireRole)
│   ├── models/             user.js, request.js
│   ├── routes/             authRoutes.js, requestRoutes.js
│   ├── seed.js             creates the four demo users
│   └── index.js            Express app; serves API + built frontend
└── README.md
```

## Request workflow

The backend enforces which status transitions are legal — an illegal move (e.g. forwarding a closed request) is rejected.

| Status | Who acts next | Action |
|---|---|---|
| Submitted | Coordinator | Start office check |
| Under office check | Coordinator | Forward to specialist, decide, or request correction |
| Needs correction | Requester | Edit and resubmit |
| With specialist | Specialist | Recommend, or request a correction (via coordinator) |
| Decision made | Requester | Acknowledge the decision |
| Closed | — | Complete (closed only after acknowledgement) |

Multiple correction rounds are supported. Every round, every document version, and every action is appended to the request's history — nothing is overwritten.

## Data model

**User:** `name`, `email` (unique), `password` (bcrypt hash), `role` (requester / coordinator / specialist), `campus` (main / north / city), `department`.

**Request:** `reference` (unique, e.g. `RO-563262`), `title`, `category`, `campus`, `department`, `amount`, `otherPeople`, `requester` (ref), `status`, `specialist` (ref), `recommendation`, `decision`, `acknowledged`, plus two nested arrays:
- **documents** — label, Cloudinary URL, file type, version, uploader, timestamp
- **history** — action, who performed it, optional note, timestamp

## Security & permissions

Permissions are enforced on the **server**, not merely by hiding buttons:

- **Authentication** — `requireAuth` verifies the JWT on every protected route and loads the live user.
- **Organisation-email registration** — self sign-up is restricted to `@christuniversity.in` addresses, checked server-side; new accounts are always requesters (privileged accounts come only from the seed script).
- **Authorisation** — `requireRole(...)` restricts each route to the correct role(s); a requester hitting a coordinator route gets `403`.
- **Ownership** — a requester can only read or act on their own requests; the query filters by the authenticated user's id, so changing a URL or request id can't expose another user's data.
- **Trusted fields from the token** — a request's `campus` and `requester` come from the authenticated user, never the form, so a request can't be filed under the wrong campus or on someone else's behalf.
- **Specialist isolation** — the specialist never receives the requester's name or email, and never communicates with the requester directly; everything flows through the coordinator.
- **Closure rule** — a request can only be closed after the requester acknowledges the decision; the backend blocks an early close.
- **Secrets** — `MONGODB_URI`, `JWT_SECRET` and the Cloudinary keys live in environment variables, kept out of Git via `.gitignore`.

## Document handling

Uploads are validated on the server before storage: only PDF, JPG and PNG, with a 10 MB limit. Files stream to Cloudinary (persistent, so documents survive redeploys) and their metadata is stored on the request. Each upload is a new version, so earlier versions are never lost. All three roles view documents inline on the request detail page.

## Running locally

**Prerequisites:** Node.js (v18+), a MongoDB Atlas connection string, a Cloudinary account.

### Backend

```bash
cd Server
npm install

# create Server/.env with:
#   MONGODB_URI=<your Atlas connection string>
#   JWT_SECRET=<any long random string>
#   CLOUDINARY_CLOUD_NAME=<your cloud name>
#   CLOUDINARY_API_KEY=<your key>
#   CLOUDINARY_API_SECRET=<your secret>

node seed.js      # create the four demo users (run once)
npm run dev       # API on http://localhost:5000
```

### Frontend

```bash
cd client
npm install
npm run dev       # app on http://localhost:5173
```

The Vite dev server proxies `/api` calls to the backend in local development.

## Key design decisions

1. **Permissions enforced in the backend.** The UI hides irrelevant actions for a clean experience, but every rule is also checked server-side, so the API is safe even if the UI is bypassed.
2. **Status as a state machine.** Each action verifies the request is in a status from which the move is legal, preventing invalid states.
3. **References, not copies, for related data.** Requests reference their user and specialist and populate fields on read, so details are never duplicated across old requests.
4. **Document versions appended, never replaced.** Correction rounds keep the full document history.
5. **Single-service deployment.** Serving the built frontend from Express keeps everything on one origin — no CORS issues, one URL to submit.

## Known limitations

- The free Render tier cold-starts after inactivity, delaying the first request by up to ~50 seconds.
- The system assumes a single specialist; the data model supports assigning one of many, which would be the natural next step for scaling.