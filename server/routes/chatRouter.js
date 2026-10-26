import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import createOrFetchRoom from "../controllers/Chat/createOrFetchRoom.js";
import fetchUserRooms from "../controllers/Chat/fetchUserRooms.js";
import markAsRead from "../controllers/Message/markAsRead.js";
import renameGroup from "../controllers/Chat/renameGroup.js";
import addToGroup from "../controllers/Chat/addToGroup.js";
import removeFromGroup from "../controllers/Chat/removeFromGroup.js";
import deleteGroup from "../controllers/Chat/deleteGroup.js";

const router = express.Router();

router.post("/", authMiddleware, createOrFetchRoom);
router.get("/", authMiddleware, fetchUserRooms);
router.put("/:roomId/read", authMiddleware, markAsRead);
router.put("/rename", authMiddleware, renameGroup);
router.put("/groupadd", authMiddleware, addToGroup);
router.put("/groupremove", authMiddleware, removeFromGroup);
router.delete("/:roomId", authMiddleware, deleteGroup);

export default router;