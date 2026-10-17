import mongoose from "mongoose";

// The exact set of statuses a request can be in, matching our workflow.
export const STATUSES = [
  "submitted",          // requester just created it
  "under_office_check", // coordinator is reviewing
  "needs_correction",   // sent back to requester to fix
  "with_specialist",    // forwarded for expert review
  "decision_made",      // outcome decided, awaiting requester acknowledgement
  "closed",             // requester confirmed, request complete
];

// A sub-schema for each entry in the activity history.
const historyEntrySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    by: { type: String, required: true },
    note: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Each uploaded document — we store its Cloudinary URL and metadata, not the file itself.
const documentSchema = new mongoose.Schema(
  {
    label: { type: String },
    url: { type: String, required: true },
    publicId: { type: String },
    originalName: { type: String },
    fileType: { type: String },
    version: { type: Number, default: 1 },
    uploadedBy: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const requestSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    campus: { type: String, enum: ["main", "north", "city"], required: true },
    department: { type: String, trim: true },
    amount: { type: Number, default: 0 },
    otherPeople: [{ type: String, trim: true }],
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "submitted",
    },
    specialist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    recommendation: { type: String },
    decision: { type: String },
    acknowledged: { type: Boolean, default: false },

    // Full activity history — an array of the sub-schema above.
    history: [historyEntrySchema],

    // All uploaded documents, including every version from correction rounds.
    documents: [documentSchema],
  },
  {
    timestamps: true,
  }
);

const Request = mongoose.model("Request", requestSchema);

export default Request;