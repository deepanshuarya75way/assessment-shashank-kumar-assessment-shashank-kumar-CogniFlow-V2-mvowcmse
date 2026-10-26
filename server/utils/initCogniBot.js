import User from "../models/User.js";
import bcrypt from "bcrypt";

export const initCogniBot = async () => {
  try {
    const aiEmail = "cognibot@cogniflow.ai";
    let botUser = await User.findOne({ email: aiEmail });

    if (!botUser) {
      const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
      botUser = await User.create({
        username: "CogniBot",
        email: aiEmail,
        password: hashedPassword,
        isVerified: true,
        bio: "I am your AI assistant in CogniFlow. Ask me anything!",
        profilePic: "/images/ai-button-logo.png"
      });
      console.log("🤖 CogniBot initialized successfully!");
    } else {
      if (botUser.profilePic !== "/images/ai-button-logo.png") {
        botUser.profilePic = "/images/ai-button-logo.png";
        await botUser.save();
        console.log("🤖 CogniBot profile picture updated!");
      } else {
        console.log("🤖 CogniBot is ready!");
      }
    }

    // Attach the bot ID globally for easy access in routes
    global.cogniBotId = botUser._id.toString();
    return botUser;
  } catch (error) {
    console.error("Failed to initialize CogniBot:", error);
  }
};
