const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/chikitsa";

    if (!uri) {
      throw new Error("Mongo connection string is missing. Set MONGO_URI in .env or ensure MongoDB is running locally.");
    }

    await mongoose.connect(uri);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.warn("⚠️  MongoDB Connection Error:", error.message);
    console.warn("The server will continue to run, but database features will be limited.");
  }
};

module.exports = connectDB;
