import OTP from "../models/OTP.js";
import User from "../models/User.js";

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!otp || otp.toString().length < 6) {
      return res.status(400).json({ message: "Please enter a valid OTP" });
    }

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email not found!, Try registering again." });
    }

    const validOtp = await OTP.findOne({ email, otp });

    if (!validOtp) {
      return res.status(400).json({ message: "OTP is not valid!" });
    }

    const user = await User.create({
      username: validOtp.username,
      email,
      password: validOtp.password,
      isVerified: true,
    });

    await OTP.deleteOne({ _id: validOtp._id });

    res.json({
      message: "Email Verified!, User Registration Successful.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

export default verifyEmail;