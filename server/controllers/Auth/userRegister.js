import User from "../../models/User.js";
import OTP from "../../models/OTP.js";
import sendMail from "../../utils/sendMail.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await OTP.deleteMany({ email });
    const otpCode = crypto.randomInt(100000, 999999).toString();
    await OTP.create({
      otp: otpCode,
      email,
      username,
      password: hashedPassword,
    });

    // Dispatch email asynchronously so Render responds immediately to the frontend
    sendMail(otpCode, email).catch((err) => {
      console.error("[Register] Background sendMail failed for", email, err.message);
    });

    return res.status(200).json({
      message: "OTP sent to email!",
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default registerUser;
