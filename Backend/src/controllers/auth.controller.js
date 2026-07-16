// controllers/auth.controller.js
import jwt from "jsonwebtoken";
import { Admin } from "../models/admin.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
};

// const generateAccessAndRefreshTokens = async (adminId) => {
//     const admin = await Admin.findById(adminId);

//     if (!admin) {
//         throw new ApiError(404, "Admin not found");
//     }

//     const accessToken = admin.generateAccessToken();
//     const refreshToken = admin.generateRefreshToken();

//     admin.refreshToken = refreshToken;
//     await admin.save({ validateBeforeSave: false });

//     return { accessToken, refreshToken };
// };

// ---- REGISTER ADMIN ----
// Not public. Only an existing admin can create another admin/staff account.
// Route must be protected with verifyJWT + verifyAdmin middleware.

const generateAccessAndRefreshTokens = async (adminId) => {
    const admin = await Admin.findById(adminId);

    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    // Store only the hash — the raw token is returned to the client and
    // never persisted, so a leaked DB dump alone can't be used to log in.
    admin.refreshToken = Admin.hashToken(refreshToken);
    await admin.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};


const registerAdmin = asyncHandler(async (req, res) => {
    const { mobileNumber, username, password } = req.body;

    if (!mobileNumber || !username || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const existingAdmin = await Admin.findOne({ mobileNumber });
    if (existingAdmin) {
        throw new ApiError(409, "An account with this mobile number already exists");
    }

    const admin = await Admin.create({
        mobileNumber,
        username,
        password,
        role: "admin"
    });

    const createdAdmin = await Admin.findById(admin._id).select("-password -refreshToken");

    if (!createdAdmin) {
        throw new ApiError(500, "Something went wrong while creating the admin account");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdAdmin, "Admin account created successfully"));
});

// ---- LOGIN ----
const login = asyncHandler(async (req, res) => {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password) {
        throw new ApiError(400, "Mobile number and password are required");
    }

    // const admin = await Admin.findOne({ mobileNumber }).select("+password");

    // if (!admin) {
    //     throw new ApiError(404, "Admin does not exist");
    // }

    // if (admin.isBlocked) {
    //     throw new ApiError(403, "This account has been blocked");
    // }

    // const isPasswordValid = await admin.isPasswordCorrect(password);

    // if (!isPasswordValid) {
    //     throw new ApiError(401, "Invalid credentials");
    // }

    const admin = await Admin.findOne({ mobileNumber }).select("+password");

    // Same generic message/status whether the number doesn't exist or the
    // password is wrong — prevents enumerating valid admin phone numbers.
    if (!admin) {
        throw new ApiError(401, "Invalid credentials");
    }

    if (admin.isBlocked) {
        throw new ApiError(403, "This account has been blocked");
    }

    const isPasswordValid = await admin.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(admin._id);

    const loggedInAdmin = await Admin.findById(admin._id).select("-password -refreshToken");

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { admin: loggedInAdmin, accessToken, refreshToken },
                "Logged in successfully"
            )
        );
});

// ---- LOGOUT ----
const logout = asyncHandler(async (req, res) => {
    await Admin.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: 1 } },
        { new: true }
    );

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// ---- REFRESH ACCESS TOKEN ----
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    // // refreshToken has select: false on the schema — must explicitly request it
    // const admin = await Admin.findById(decodedToken._id).select("+refreshToken");

    // if (!admin || incomingRefreshToken !== admin.refreshToken) {
    //     throw new ApiError(401, "Invalid or expired refresh token");
    // }

    // refreshToken has select: false on the schema — must explicitly request it
    const admin = await Admin.findById(decodedToken._id).select("+refreshToken");

    if (!admin || Admin.hashToken(incomingRefreshToken) !== admin.refreshToken) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(admin._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed")
        );
});

// ---- GET CURRENT ADMIN ----
// Protected route — relies on verifyJWT having already attached req.user.
const getCurrentAdmin = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current admin fetched successfully"));
});

export { registerAdmin, login, logout, refreshAccessToken, getCurrentAdmin };