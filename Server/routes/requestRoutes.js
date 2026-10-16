import express from "express";
import Request from "../models/request.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import User from "../models/user.js";

const router = express.Router();

// Generates a reference like "RO-1042".
function makeReference() {
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 90 + 10); // two digits
  return `RO-${stamp}${rand}`;
}

// POST /api/requests  — create a new request (requesters only).
router.post("/", requireAuth, requireRole("requester"), async (req, res) => {
  try {
    const { title, category, department, amount, otherPeople } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: "Title and category are required" });
    }

    // campus and requester come from the authenticated user, never the body.
    const newRequest = await Request.create({
      reference: makeReference(),
      title,
      category,
      campus: req.user.campus,
      department: department || req.user.department,
      amount: amount || 0,
      otherPeople: otherPeople || [],
      requester: req.user._id,
      status: "submitted",
      history: [
        {
          action: "Request submitted",
          by: req.user.name,
          at: new Date(),
        },
      ],
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error("Create request error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/requests  — list the logged-in requester's OWN requests.
router.get("/", requireAuth, requireRole("requester"), async (req, res) => {
  try {
    const requests = await Request.find({ requester: req.user._id })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error("List requests error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/requests/all  — coordinator sees EVERY request, all campuses.
// MUST be defined before /:id, or the word "all" is treated as an id.
router.get("/all", requireAuth, requireRole("coordinator"), async (req, res) => {
  try {
    const filter = {};
    if (req.query.campus) filter.campus = req.query.campus;
    if (req.query.status) filter.status = req.query.status;

    const requests = await Request.find(filter)
      .populate("requester", "name email campus department")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("List all requests error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/requests/:id  — view one request in full. Wildcard route — keep LAST.
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate("requester", "name email campus department")
      .populate("specialist", "name email");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // A requester may only view their own request.
    if (
      req.user.role === "requester" &&
      request.requester._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(request);
  } catch (error) {
    console.error("Get request error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});
// Helper: append a history entry to a request (keeps the code DRY).
function addHistory(request, action, by, note) {
  request.history.push({ action, by, note, at: new Date() });
}

// PATCH /api/requests/:id/review  — coordinator starts checking a submitted request.
router.patch("/:id/review", requireAuth, requireRole("coordinator"), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Only a freshly submitted request can be moved into review.
    if (request.status !== "submitted") {
      return res.status(400).json({ message: "Only submitted requests can be moved to review" });
    }

    request.status = "under_office_check";
    addHistory(request, "Moved to office check", req.user.name);
    await request.save();

    res.json(request);
  } catch (error) {
    console.error("Review error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/requests/:id/request-correction  — coordinator sends it back to the requester.
router.patch("/:id/request-correction", requireAuth, requireRole("coordinator"), async (req, res) => {
  try {
    const { note } = req.body; // what needs fixing
    if (!note) return res.status(400).json({ message: "Please say what needs correcting" });

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Can request a correction while checking or after specialist review.
    if (!["under_office_check", "submitted", "with_specialist"].includes(request.status)) {
      return res.status(400).json({ message: "Cannot request a correction at this stage" });
    }

    request.status = "needs_correction";
    addHistory(request, "Correction requested", req.user.name, note);
    await request.save();

    res.json(request);
  } catch (error) {
    console.error("Request-correction error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/requests/:id/forward  — coordinator forwards to the specialist.
router.patch("/:id/forward", requireAuth, requireRole("coordinator"), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.status !== "under_office_check") {
      return res.status(400).json({ message: "Only requests under office check can be forwarded" });
    }

    // Find the specialist by role (one specialist in this system).
    const specialist = await User.findOne({ role: "specialist" });
    if (!specialist) return res.status(400).json({ message: "No specialist available" });

    request.status = "with_specialist";
    request.specialist = specialist._id;
    addHistory(request, "Forwarded to specialist", req.user.name);
    await request.save();

    res.json(request);
  } catch (error) {
    console.error("Forward error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});
// GET /api/requests/specialist/queue  — requests currently with THIS specialist.
// Specific path (/specialist/queue) so it doesn't clash with /:id.
router.get("/specialist/queue", requireAuth, requireRole("specialist"), async (req, res) => {
  try {
    // Only requests assigned to this specialist AND still awaiting their review.
    const requests = await Request.find({
      specialist: req.user._id,
      status: "with_specialist",
    })
      // Note: we populate the requester's campus/department but the UI will
      // choose NOT to show identifying contact details to the specialist.
      .populate("requester", "campus department")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("Specialist queue error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/requests/:id/recommend  — specialist submits their recommendation.
router.patch("/:id/recommend", requireAuth, requireRole("specialist"), async (req, res) => {
  try {
    const { recommendation } = req.body;
    if (!recommendation) {
      return res.status(400).json({ message: "A recommendation is required" });
    }

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Must be assigned to THIS specialist and awaiting their review.
    if (
      request.status !== "with_specialist" ||
      request.specialist?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "This request is not in your queue" });
    }

    // Record the recommendation. Status goes back toward the coordinator:
    // we move it to decision_made so the coordinator can relay the outcome.
    request.recommendation = recommendation;
    request.status = "decision_made";
    request.history.push({
      action: "Specialist submitted recommendation",
      by: "Specialist", // deliberately not naming the person to the requester-facing log
      note: recommendation,
      at: new Date(),
    });
    await request.save();

    res.json(request);
  } catch (error) {
    console.error("Recommend error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/requests/:id/specialist-correction  — specialist asks for a correction.
// This goes back through the COORDINATOR, never directly to the requester.
router.patch("/:id/specialist-correction", requireAuth, requireRole("specialist"), async (req, res) => {
  try {
    const { note } = req.body;
    if (!note) return res.status(400).json({ message: "Please describe what needs correcting" });

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (
      request.status !== "with_specialist" ||
      request.specialist?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "This request is not in your queue" });
    }

    // Back to needs_correction. The coordinator sees this and relays it on.
    request.status = "needs_correction";
    request.history.push({
      action: "Specialist requested correction",
      by: "Specialist",
      note,
      at: new Date(),
    });
    await request.save();

    res.json(request);
  } catch (error) {
    console.error("Specialist-correction error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});
// PATCH /api/requests/:id/resubmit  — requester fixes and resubmits after a correction.
router.patch("/:id/resubmit", requireAuth, requireRole("requester"), async (req, res) => {
  try {
    const { note } = req.body; // optional message about what they changed

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Ownership: a requester can only resubmit their OWN request.
    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Can only resubmit something that was sent back.
    if (request.status !== "needs_correction") {
      return res.status(400).json({ message: "This request is not awaiting correction" });
    }

    // Back to office check so the coordinator reviews the fix.
    request.status = "under_office_check";
    request.history.push({
      action: "Requester resubmitted",
      by: req.user.name,
      note: note || "",
      at: new Date(),
    });
    await request.save();

    res.json(request);
  } catch (error) {
    console.error("Resubmit error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/requests/:id/decision  — coordinator communicates the outcome to the requester.
router.patch("/:id/decision", requireAuth, requireRole("coordinator"), async (req, res) => {
  try {
    const { decision } = req.body;
    if (!decision) return res.status(400).json({ message: "A decision is required" });

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    // The outcome is communicated once a decision has been made (after specialist,
    // or directly by the coordinator for requests that didn't need expert review).
    if (!["decision_made", "under_office_check"].includes(request.status)) {
      return res.status(400).json({ message: "Cannot record a decision at this stage" });
    }

    request.decision = decision;
    request.status = "decision_made";
    request.acknowledged = false; // requester hasn't seen it yet
    request.history.push({
      action: "Decision communicated",
      by: req.user.name,
      note: decision,
      at: new Date(),
    });
    await request.save();

    res.json(request);
  } catch (error) {
    console.error("Decision error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/requests/:id/acknowledge  — requester confirms they have seen the decision.
router.patch("/:id/acknowledge", requireAuth, requireRole("requester"), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (request.status !== "decision_made") {
      return res.status(400).json({ message: "There is no decision to acknowledge yet" });
    }

    // Mark acknowledged. The request is NOT closed here — only the coordinator closes.
    request.acknowledged = true;
    request.history.push({
      action: "Requester acknowledged the decision",
      by: req.user.name,
      at: new Date(),
    });
    await request.save();

    res.json(request);
  } catch (error) {
    console.error("Acknowledge error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/requests/:id/close  — coordinator closes the request AFTER acknowledgement.
router.patch("/:id/close", requireAuth, requireRole("coordinator"), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    // The brief's key rule: a request can ONLY be closed after the requester
    // has acknowledged the decision. The coordinator cannot skip this.
    if (!request.acknowledged) {
      return res.status(400).json({ message: "Cannot close until the requester acknowledges the decision" });
    }

    request.status = "closed";
    request.history.push({
      action: "Request closed",
      by: req.user.name,
      at: new Date(),
    });
    await request.save();

    res.json(request);
  } catch (error) {
    console.error("Close error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;