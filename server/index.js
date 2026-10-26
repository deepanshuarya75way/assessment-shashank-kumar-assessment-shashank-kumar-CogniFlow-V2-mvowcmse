import express, { json } from "express";
import dotenv from "dotenv";
import connectDb from "./utils/db.js";
import { createServer } from "http";
import cors from "cors";
import { Server } from "socket.io";
import { handleSocket } from "./socket/socketHandler.js";
import chatRouter from "./routes/chatRouter.js";
import authRouter from "./routes/authRouter.js";
import messageRouter from "./routes/messageRouter.js";
import userRouter from "./routes/userRouter.js";
import uploadRouter from "./routes/uploadRouter.js";
import ragRouter from "./routes/ragRouter.js";
import { resetStalledIngestions } from "./services/rag/ingestQueue.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "https://cogniflow-client.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".onrender.com") || origin.includes("localhost")) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 200,
};

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

global.io = io;

handleSocket(io);

import { initCogniBot } from "./utils/initCogniBot.js";
import { initDemoUsers } from "./utils/initDemoUsers.js";

app.use(cors(corsOptions));
app.use(express.json());
connectDb().then(async () => {
  await initCogniBot();
  await initDemoUsers();
  resetStalledIngestions();
});

app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/messages", messageRouter);
app.use("/api/user", userRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/rag", ragRouter);
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("Welcome to CogniFlow API!");
});

httpServer.listen(PORT, () => {
  console.log(`Server is Running on http://localhost:${PORT}`);
});
