import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// Configure the Cloudinary SDK with our credentials from .env.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Tell multer to send uploads straight to Cloudinary, into a "requests-office" folder.
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "requests-office",
    resource_type: "auto", // handles both images and PDFs
  },
});

// File filter: only allow PDF, JPG, PNG. Rejects anything else before upload.
function fileFilter(req, file, cb) {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true); // accept
  } else {
    cb(new Error("Only PDF, JPG, and PNG files are allowed")); // reject
  }
}

// The multer middleware: applies storage, the filter, and a 10 MB size limit.
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB in bytes
});

export { cloudinary, upload };