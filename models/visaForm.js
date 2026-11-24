// models/visaForm.js
const mongoose = require("mongoose");

const visaFormSchema = new mongoose.Schema(
  {
    applicationRefNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    formNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    passportNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    photo: {
      type: String,
      default: "",
    },
    // A. Personal Particulars
    surname: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    givenNames: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    sex: {
      type: String,
      default: "MALE",
      trim: true,
      uppercase: true,
    },
    maritalStatus: {
      type: String,
      default: "Married",
      trim: true,
    },
    dob: {
      type: String,
      default: "",
    },
    citizenship: {
      type: String,
      default: "Bangladesh",
      trim: true,
    },
    // B. Passport Details
    passportIssue: {
      type: String,
      default: "",
    },
    passportExpiry: {
      type: String,
      default: "",
    },
    passportCountry: {
      type: String,
      default: "Bangladesh",
      trim: true,
    },
    // C. Contact
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    // D. Employment
    country: {
      type: String,
      default: "Canada",
      trim: true,
    },
    position: {
      type: String,
      default: "Driving",
      trim: true,
    },
    sponsor: {
      type: String,
      default: "Coca-Cola Canada Bottling Limited (Coke Canada)",
      trim: true,
    },
    wage: {
      type: String,
      default: "5500 CAD",
      trim: true,
    },
    status: {
      type: String,
      default: "PENDING SUBMISSION",
      trim: true,
      uppercase: true,
    },
    isApproved: {
      type: Boolean,
      default: true,
      index: true,
    },
    submittedBy: {
      type: String,
      default: "admin",
      enum: ["admin", "user"],
    },
    paymentInfo: {
      methodName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      transactionId: { type: String, default: "" },
      senderNumber: { type: String, default: "" },
      screenshot: { type: String, default: "" },
      paidAmount: { type: String, default: "" },
      notes: { type: String, default: "" },
      submittedAt: { type: Date, default: Date.now },
    },
    // Attached Documents (Job Letter, LMIA, Work Permit, Visa, Visa Form, Air Ticket, CV)
    documents: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        jobLetter: [],
        lmias: [],
        workPermit: [],
        visa: [],
        visaFormDoc: [],
        airTicket: [],
        cv: [],
      }),
    },
  },
  { timestamps: true }
);

// Compound index for quick 3-factor tracking lookup
visaFormSchema.index({ applicationRefNo: 1, formNo: 1, passportNumber: 1 });

module.exports = mongoose.model("VisaForm", visaFormSchema);
