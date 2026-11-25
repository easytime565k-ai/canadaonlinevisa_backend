// utils/emailService.js
const nodemailer = require("nodemailer");

/**
 * Creates fallback Nodemailer transporter with IPv4 and timeouts
 */
const createTransporter = () => {
  const user = process.env.EMAIL_USER || "canadaonlinevisaembassy@gmail.com";
  const pass = (process.env.EMAIL_PASS || "gyivchvhjlvfbsib").replace(/\s+/g, "");

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    requireTLS: true,
    family: 4, // Force IPv4 to prevent IPv6 hanging on cloud hosts
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Sends email via Google Apps Script Webhook (Port 443 HTTPS - Works 100% on Render Free)
 */
const sendViaGoogleWebhook = async ({ webhookUrl, to, subject, html, fromName }) => {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to,
      subject,
      html,
      fromName: fromName || "Canada Visa Gateway - Immigration Services",
    }),
    redirect: "follow",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.error || `Webhook HTTP ${response.status}`);
  }
  return { success: true, via: "google_webhook" };
};

/**
 * Sends email via Resend API (Port 443 HTTPS)
 */
const sendViaResend = async ({ apiKey, to, subject, html }) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Canada Visa Gateway <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Resend HTTP ${response.status}`);
  }
  return { success: true, messageId: data.id, via: "resend" };
};

/**
 * Sends email via Brevo API (Port 443 HTTPS)
 */
const sendViaBrevo = async ({ apiKey, to, subject, html, candidateName }) => {
  const senderEmail = process.env.EMAIL_USER || "canadaonlinevisaembassy@gmail.com";
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "Canada Visa Gateway - Immigration Services",
        email: senderEmail,
      },
      to: [{ email: to, name: candidateName }],
      subject,
      htmlContent: html,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Brevo HTTP ${response.status}`);
  }
  return { success: true, messageId: data.messageId, via: "brevo" };
};

/**
 * Sends an official Visa Approval & Tracking Credentials notification email to the candidate.
 * @param {Object} form - The visa form document
 */
const sendApprovalEmail = async (form) => {
  if (!form || !form.email) {
    console.log("[Email Service] No recipient email provided in form:", form?.applicationRefNo);
    return { success: false, reason: "No recipient email" };
  }

  const recipientEmail = form.email.trim();
  if (!recipientEmail || !recipientEmail.includes("@")) {
    console.log("[Email Service] Invalid email address format:", recipientEmail);
    return { success: false, reason: "Invalid email" };
  }

  const siteUrl = (process.env.SITE_URL || "https://canadaonlinevisa.colaltd.com").replace(/\/$/, "");
  const trackingUrl = `${siteUrl}/track?ref=${encodeURIComponent(form.applicationRefNo || "")}&form=${encodeURIComponent(form.formNo || "")}&pass=${encodeURIComponent(form.passportNumber || "")}`;
  const candidateName = `${form.surname || ""} ${form.givenNames || ""}`.trim() || "Applicant";
  const subject = `Official Canada Visa Approval & Tracking Credentials [${form.applicationRefNo}]`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visa Application Approved</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e9f2;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #003882; padding: 30px 30px 25px; text-align: center; border-bottom: 4px solid #f59e0b;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; background-color: #ffffff; color: #003882; font-size: 11px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; padding: 5px 14px; border-radius: 20px; margin-bottom: 12px;">
                      IMMIGRATION & CITIZENSHIP CANADA
                    </span>
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                      Visa Application Approved
                    </h1>
                    <p style="color: #cbd5e1; margin: 6px 0 0; font-size: 13px;">
                      Official Verification & Document Issuance Notice
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <p style="font-size: 15px; color: #1e293b; line-height: 1.6; margin: 0 0 16px;">
                Dear <strong>${candidateName}</strong>,
              </p>
              <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px;">
                We are pleased to inform you that your visa application and submitted payment have been verified and <strong>officially approved</strong>. Your application record is now live and active on our immigration verification system.
              </p>

              <!-- Credentials Box -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 11px; font-weight: 800; color: #003882; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                      Your Official Tracking Credentials
                    </div>

                    <table width="100%" border="0" cellpadding="6" cellspacing="0" style="font-size: 13px;">
                      <tr>
                        <td width="40%" style="color: #64748b; font-weight: 600;">1. APPLICATION REF NO:</td>
                        <td width="60%" style="color: #003882; font-weight: 800; font-family: monospace; font-size: 15px;">
                          ${form.applicationRefNo}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600;">2. FORM NO:</td>
                        <td style="color: #1e293b; font-weight: 800; font-family: monospace; font-size: 14px;">
                          ${form.formNo}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600;">3. PASSPORT NUMBER:</td>
                        <td style="color: #1e293b; font-weight: 800; font-family: monospace; font-size: 14px; letter-spacing: 1px;">
                          ${form.passportNumber}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600;">Job / Position:</td>
                        <td style="color: #1e293b; font-weight: 700;">
                          ${form.position || "Driving"}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600;">Salary Offer:</td>
                        <td style="color: #059669; font-weight: 800;">
                          ${form.wage || "5500 CAD"}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600;">Sponsor / Employer:</td>
                        <td style="color: #1e293b; font-weight: 700;">
                          ${form.sponsor || "Coca-Cola Canada Bottling Limited"}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
                <tr>
                  <td align="center">
                    <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #003882; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 14px; font-weight: 800; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 56, 130, 0.25);">
                      View & Print Official A4 Result →
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 10px;">
                    <span style="font-size: 11px; color: #64748b;">
                      Click the button above to view your verified visa document and print your official result.
                    </span>
                  </td>
                </tr>
              </table>

              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; margin-top: 20px;">
                <p style="font-size: 12px; color: #1e40af; margin: 0; line-height: 1.5;">
                  <strong>Important Note:</strong> Please keep this email and your tracking credentials secure. You can check the current status of your visa or print additional copies anytime on our website.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="font-size: 12px; color: #64748b; margin: 0 0 6px;">
                Canada Online Visa Gateway • Official Processing Authority
              </p>
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                This is an automated administrative notification. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  // 1. Check for Google Apps Script Webhook (Port 443 HTTPS - Free & uses canadaonlinevisaembassy@gmail.com)
  if (process.env.GMAIL_WEBHOOK_URL) {
    try {
      console.log("[Email Service] Sending approval email via Google Apps Script Webhook...");
      const res = await sendViaGoogleWebhook({
        webhookUrl: process.env.GMAIL_WEBHOOK_URL,
        to: recipientEmail,
        subject,
        html,
        fromName: "Canada Visa Gateway - Immigration Services",
      });
      console.log("[Email Service] Email sent successfully via Google Apps Script Webhook to:", recipientEmail);
      return res;
    } catch (whErr) {
      console.error("[Email Service] Google Webhook error:", whErr.message);
    }
  }

  // 2. Check for Resend API Key (Port 443 HTTPS)
  if (process.env.RESEND_API_KEY) {
    try {
      console.log("[Email Service] Sending approval email via Resend API...");
      const res = await sendViaResend({
        apiKey: process.env.RESEND_API_KEY,
        to: recipientEmail,
        subject,
        html,
      });
      console.log("[Email Service] Email sent successfully via Resend API to:", recipientEmail);
      return res;
    } catch (resendErr) {
      console.error("[Email Service] Resend API error:", resendErr.message);
    }
  }

  // 3. Check for Brevo API Key (Port 443 HTTPS)
  if (process.env.BREVO_API_KEY) {
    try {
      console.log("[Email Service] Sending approval email via Brevo API...");
      const res = await sendViaBrevo({
        apiKey: process.env.BREVO_API_KEY,
        to: recipientEmail,
        subject,
        html,
        candidateName,
      });
      console.log("[Email Service] Email sent successfully via Brevo API to:", recipientEmail);
      return res;
    } catch (brevoErr) {
      console.error("[Email Service] Brevo API error:", brevoErr.message);
    }
  }

  // 4. Default: Nodemailer SMTP
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Canada Visa Gateway - Immigration Services" <${process.env.EMAIL_USER || "canadaonlinevisaembassy@gmail.com"}>`,
      to: recipientEmail,
      subject,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("[Email Service] Approval email sent successfully! MessageId:", info.messageId, "To:", recipientEmail);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email Service] Failed to send approval email via SMTP:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendApprovalEmail,
};
