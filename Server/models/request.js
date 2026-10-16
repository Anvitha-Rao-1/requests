import mongoose from "mongoose";

// The exact set of statuses a request can be in, matching our workflow.
// Defining them as a constant avoids typos and lets us reuse the list.
export const STATUSES = [
  "submitted",          // requester just created it
  "under_office_check", // coordinator is reviewing
  "needs_correction",   // sent back to requester to fix
  "with_specialist",    // forwarded for expert review
  "decision_made",      // outcome decided, awaiting requester acknowledgement
  "closed",             // requester confirmed, request complete
];

// A sub-schema for each entry in the activity history.
// Sub-schemas let us nest structured data inside a request document.
const historyEntrySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },   // e.g. "submitted", "requested correction"
    by: { type: String, required: true },        // name of who did it
    note: { type: String },                       // optional message
    at: { type: Date, default: Date.now },        // when it happened
  },
  { _id: false } // these nested entries don't each need their own id
);

const requestSchema = new mongoose.Schema(
  {
    // Human-friendly reference number, e.g. "RO-1042". We'll generate it on create.
    reference: { type: String, required: true, unique: true },

    // Core request details (from the brief's required fields).
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    campus: { type: String, enum: ["main", "north", "city"], required: true },
    department: { type: String, trim: true },
    amount: { type: Number, default: 0 }, // "the amount if any" — 0 when none

    // Names of other people involved (an array of strings).
    otherPeople: [{ type: String, trim: true }],

    // Link back to the user who created this request.
    // ObjectId + ref means "this stores a User's id and points to the users collection."
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Current status — must be one of our defined statuses.
    status: {
      type: String,
      enum: STATUSES,
      default: "submitted", // every new request starts here
    },

    // The specialist assigned (set only when forwarded). Optional.
    specialist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // The specialist's recommendation text, filled in during expert review.
    recommendation: { type: String },

    // The final decision text the coordinator communicates.
    decision: { type: String },

    // Has the requester acknowledged seeing the decision?
    acknowledged: { type: Boolean, default: false },

    // Full activity history — an array of the sub-schema above.
    history: [historyEntrySchema],
  },
  {
    timestamps: true, // auto createdAt / updatedAt
  }
);

const Request = mongoose.model("Request", requestSchema);

export default Request;