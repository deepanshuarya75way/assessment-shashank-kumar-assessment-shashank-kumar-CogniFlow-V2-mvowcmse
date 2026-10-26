import express from "express";
import fetchMessage from "../controllers/Message/fetchMessage.js";
import sendMessage from "../controllers/Message/sendMessage.js";
import authMiddleware from "../middlewares/authMiddleware.js";

import editMessage from "../controllers/Message/editMessage.js";
import deleteMessage from "../controllers/Message/deleteMessage.js";
import clearChat from "../controllers/Message/clearChat.js";

const router = express.Router();

router.post("/", authMiddleware, sendMessage);
router.get("/:roomId", authMiddleware, fetchMessage);
router.put("/:messageId", authMiddleware, editMessage);
router.delete("/:messageId", authMiddleware, deleteMessage);
router.delete("/room/:roomId", authMiddleware, clearChat);

export default router;
