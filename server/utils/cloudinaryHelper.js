import { cloudinary } from "../config/cloudinary.js";
import fs from "fs";

/**
 * Uploads a local file to Cloudinary.
 * Automatically deletes the local file after upload if deleteAfter is true.
 * @param {string} filePath - Path to local file
 * @param {object} options - { resourceType: "auto" | "image" | "raw", folder: "cogniflow", deleteAfter: true }
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export const uploadToCloudinary = async (filePath, options = {}) => {
  const {
    resourceType = "auto",
    folder = "cogniflow",
    deleteAfter = true,
  } = options;

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: resourceType,
    });

    if (deleteAfter && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn("Could not delete local file after upload:", err.message);
      }
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    if (deleteAfter && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
    }
    throw error;
  }
};

/**
 * Deletes an asset from Cloudinary.
 * @param {string} publicId
 * @param {string} resourceType - "image" | "raw"
 */
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.warn(`Failed to delete Cloudinary asset ${publicId}:`, error.message);
  }
};
