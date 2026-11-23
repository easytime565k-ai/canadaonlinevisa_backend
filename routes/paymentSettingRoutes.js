// routes/paymentSettingRoutes.js
const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const {
  getActivePaymentMethods,
  getAllPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} = require("../controllers/paymentSettingController");

// Public Endpoint: Get all active payment options
router.get("/", getActivePaymentMethods);

// Admin Endpoints: Full Management
router.get("/admin", adminAuth, getAllPaymentMethods);
router.post("/admin", adminAuth, createPaymentMethod);
router.put("/admin/:id", adminAuth, updatePaymentMethod);
router.delete("/admin/:id", adminAuth, deletePaymentMethod);

module.exports = router;
