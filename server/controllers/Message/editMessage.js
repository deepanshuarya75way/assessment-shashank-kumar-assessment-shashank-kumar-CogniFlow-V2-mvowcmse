import Message from "../../models/Message.js";

const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content cannot be empty" });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own messages" });
    }

    message.content = content;
    message.isEdited = true;
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
    console.error("Error editing message:", error);
    res.status(500).json({ message: "Server error while editing message." });
  }
};

export default editMessage;
