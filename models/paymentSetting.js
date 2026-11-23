// models/paymentSetting.js
const mongoose = require("mongoose");

const paymentSettingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    accountType: {
      type: String,
      default: "Personal",
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    fee: {
      type: String,
      default: "",
      trim: true,
    },
    instructions: {
      type: String,
      default: "",
      trim: true,
    },
    logo: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentSetting", paymentSettingSchema);
