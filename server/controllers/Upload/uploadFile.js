import { cloudinary } from "../../config/cloudinary.js";
import fs from "fs";

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const isImage = req.file.mimetype.startsWith("image/");
    const serverUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

    if (isImage) {
      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "cogniflow",
        resource_type: "image",
      });

      // Delete the local temp file after upload
      fs.unlinkSync(req.file.path);

      return res.status(200).json({
        fileUrl: result.secure_url,
        resourceType: "image",
        originalName: req.file.originalname,
        publicId: result.public_id,
      });
    } else {
      // Keep PDF/Document locally
      return res.status(200).json({
        fileUrl: `${serverUrl}/uploads/${req.file.filename}`,
        resourceType: "file",
        originalName: req.file.originalname,
        publicId: req.file.filename,
      });
    }
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "File upload failed" });
  }
};

export default uploadFile;
