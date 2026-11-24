// controllers/visaFormController.js
const VisaForm = require("../models/visaForm");
const cloudinary = require("cloudinary").v2;

const uploadPhotoToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "canadaonlinevisa/applicant_photos",
        transformation: [
          { width: 400, height: 500, crop: "fill", gravity: "face" },
          { quality: "auto" },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// 1. Create / Upsert Visa Form (Admin only)
exports.createVisaForm = async (req, res) => {
  try {
    const body = req.body;

    let photoUrl = body.photo || "";
    if (req.file) {
      try {
        photoUrl = await uploadPhotoToCloudinary(req.file.buffer);
      } catch (uploadErr) {
        console.error("Photo upload error, falling back to base64:", uploadErr);
        // Fallback to base64 data URI so photo is never lost
        photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      }
    }

    const applicationRefNo = (body.applicationRefNo || "").trim().toUpperCase();
    const formNo = (body.formNo || "").trim().toUpperCase();
    const passportNumber = (body.passportNumber || "").trim().toUpperCase();

    if (!applicationRefNo || !formNo || !passportNumber) {
      return res.status(400).json({
        message: "Application Ref No, Form No, and Passport Number are required.",
      });
    }

    let documents = {
      jobLetter: [],
      lmias: [],
      workPermit: [],
      visa: [],
      visaFormDoc: [],
      airTicket: [],
      cv: [],
    };
    if (body.documents) {
      try {
        documents = typeof body.documents === "string" ? JSON.parse(body.documents) : body.documents;
      } catch (e) {
        console.error("Documents parse error:", e);
      }
    }

    // Check if application with this Ref No already exists -> update it (upsert)
    let saved;
    const existing = await VisaForm.findOne({ applicationRefNo });
    if (existing) {
      existing.formNo = formNo;
      existing.passportNumber = passportNumber;
      if (photoUrl) existing.photo = photoUrl;
      existing.surname = (body.surname || "").trim().toUpperCase();
      existing.givenNames = (body.givenNames || "").trim().toUpperCase();
      existing.sex = (body.sex || "MALE").trim().toUpperCase();
      existing.maritalStatus = (body.maritalStatus || "Married").trim();
      existing.dob = (body.dob || "").trim();
      existing.citizenship = (body.citizenship || "Bangladesh").trim();
      existing.passportIssue = (body.passportIssue || "").trim();
      existing.passportExpiry = (body.passportExpiry || "").trim();
      existing.passportCountry = (body.passportCountry || "Bangladesh").trim();
      existing.phone = (body.phone || "").trim();
      existing.email = (body.email || "").trim();
      existing.address = (body.address || "").trim();
      existing.country = (body.country || "Canada").trim();
      existing.position = (body.position || "Driving").trim();
      existing.sponsor = (body.sponsor || "Coca-Cola Canada Bottling Limited (Coke Canada)").trim();
      existing.wage = (body.wage || "5500 CAD").trim();
      existing.status = (body.status || "PENDING SUBMISSION").trim().toUpperCase();
      existing.documents = documents;

      saved = await existing.save();
    } else {
      const newForm = new VisaForm({
        applicationRefNo,
        formNo,
        passportNumber,
        photo: photoUrl,
        surname: (body.surname || "").trim().toUpperCase(),
        givenNames: (body.givenNames || "").trim().toUpperCase(),
        sex: (body.sex || "MALE").trim().toUpperCase(),
        maritalStatus: (body.maritalStatus || "Married").trim(),
        dob: (body.dob || "").trim(),
        citizenship: (body.citizenship || "Bangladesh").trim(),
        passportIssue: (body.passportIssue || "").trim(),
        passportExpiry: (body.passportExpiry || "").trim(),
        passportCountry: (body.passportCountry || "Bangladesh").trim(),
        phone: (body.phone || "").trim(),
        email: (body.email || "").trim(),
        address: (body.address || "").trim(),
        country: (body.country || "Canada").trim(),
        position: (body.position || "Driving").trim(),
        sponsor: (body.sponsor || "Coca-Cola Canada Bottling Limited (Coke Canada)").trim(),
        wage: (body.wage || "5500 CAD").trim(),
        status: (body.status || "PENDING SUBMISSION").trim().toUpperCase(),
        documents,
      });

      saved = await newForm.save();
    }

    res.status(201).json({
      message: "Visa Application Form saved successfully!",
      form: saved,
    });
  } catch (error) {
    console.error("Error creating visa form:", error);
    res.status(500).json({
      message: error.message || "Failed to create visa application form.",
    });
  }
};

// 2. Get All Visa Forms (Admin only, with pagination & search)
exports.getAllVisaForms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = (req.query.search || "").trim();

    const query = {};
    if (search) {
      query.$or = [
        { applicationRefNo: { $regex: search, $options: "i" } },
        { formNo: { $regex: search, $options: "i" } },
        { passportNumber: { $regex: search, $options: "i" } },
        { surname: { $regex: search, $options: "i" } },
        { givenNames: { $regex: search, $options: "i" } },
      ];
    }

    const forms = await VisaForm.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalForms = await VisaForm.countDocuments(query);

    res.status(200).json({
      message: "Visa forms retrieved successfully",
      forms,
      page,
      totalPages: Math.ceil(totalForms / limit),
      totalForms,
    });
  } catch (error) {
    console.error("Error getting visa forms:", error);
    res.status(500).json({ message: "Failed to retrieve visa forms." });
  }
};

// 3. Get Single Visa Form by ID (Admin only)
exports.getVisaFormById = async (req, res) => {
  try {
    const form = await VisaForm.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: "Visa form not found" });
    }
    res.status(200).json({ form });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch visa form" });
  }
};

// 4. Update Visa Form (Admin only)
exports.updateVisaForm = async (req, res) => {
  try {
    const body = req.body;
    let photoUrl = body.photo;

    if (req.file) {
      try {
        photoUrl = await uploadPhotoToCloudinary(req.file.buffer);
      } catch (uploadErr) {
        photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      }
    }

    const updateData = {
      ...body,
      ...(photoUrl ? { photo: photoUrl } : {}),
      applicationRefNo: (body.applicationRefNo || "").trim().toUpperCase(),
      formNo: (body.formNo || "").trim().toUpperCase(),
      passportNumber: (body.passportNumber || "").trim().toUpperCase(),
      surname: (body.surname || "").trim().toUpperCase(),
      givenNames: (body.givenNames || "").trim().toUpperCase(),
      status: (body.status || "PENDING SUBMISSION").trim().toUpperCase(),
    };

    if (body.documents) {
      try {
        updateData.documents =
          typeof body.documents === "string"
            ? JSON.parse(body.documents)
            : body.documents;
      } catch (e) {
        console.error("Documents parse error:", e);
      }
    }

    const updated = await VisaForm.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Visa form not found" });
    }

    res.status(200).json({
      message: "Visa form updated successfully",
      form: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update form" });
  }
};

// 5. Delete Visa Form (Admin only)
exports.deleteVisaForm = async (req, res) => {
  try {
    const deleted = await VisaForm.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Visa form not found" });
    }
    res.status(200).json({ message: "Visa form deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete form" });
  }
};

// 6. Track Visa Form (Public 3-factor search)
exports.trackVisaForm = async (req, res) => {
  try {
    const appRefNo = (
      req.body.appRefNo ||
      req.body.applicationRefNo ||
      req.query.appRefNo ||
      ""
    ).trim();
    const formNo = (req.body.formNo || req.query.formNo || "").trim();
    const passportNo = (
      req.body.passportNo ||
      req.body.passportNumber ||
      req.query.passportNo ||
      ""
    ).trim();

    if (!appRefNo || !formNo || !passportNo) {
      return res.status(400).json({
        success: false,
        message:
          "All 3 verification factors are required: Application Ref No, Form No, and Passport Number.",
      });
    }

    // Match case-insensitively and ONLY return if approved by Admin
    const form = await VisaForm.findOne({
      applicationRefNo: { $regex: new RegExp(`^${escapeRegex(appRefNo)}$`, "i") },
      formNo: { $regex: new RegExp(`^${escapeRegex(formNo)}$`, "i") },
      passportNumber: { $regex: new RegExp(`^${escapeRegex(passportNo)}$`, "i") },
      isApproved: true,
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message:
          "No verified visa application was found matching your App Ref No, Form No, and Passport Number. Please check and re-enter carefully.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Application record verified successfully",
      form,
    });
  } catch (error) {
    console.error("Track visa form error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to verify application at this time. Please try again.",
    });
  }
};

// 7. Auto-Generate Unique Numbers Helper
const generateUniqueNumbers = async () => {
  const currentYear = new Date().getFullYear();
  let refNo = "";
  let formNo = "";
  let exists = true;

  while (exists) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    refNo = `CAN-${currentYear}-${randomDigits}`;
    formNo = `IMM-5707-${randomDigits}`;

    const duplicate = await VisaForm.findOne({
      $or: [{ applicationRefNo: refNo }, { formNo }],
    });
    if (!duplicate) {
      exists = false;
    }
  }

  return { refNo, formNo };
};

// 8. Public User Submission from /apply
exports.submitUserApplication = async (req, res) => {
  try {
    const body = req.body;

    const surname = (body.surname || body.familyName || "").trim().toUpperCase();
    const givenNames = (body.givenNames || body.givenName || "").trim().toUpperCase();
    const passportNumber = (body.passportNumber || body.passport || "").trim().toUpperCase();

    if (!surname || !givenNames || !passportNumber) {
      return res.status(400).json({
        success: false,
        message: "Surname, Given Names, and Passport Number are required.",
      });
    }

    // Auto generate Application Ref No & Form No
    const { refNo, formNo } = await generateUniqueNumbers();

    let photoUrl = body.photo || body.photoUrl || "";
    if (photoUrl && typeof photoUrl === "string" && photoUrl.startsWith("data:image")) {
      try {
        const uploadRes = await cloudinary.uploader.upload(photoUrl, {
          folder: "canadaonlinevisa/applicant_photos",
          resource_type: "auto",
        });
        photoUrl = uploadRes.secure_url;
      } catch (cErr) {
        console.error("Cloudinary photo upload error, keeping base64:", cErr.message);
      }
    }

    let cvUrl = body.cv || body.cvUrl || "";
    if (cvUrl && typeof cvUrl === "string" && cvUrl.startsWith("data:")) {
      try {
        const uploadRes = await cloudinary.uploader.upload(cvUrl, {
          folder: "canadaonlinevisa/applicant_cvs",
          resource_type: "auto",
        });
        cvUrl = uploadRes.secure_url;
      } catch (cErr) {
        console.error("Cloudinary CV upload error, keeping base64:", cErr.message);
      }
    }

    let documents = {
      jobLetter: [],
      lmias: [],
      workPermit: [],
      visa: [],
      visaFormDoc: [],
      airTicket: [],
      cv: cvUrl ? [cvUrl] : [],
    };

    let screenshotUrl = (body.screenshot || body.paymentScreenshot || "").trim();
    if (screenshotUrl && screenshotUrl.startsWith("data:image")) {
      try {
        const uploadRes = await cloudinary.uploader.upload(screenshotUrl, {
          folder: "canadaonlinevisa/payment_screenshots",
          resource_type: "auto",
        });
        screenshotUrl = uploadRes.secure_url;
      } catch (cErr) {
        console.error("Cloudinary screenshot upload error, keeping base64:", cErr.message);
      }
    }

    const paymentInfo = {
      methodName: (body.paymentMethod || body.methodName || "").trim(),
      accountNumber: (body.accountNumber || "").trim(),
      transactionId: (body.transactionId || body.trxId || "").trim(),
      senderNumber: (body.senderNumber || "").trim(),
      screenshot: screenshotUrl,
      paidAmount: (body.paidAmount || body.fee || "").trim(),
      notes: (body.notes || "").trim(),
      submittedAt: new Date(),
    };

    const newForm = new VisaForm({
      applicationRefNo: refNo,
      formNo: formNo,
      passportNumber: passportNumber,
      photo: photoUrl,
      surname,
      givenNames,
      sex: (body.sex || body.gender || "MALE").trim().toUpperCase(),
      maritalStatus: (body.maritalStatus || body.marital || "Single").trim(),
      dob: (body.dob || "").trim(),
      citizenship: (body.citizenship || "Bangladesh").trim(),
      passportIssue: (body.passportIssue || body.issueDate || "").trim(),
      passportExpiry: (body.passportExpiry || body.expiryDate || "").trim(),
      passportCountry: (body.passportCountry || "Bangladesh").trim(),
      phone: (body.phone || "").trim(),
      email: (body.email || "").trim(),
      address: (body.address || "").trim(),
      country: (body.country || "Canada").trim(),
      position: (body.position || "Driving").trim(),
      sponsor: (body.sponsor || "Coca-Cola Canada Bottling Limited (Coke Canada)").trim(),
      wage: (body.wage || "5500 CAD").trim(),
      status: "PENDING APPROVAL",
      isApproved: false,
      submittedBy: "user",
      paymentInfo,
      documents,
    });

    const saved = await newForm.save();

    res.status(201).json({
      success: true,
      message: "Application submitted successfully and is pending approval.",
      data: {
        _id: saved._id,
        applicationRefNo: saved.applicationRefNo,
        formNo: saved.formNo,
        passportNumber: saved.passportNumber,
        surname: saved.surname,
        givenNames: saved.givenNames,
        status: saved.status,
        isApproved: saved.isApproved,
        createdAt: saved.createdAt,
      },
    });
  } catch (error) {
    console.error("Submit user application error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit application. Please try again.",
    });
  }
};

// 9. Admin Approve Application
exports.approveVisaForm = async (req, res) => {
  try {
    const { id } = req.params;
    const form = await VisaForm.findByIdAndUpdate(
      id,
      {
        $set: {
          isApproved: true,
          status: req.body?.status || "PENDING SUBMISSION",
        },
      },
      { new: true }
    );

    if (!form) {
      return res.status(404).json({ success: false, message: "Visa form not found" });
    }

    res.status(200).json({
      success: true,
      message: "Application approved successfully! It is now live for tracking.",
      form,
    });
  } catch (error) {
    console.error("Approve visa form error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to approve visa form" });
  }
};

// 10. Admin Reject Application
exports.rejectVisaForm = async (req, res) => {
  try {
    const { id } = req.params;
    const form = await VisaForm.findByIdAndUpdate(
      id,
      {
        $set: {
          isApproved: false,
          status: "REJECTED",
        },
      },
      { new: true }
    );

    if (!form) {
      return res.status(404).json({ success: false, message: "Visa form not found" });
    }

    res.status(200).json({
      success: true,
      message: "Application rejected.",
      form,
    });
  } catch (error) {
    console.error("Reject visa form error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to reject visa form" });
  }
};

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
