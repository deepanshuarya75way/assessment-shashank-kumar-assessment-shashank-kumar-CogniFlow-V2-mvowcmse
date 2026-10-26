import mongoose from "mongoose";

const connectDb = async (req, res) => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log("MongoDB Connected Successful!");
  } catch (error) {
    console.log("MongoDB Connection Failed: ", error);
  }
};

export default connectDb;
