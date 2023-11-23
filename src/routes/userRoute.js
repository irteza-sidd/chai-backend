const { registerUser } = require("../controllers/userController");

const userRouter = require("express").Router();

userRouter.post("/register", registerUser);

module.exports = { userRouter };
