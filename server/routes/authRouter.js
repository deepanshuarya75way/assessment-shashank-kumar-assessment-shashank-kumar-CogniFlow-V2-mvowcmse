import express from "express";

import registerUser from "../controllers/Auth/userRegister.js";
import verifyEmail from "../utils/verifyMail.js";
import userLogin from "../controllers/Auth/userLogin.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/login", userLogin);

export default router;
