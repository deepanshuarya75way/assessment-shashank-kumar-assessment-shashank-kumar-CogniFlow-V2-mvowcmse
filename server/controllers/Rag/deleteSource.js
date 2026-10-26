import KnowledgeSource from "../../models/KnowledgeSource.js";
import Room from "../../models/Room.js";
import vectorStore from "../../services/rag/vectorStore.js";
import { deleteFromCloudinary } from "../../utils/cloudinaryHelper.js";

export const deleteSource = async (req, res) => {
  try {
    const { id } = req.params;

    const source = await KnowledgeSource.findById(id);
    if (!source) {
      return res.status(404).json({ message: "Knowledge source not found" });
    }

    const room = await Room.findById(source.room);
    if (!room) {
      return res.status(404).json({ message: "Associated room not found" });
    }

    // Permission check: uploader or group admin
    const isUploader = source.owner.toString() === req.user._id.toString();
    const isAdmin = room.isGroupChat && room.admin?.toString() === req.user._id.toString();
    const isDMMember = !room.isGroupChat && room.members.some((m) => m.toString() === req.user._id.toString());

    if (!isUploader && !isAdmin && !isDMMember) {
      return res.status(403).json({ message: "Only the uploader or room admin can delete this source" });
    }

    // 1. Delete chunks first
    await vectorStore.deleteBySource(source._id);

    // 2. Delete from Cloudinary if asset exists
    if (source.filePublicId) {
      const resourceType = source.type === "pdf" ? "raw" : "image";
      try {
        await deleteFromCloudinary(source.filePublicId, resourceType);
      } catch (cloudErr) {
        console.warn("[deleteSource] Cloudinary asset deletion warning:", cloudErr.message);
      }
    }

    // 3. Delete KnowledgeSource document
    await KnowledgeSource.findByIdAndDelete(id);

    // 4. Emit socket removal event
    if (global.io) {
      global.io.to(String(room._id)).emit("knowledge:removed", {
        sourceId: source._id,
        roomId: room._id,
      });
    }

    return res.status(200).json({
      message: "Knowledge source and associated chunks deleted successfully",
      sourceId: id,
    });
  } catch (error) {
    console.error("[deleteSource Error]", error);
    return res.status(500).json({ message: "Failed to delete knowledge source" });
  }
};

export default deleteSource;
