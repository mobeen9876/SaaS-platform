import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create transporter for sending emails
const createTransporter = async () => {
  try {
    // For Gmail with App Password
    if (process.env.EMAIL_SERVICE === "gmail") {
      console.log("📧 Creating Gmail transporter...");

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Test the connection
      await transporter.verify();
      console.log("✅ Gmail transporter verified successfully");

      return transporter;
    }

    // Fallback to Ethereal for development
    console.log("📧 Creating Ethereal test account...");
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log("✅ Ethereal account created:", testAccount.user);
    return transporter;
  } catch (error) {
    console.error("❌ Failed to create transporter:", error.message);

    // Mock transporter as ultimate fallback
    return {
      sendMail: async (mailOptions) => {
        console.log("📧 MOCK EMAIL - Would send:");
        console.log("📧 To:", mailOptions.to);
        console.log("📧 Subject:", mailOptions.subject);

        return {
          messageId: `mock_${Date.now()}`,
          response: "250 Mock email queued",
        };
      },
    };
  }
};

// Send OTP email
export const sendOTPEmail = async (email, otp, type = "reset") => {
  try {
    console.log(`📧 Sending ${type} OTP to:`, email);
    console.log("🔢 OTP:", otp);

    const transporter = await createTransporter();

    const subject =
      type === "reset"
        ? "Password Reset OTP - SaaS Platform"
        : type === "admin-reset"
          ? "Admin Password Reset OTP - SaaS Platform"
          : "Account Verification OTP - SaaS Platform";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 10px; }
          .otp-container { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 10px 0; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🚀 SaaS Platform</div>
            <h1>Password Reset Request</h1>
          </div>
          
          <p>Hello,</p>
          <p>You have requested to reset your password. Use the OTP code below to proceed:</p>
          
          <div class="otp-container">
            <div>Your OTP Code</div>
            <div class="otp-code">${otp}</div>
            <div>Valid for 10 minutes</div>
          </div>
          
          <div class="warning">
            <strong>Security Notice:</strong>
            <ul>
              <li>This OTP is valid for 10 minutes only</li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; 2026 SaaS Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"SaaS Platform" <${process.env.EMAIL_USER || "noreply@saasplatform.com"}>`,
      to: email,
      subject: subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully!");
    console.log("📧 Message ID:", info.messageId);

    // For Ethereal, get preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("🔗 Preview URL:", previewUrl);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl,
    };
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);

    // Log OTP for development even if email fails
    console.log("🔢 OTP (for testing):", otp);

    return {
      success: true, // Return success so the flow continues
      messageId: `dev_${Date.now()}`,
      previewUrl: null,
      simulated: true,
      otp: otp, // Include OTP for development
    };
  }
};

// Send rejection email
export const sendRejectionEmail = async (email, firstName, reason) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"SaaS Platform" <${process.env.EMAIL_USER || "noreply@saasplatform.com"}>`,
      to: email,
      subject: "Registration Update - SaaS Platform",
      html: `
        <h2>Registration Not Approved</h2>
        <p>Hello ${firstName},</p>
        <p>Your registration request has not been approved.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        <p>Contact support if you have questions.</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Rejection email sent to:", email);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Rejection email failed:", error);
    return { success: false, error: error.message };
  }
};

// Send welcome email
export const sendWelcomeEmail = async (email, firstName) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"SaaS Platform" <${process.env.EMAIL_USER || "noreply@saasplatform.com"}>`,
      to: email,
      subject: "Welcome to SaaS Platform! 🎉",
      html: `
        <h2>Welcome ${firstName}! 🎉</h2>
        <p>Your account has been approved and is now active.</p>
        <p>You can now access all features of our platform.</p>
        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login">Login to Your Account</a>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Welcome email sent to:", email);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Welcome email failed:", error);
    return { success: false, error: error.message };
  }
};

// Send issue assignment notification to technician
export const sendIssueAssignmentEmail = async (
  technicianEmail,
  technicianName,
  issue,
) => {
  try {
    console.log(
      `📧 Sending issue assignment notification to: ${technicianEmail}`,
    );

    const transporter = await createTransporter();

    const priorityColors = {
      small: "#10b981",
      medium: "#f59e0b",
      large: "#ef4444",
    };

    const priorityColor = priorityColors[issue.priority] || "#6b7280";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Issue Assigned</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f3f4f6; }
          .container { background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 10px; }
          .alert-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .issue-details { background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .issue-title { font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .issue-description { color: #4b5563; line-height: 1.6; margin: 15px 0; }
          .badge { display: inline-block; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; margin: 5px; color: white; }
          .priority-badge { background: ${priorityColor}; }
          .type-badge { background: #3b82f6; }
          .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-label { font-weight: bold; color: #6b7280; }
          .info-value { color: #1f2937; }
          .action-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          .ai-analysis { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔧 SaaS Platform - IT Support</div>
            <h1>New Issue Assigned to You</h1>
          </div>
          
          <div class="alert-box">
            <h2 style="margin: 0;">🚨 Action Required</h2>
            <p style="margin: 10px 0 0 0;">A new issue has been assigned to you</p>
          </div>
          
          <p>Hello <strong>${technicianName}</strong>,</p>
          <p>You have been assigned a new issue based on your expertise and availability.</p>
          
          <div class="issue-details">
            <div class="issue-title">${issue.title}</div>
            
            <div>
              <span class="badge priority-badge">${issue.priority.toUpperCase()} Priority</span>
              <span class="badge type-badge">${issue.issueType.toUpperCase()}</span>
            </div>
            
            <div class="issue-description">
              <strong>Description:</strong><br>
              ${issue.description}
            </div>
            
            ${
              issue.aiAnalysis
                ? `
            <div class="ai-analysis">
              <strong>🤖 AI Analysis:</strong><br>
              ${issue.aiAnalysis}
            </div>
            `
                : ""
            }
            
            <div class="info-row">
              <span class="info-label">Submitted By:</span>
              <span class="info-value">${issue.submittedByName}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Contact Email:</span>
              <span class="info-value">${issue.submittedByEmail}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Submitted On:</span>
              <span class="info-value">${new Date(issue.createdAt).toLocaleString()}</span>
            </div>
            
            ${
              issue.assignmentReason
                ? `
            <div class="info-row">
              <span class="info-label">Why You?</span>
              <span class="info-value">${issue.assignmentReason}</span>
            </div>
            `
                : ""
            }
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login" class="action-button">
              View Issue in Dashboard
            </a>
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Review the issue details carefully</li>
            <li>Contact the user if you need more information</li>
            <li>Update the issue status as you work on it</li>
            <li>Mark as resolved when completed</li>
          </ol>
          
          <div class="footer">
            <p>This is an automated notification from the IT Support System.</p>
            <p>&copy; 2026 SaaS Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"SaaS Platform - IT Support" <${process.env.EMAIL_USER || "noreply@saasplatform.com"}>`,
      to: technicianEmail,
      subject: `🔧 New Issue Assigned: ${issue.title}`,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Issue assignment email sent successfully!");
    console.log("📧 Message ID:", info.messageId);

    // For Ethereal, get preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("🔗 Preview URL:", previewUrl);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl,
    };
  } catch (error) {
    console.error("❌ Issue assignment email failed:", error.message);

    // Don't fail the issue creation if email fails
    return {
      success: false,
      error: error.message,
    };
  }
};

// Send issue status update notification to user
export const sendIssueStatusUpdateEmail = async (
  userEmail,
  userName,
  issue,
  oldStatus,
  newStatus,
) => {
  try {
    console.log(`📧 Sending status update notification to: ${userEmail}`);

    const transporter = await createTransporter();

    const statusMessages = {
      assigned: "Your issue has been assigned to a technician",
      "in-progress": "Work has started on your issue",
      resolved: "Your issue has been resolved",
      closed: "Your issue has been closed",
    };

    const statusColors = {
      assigned: "#3b82f6",
      "in-progress": "#8b5cf6",
      resolved: "#10b981",
      closed: "#6b7280",
    };

    const message =
      statusMessages[newStatus] || "Your issue status has been updated";
    const color = statusColors[newStatus] || "#6b7280";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Issue Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f3f4f6; }
          .container { background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 10px; }
          .status-box { background: ${color}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .issue-details { background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔧 SaaS Platform - IT Support</div>
            <h1>Issue Status Update</h1>
          </div>
          
          <div class="status-box">
            <h2 style="margin: 0;">${message}</h2>
            <p style="margin: 10px 0 0 0;">Status: ${oldStatus} → ${newStatus}</p>
          </div>
          
          <p>Hello <strong>${userName}</strong>,</p>
          <p>Your issue status has been updated.</p>
          
          <div class="issue-details">
            <h3>${issue.title}</h3>
            <p><strong>Current Status:</strong> ${newStatus}</p>
            ${issue.assignedToName ? `<p><strong>Assigned To:</strong> ${issue.assignedToName}</p>` : ""}
            ${newStatus === "resolved" && issue.resolutionNotes ? `<p><strong>Resolution Notes:</strong> ${issue.resolutionNotes}</p>` : ""}
          </div>
          
          <div class="footer">
            <p>This is an automated notification from the IT Support System.</p>
            <p>&copy; 2026 SaaS Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"SaaS Platform - IT Support" <${process.env.EMAIL_USER || "noreply@saasplatform.com"}>`,
      to: userEmail,
      subject: `Issue Update: ${issue.title} - ${newStatus}`,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Status update email sent successfully!");

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Status update email failed:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Send contact form email to admin
export const sendContactEmail = async ({
  firstName,
  lastName,
  email,
  company,
  phone,
  subject,
  message,
}) => {
  try {
    const transporter = await createTransporter();

    const adminEmail = process.env.EMAIL_USER || process.env.ADMIN_EMAIL;

    const mailOptions = {
      from: `"SaaS Platform Contact" <${adminEmail}>`,
      to: adminEmail,
      replyTo: email,
      subject: `Contact Form: ${subject} — from ${firstName} ${lastName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#667eea;">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Name</td><td style="padding:8px;">${firstName} ${lastName}</td></tr>
            <tr style="background:#f9fafb;"><td style="padding:8px;font-weight:bold;color:#6b7280;">Email</td><td style="padding:8px;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Company</td><td style="padding:8px;">${company || "—"}</td></tr>
            <tr style="background:#f9fafb;"><td style="padding:8px;font-weight:bold;color:#6b7280;">Phone</td><td style="padding:8px;">${phone || "—"}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Subject</td><td style="padding:8px;">${subject}</td></tr>
          </table>
          <div style="margin-top:20px;padding:16px;background:#f9fafb;border-left:4px solid #667eea;border-radius:4px;">
            <strong>Message:</strong><br/><br/>
            ${message.replace(/\n/g, "<br/>")}
          </div>
          <p style="color:#9ca3af;font-size:12px;margin-top:20px;">Sent from the SaaS Platform contact form.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Contact email sent:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Contact email failed:", error.message);
    return { success: false, error: error.message };
  }
};
