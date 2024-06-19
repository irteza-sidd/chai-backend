const jwt = require("jsonwebtoken");
const ApiResponse = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const userModel = require("../models/userModel");
const { ApiError } = require("../utils/apiError");

const verifyJWT = asyncHandler(async (req, res, next) => {
  let token = req.header("Authorization");
  token = token.split("Bearer ")[1];
  if (!token) {
    const reponse = new ApiResponse(409, null, "Unauthorized");
    return res.status(response.statusCode).json(reponse);
  }

  const data = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const user = await userModel
    .findById(data._id)
    .select("-password -refreshToken");
  if (!user) {
    throw new ApiError(401, "Invalid access Token");
  }
  req.user = user._id;
  next();
});

module.exports = verifyJWT;
