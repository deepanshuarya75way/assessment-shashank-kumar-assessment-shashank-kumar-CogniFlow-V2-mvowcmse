import Message from "../models/Message.js";

const onlineUsers = {};

export const handleSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Client Connected ", socket.id);

    socket.on("setup", (userData) => {
      socket.join(userData);
      onlineUsers[socket.id] = userData;
      io.emit("get online users", Array.from(new Set(Object.values(onlineUsers))));
      socket.emit("connected");
    });

    socket.on("join chat", (room) => {
      socket.join(room);
      console.log("User joined the room ", room);
    });

    const getEntityId = (entity) => {
      if (!entity) return "";
      if (typeof entity === "string") return entity;
      if (entity._id) return entity._id.toString();
      if (entity.id) return entity.id.toString();
      if (typeof entity.toString === "function") return entity.toString();
      return String(entity);
    };

    socket.on("new message", (newMessage) => {
      try {
        let chat = newMessage.room;
        if (!chat) return;

        if (!chat.members || !Array.isArray(chat.members)) {
          return socket.in(getEntityId(chat)).emit("message received", newMessage);
        }

        const senderId = getEntityId(newMessage.sender);
        chat.members.forEach((member) => {
          const memberId = getEntityId(member);
          if (!memberId || memberId === senderId) return;
          socket.in(memberId).emit("message received", newMessage);
        });
      } catch (err) {
        console.error("[Socket] Error handling new message:", err);
      }
    });

    socket.on("message edited", (editedMessage) => {
      try {
        let chat = editedMessage.room;
        if (!chat) return;

        if (!chat.members || !Array.isArray(chat.members)) {
          return socket.in(getEntityId(chat)).emit("message edited", editedMessage);
        }

        const senderId = getEntityId(editedMessage.sender);
        chat.members.forEach((member) => {
          const memberId = getEntityId(member);
          if (!memberId || memberId === senderId) return;
          socket.in(memberId).emit("message edited", editedMessage);
        });
      } catch (err) {
        console.error("[Socket] Error handling message edited:", err);
      }
    });

    socket.on("message deleted", (deletedMessage) => {
      try {
        let chat = deletedMessage.room;
        if (!chat) return;

        if (!chat.members || !Array.isArray(chat.members)) {
          return socket.in(getEntityId(chat)).emit("message deleted", deletedMessage);
        }

        const senderId = getEntityId(deletedMessage.sender);
        chat.members.forEach((member) => {
          const memberId = getEntityId(member);
          if (!memberId || memberId === senderId) return;
          socket.in(memberId).emit("message deleted", deletedMessage);
        });
      } catch (err) {
        console.error("[Socket] Error handling message deleted:", err);
      }
    });

    socket.on("chat cleared", (data) => {
      // Chat clear is local, so we don't strictly need to broadcast it to others,
      // but if the user has multiple sessions, they might want to clear it across devices.
      // We will emit "chat cleared" back to their own room so other devices sync.
      socket.in(data.userId).emit("chat cleared", data.roomId);
    });

    socket.on("mark delivered", async ({ messageIds, userId, roomId }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds }, deliveredTo: { $ne: userId } },
          { $addToSet: { deliveredTo: userId } }
        );
        socket.in(roomId).emit("messages delivered", { messageIds, userId, roomId });
      } catch (err) {
        console.error("Error marking messages delivered:", err);
      }
    });

    socket.on("mark read", async ({ messageIds, userId, roomId }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds }, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );
        socket.in(roomId).emit("messages read", { messageIds, userId, roomId });
      } catch (err) {
        console.error("Error marking messages read:", err);
      }
    });

    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

    socket.on("disconnect", () => {
      console.log("Client Disconnected", socket.id);
      delete onlineUsers[socket.id];
      io.emit("get online users", Array.from(new Set(Object.values(onlineUsers))));
    });
  });
};
