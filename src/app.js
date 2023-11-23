const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

//express app creation
const app = express();

//middlewares Start
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import and use
const { userRouter } = require("./routes/userRoute");

app.use("/api/v1/users", userRouter);

module.exports = { app };
