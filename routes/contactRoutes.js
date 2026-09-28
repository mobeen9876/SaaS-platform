import express from "express";
import { sendContactEmail } from "../utils/emailService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    company,
    phone,
    subject,
    message,
    agreeToTerms,
  } = req.body;

  if (!firstName || !lastName || !email || !subject || !message) {
    return res
      .status(400)
      .json({ success: false, error: "Please fill in all required fields." });
  }

  if (!agreeToTerms) {
    return res
      .status(400)
      .json({ success: false, error: "You must agree to the terms." });
  }

  const result = await sendContactEmail({
    firstName,
    lastName,
    email,
    company,
    phone,
    subject,
    message,
  });

  if (result.success) {
    res.json({ success: true, message: "Message sent successfully!" });
  } else {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to send message. Please try again.",
      });
  }
});

export default router;
