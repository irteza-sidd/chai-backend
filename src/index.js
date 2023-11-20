const { app } = require("./app");
const { connectDB } = require("./db/db");

require("dotenv").config("./env");

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("Mongodb connection failed", error);
  });
