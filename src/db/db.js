const mongoose = require("mongoose");
const { DB_NAME } = require("../constants");

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );
    console.log(
      `\nMongoDb connected !!: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection failed", error);
    process.exit(1);
  }
};
module.exports = { connectDB };
