import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import authMiddleware from "../middlewares/authMiddleware.js";
import uploadSource from "../controllers/Rag/uploadSource.js";
import uploadTextSource from "../controllers/Rag/uploadTextSource.js";
import listSources from "../controllers/Rag/listSources.js";
import toggleSource from "../controllers/Rag/toggleSource.js";
import deleteSource from "../controllers/Rag/deleteSource.js";
import updateRagSettings from "../controllers/Rag/updateRagSettings.js";
import answerGeneral from "../controllers/Rag/answerGeneral.js";
import learnFromMessage from "../controllers/Rag/learnFromMessage.js";
import generateQuizController from "../controllers/Rag/generateQuiz.js";

const router = express.Router();

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = file.originalname.split(".")[0].replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `rag_${baseName}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

router.use(authMiddleware);

// Knowledge Source Management
router.post("/sources", upload.single("file"), uploadSource);
router.post("/sources/text", uploadTextSource);
router.get("/rooms/:roomId/sources", listSources);
router.patch("/sources/:id", toggleSource);
router.delete("/sources/:id", deleteSource);

// Room Settings
router.patch("/rooms/:roomId/settings", updateRagSettings);

// Message Actions (General Answer & Learn)
router.post("/messages/:messageId/answer-general", answerGeneral);
router.post("/messages/:messageId/learn", learnFromMessage);

// Interactive Document Quiz
router.post("/rooms/:roomId/quiz", generateQuizController);

export default router;
