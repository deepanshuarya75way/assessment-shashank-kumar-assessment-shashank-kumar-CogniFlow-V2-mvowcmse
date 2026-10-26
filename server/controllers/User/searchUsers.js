import User from "../../models/User.js";

const searchUsers = async (req, res) => {
  try {
    const keyword = req.query.search
      ? { username: { $regex: req.query.search, $options: "i" } }
      : {};

    const users = await User.find({
      ...keyword,
      _id: { $ne: req.user._id },
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Server error while searching users." });
  }
};

export default searchUsers;
