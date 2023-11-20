const { connectDB } = require("./db/db");

require("dotenv").config("./env");

connectDB();
