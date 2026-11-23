// routes/visaFormRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const adminAuth = require("../middleware/adminAuth");
const {
  createVisaForm,
  getAllVisaForms,
  getVisaFormById,
  updateVisaForm,
  deleteVisaForm,
  trackVisaForm,
  submitUserApplication,
  approveVisaForm,
  rejectVisaForm,
} = require("../controllers/visaFormController");

// Memory storage for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// 1. Public Endpoints
router.post("/track", trackVisaForm);
router.post("/apply", submitUserApplication);

// 2. Admin Protected CRUD Endpoints
router.post("/", adminAuth, upload.single("photo"), createVisaForm);
router.get("/", adminAuth, getAllVisaForms);
router.get("/:id", adminAuth, getVisaFormById);
router.put("/:id", adminAuth, upload.single("photo"), updateVisaForm);
router.patch("/:id/approve", adminAuth, approveVisaForm);
router.patch("/:id/reject", adminAuth, rejectVisaForm);
router.delete("/:id", adminAuth, deleteVisaForm);

module.exports = router;
