const {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
} = require("../controllers/userController");
const upload = require("../middleware/multer");
const verifyJWT = require("../middleware/auth");

const userRouter = require("express").Router();

userRouter.post(
  "/register",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

userRouter.post("/login", loginUser);

//secured routes
userRouter.post("/logout", verifyJWT, logoutUser);

userRouter.post("/refresh-token", refreshAccessToken);

module.exports = { userRouter };
