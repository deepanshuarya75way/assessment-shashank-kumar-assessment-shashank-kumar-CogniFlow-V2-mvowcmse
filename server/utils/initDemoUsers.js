import User from "../models/User.js";
import Room from "../models/Room.js";
import bcrypt from "bcrypt";

export const DEMO_USERS = [
  {
    username: "Demo1",
    email: "demo1@cogniflow.com",
    password: "DemoUser@123",
    bio: "Demo Account 1 for testing CogniFlow features",
  },
  {
    username: "Demo2",
    email: "demo2@cogniflow.com",
    password: "DemoUser@123",
    bio: "Demo Account 2 for testing CogniFlow features",
  },
];

export const initDemoUsers = async () => {
  try {
    const userDocs = [];

    for (const demo of DEMO_USERS) {
      let user = await User.findOne({
        $or: [{ email: demo.email }, { username: demo.username }],
      });

      const hashedPassword = await bcrypt.hash(demo.password, 10);

      if (!user) {
        user = await User.create({
          username: demo.username,
          email: demo.email,
          password: hashedPassword,
          isVerified: true,
          bio: demo.bio,
        });
        console.log(`👤 Created Demo User: ${demo.username} (${demo.email})`);
      } else {
        // Ensure credentials and verification status are active
        user.password = hashedPassword;
        user.isVerified = true;
        if (!user.email) user.email = demo.email;
        if (!user.username) user.username = demo.username;
        await user.save();
        console.log(`👤 Verified Demo User: ${demo.username}`);
      }
      userDocs.push(user);
    }

    // Ensure Demo1 and Demo2 have a connected 1-on-1 chat room for instant testing
    if (userDocs.length === 2 && userDocs[0] && userDocs[1]) {
      const u1Id = userDocs[0]._id;
      const u2Id = userDocs[1]._id;

      let sharedRoom = await Room.findOne({
        isGroupChat: false,
        $and: [
          { members: { $elemMatch: { $eq: u1Id } } },
          { members: { $elemMatch: { $eq: u2Id } } },
        ],
      });

      if (!sharedRoom) {
        sharedRoom = await Room.create({
          name: "sender",
          isGroupChat: false,
          members: [u1Id, u2Id],
        });
        console.log("💬 Created default test chat room between Demo1 and Demo2!");
      }
    }
  } catch (error) {
    console.error("Error initializing Demo Users:", error.message);
  }
};
