const { ApiError } = require("../utils/apiError");
const ApiResponse = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { uploadOnCloudinary } = require("../utils/cloudinary");

const generateAccessAndRefreshToken = async (user) => {
  try {
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.refreshTokenAccessToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Internal server error");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const ckhuser = await userModel.findOne({ email: email });
  if (ckhuser) {
    throw new ApiError(409, "User Already exists");
  }
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await userModel.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await userModel
    .findById(user._id)
    .select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }
  const user = await userModel.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "user does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshToken(user);

  const loggedInUser = await userModel
    .findById(user._id)
    .select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await userModel.findByIdAndUpdate(
    req.user,
    {
      $set: {
        // TODO: undefined is not working in this null is working
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  const data = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await userModel.findById(data._id);
  if (!user) {
    throw new ApiError(401, "invalid refresh token");
  }
  if (incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "refresh token is expired or invalid");
  }
  const options = {
    httpOnly: true,
    secure: true,
  };
  const { accessToken, refreshToken } =
    await generateAccessAndRefreshToken(user);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access token refreshed"
      )
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await userModel.findById(req.user);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, "incorrect old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await userModel
    .findById(req.user)
    .select("-password refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fetched successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  const user = await userModel
    .findByIdAndUpdate(
      req.user,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      { new: true }
    )
    .select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverLocalPath = req.file.path;
  if (!coverLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  const user = await userModel
    .findByIdAndUpdate(
      req.user,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      { new: true }
    )
    .select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"));
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
};
