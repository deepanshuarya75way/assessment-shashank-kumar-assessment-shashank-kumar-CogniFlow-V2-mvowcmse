import Message from "../../models/Message.js";
import Room from "../../models/Room.js";
import { cloudinary } from "../../config/cloudinary.js";

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const { type } = req.query; // 'everyone' or 'me'

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const room = await Room.findById(message.room);
    const isAdmin = room && room.isGroupChat && room.admin && room.admin.toString() === req.user._id.toString();

    if (type === "everyone") {
      if (message.sender.toString() !== req.user._id.toString() && !isAdmin) {
        return res.status(403).json({ message: "You can only delete your own messages for everyone unless you are the admin." });
      }
      
      if (message.filePublicId) {
        try {
          // We upload all files (even PDFs) as "image" resource_type to bypass Cloudinary security restrictions.
          await cloudinary.uploader.destroy(message.filePublicId, { resource_type: "image" });
        } catch (err) {
          console.error("Cloudinary delete error:", err);
        }
        message.filePublicId = "";
      }

      message.isDeleted = true;
      message.content = "🚫 This message was deleted"; // Overwrite for privacy but satisfy Mongoose validation
      message.fileUrl = ""; // Strip any files

    } else {
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
      }
    }

    await message.save();

    const populatedMessage = await message.populate([
      { path: "sender", select: "username profilePic" },
      {
        path: "room",
        select: "name isGroupChat members",
        populate: {
          path: "members",
          select: "username profilePic email",
        },
      },
    ]);

    res.status(200).json(populatedMessage);
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Server error while deleting message." });
  }
};

export default deleteMessage;
