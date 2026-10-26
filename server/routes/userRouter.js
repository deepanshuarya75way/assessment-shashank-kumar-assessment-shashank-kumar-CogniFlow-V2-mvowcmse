import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import searchUsers from "../controllers/User/searchUsers.js";
import getProfile from "../controllers/User/getProfile.js";
import updateProfile from "../controllers/User/updateProfile.js";

const router = express.Router();

router.get("/", authMiddleware, searchUsers);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

export default router;