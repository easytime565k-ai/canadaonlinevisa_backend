// controllers/paymentSettingController.js
const PaymentSetting = require("../models/paymentSetting");

// Seed defaults if table is empty
const seedDefaultsIfNeeded = async () => {
  const count = await PaymentSetting.countDocuments();
  if (count === 0) {
    await PaymentSetting.insertMany([
      {
        name: "bKash",
        accountType: "Personal",
        accountNumber: "01700000000",
        fee: "২৫,০০০ টাকা",
        instructions:
          "১. বিকাশ অ্যাপ অথবা *247# ডায়াল করে 'Send Money' সিলেক্ট করুন।\n২. উপরের পার্সোনাল নম্বরে সঠিক ফি পাঠিয়ে দিন।\n৩. রেফারেন্সে আপনার পাসপোর্টের শেষ ৪ ডিজিট লিখুন।\n৪. পেমেন্ট সফল হলে ট্রানজেকশন আইডি (TrxID) নিচে লিখে সাবমিট করুন।",
        logo: "https://freelogopng.com/images/all_img/1656234745bkash-app-logo.png",
        isActive: true,
        order: 1,
      },
      {
        name: "Nagad",
        accountType: "Personal",
        accountNumber: "01800000000",
        fee: "২৫,০০০ টাকা",
        instructions:
          "১. নগদ অ্যাপ অথবা *167# ডায়াল করে 'Send Money' সিলেক্ট করুন।\n২. উপরের পার্সোনাল নম্বরে নির্ধারিত ফি প্রদান করুন।\n৩. ট্রানজেকশন সফল হলে পাওয়া TrxID ও পেমেন্ট স্ক্রিনশট সংযুক্ত করে সাবমিট করুন।",
        logo: "https://freelogopng.com/images/all_img/1679248787Nagad-Logo.png",
        isActive: true,
        order: 2,
      },
    ]);
  } else {
    // Clean up any existing records with CAD
    await PaymentSetting.updateMany(
      { fee: { $regex: /CAD/i } },
      { $set: { fee: "২৫,০০০ টাকা" } }
    );
  }
};

// 1. Get Active Payment Methods (Public)
exports.getActivePaymentMethods = async (req, res) => {
  try {
    await seedDefaultsIfNeeded();
    const methods = await PaymentSetting.find({ isActive: true }).sort({
      order: 1,
      createdAt: -1,
    });
    res.status(200).json({ success: true, methods });
  } catch (err) {
    console.error("Get active payment methods error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch payment methods" });
  }
};

// 2. Get All Payment Methods (Admin)
exports.getAllPaymentMethods = async (req, res) => {
  try {
    await seedDefaultsIfNeeded();
    const methods = await PaymentSetting.find().sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, methods });
  } catch (err) {
    console.error("Get all payment methods error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch payment methods" });
  }
};

// 3. Create Payment Method (Admin)
exports.createPaymentMethod = async (req, res) => {
  try {
    const { name, accountType, accountNumber, fee, instructions, logo, isActive, order } =
      req.body;

    if (!name || !accountNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Method Name and Account Number are required." });
    }

    const newMethod = new PaymentSetting({
      name: name.trim(),
      accountType: (accountType || "Personal").trim(),
      accountNumber: accountNumber.trim(),
      fee: (fee || "").trim(),
      instructions: (instructions || "").trim(),
      logo: (logo || "").trim(),
      isActive: isActive !== undefined ? isActive : true,
      order: order ? Number(order) : 0,
    });

    const saved = await newMethod.save();
    res.status(201).json({
      success: true,
      message: "Payment method created successfully",
      method: saved,
    });
  } catch (err) {
    console.error("Create payment method error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to create method" });
  }
};

// 4. Update Payment Method (Admin)
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updated = await PaymentSetting.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Payment method not found" });
    }

    res.status(200).json({
      success: true,
      message: "Payment method updated successfully",
      method: updated,
    });
  } catch (err) {
    console.error("Update payment method error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to update method" });
  }
};

// 5. Delete Payment Method (Admin)
exports.deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PaymentSetting.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Payment method not found" });
    }

    res.status(200).json({
      success: true,
      message: "Payment method deleted successfully",
    });
  } catch (err) {
    console.error("Delete payment method error:", err);
    res.status(500).json({ success: false, message: "Failed to delete payment method" });
  }
};
