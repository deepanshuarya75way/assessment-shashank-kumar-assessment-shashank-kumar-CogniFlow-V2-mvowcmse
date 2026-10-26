import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import uploadFile from "../controllers/Upload/uploadFile.js";
import multer from "multer";
import path from "path";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = file.originalname.split(".")[0].replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `${baseName}_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage: storage });

router.post("/", authMiddleware, upload.single("file"), uploadFile);

export default router;
