import express from "express";
import {
  register,
  login,
  requestPasswordReset,
  resetPasswordWithOTP,
  checkEmailExists,
  checkEmailRole,
  checkNameExists,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPasswordWithOTP);
router.post("/check-email", checkEmailExists);
router.post("/check-email-role", checkEmailRole);
router.post("/check-name", checkNameExists);

export default router;
