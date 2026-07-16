import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";

const adminSchema = new Schema({
    mobileNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^[0-9]{10}$/, "Please use a valid mobile number"]
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    avatar: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ["admin", "staff"],   // "staff" reserved for Phase 4 (multi-user roles)
        default: "admin"
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String,
        select: false
    }
}, {
    timestamps: true
});

// Hash password before saving
adminSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Check password
adminSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Generate JWT access token
adminSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            mobileNumber: this.mobileNumber,
            username: this.username,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

// Generate JWT refresh token
// adminSchema.methods.generateRefreshToken = function () {
//     return jwt.sign(
//         {
//             _id: this._id,
//             role: this.role
//         },
//         process.env.REFRESH_TOKEN_SECRET,
//         { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
//     );
// };

// Generate JWT refresh token
adminSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            role: this.role
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

// Refresh tokens are JWTs (already unforgeable without the secret), but if
// the DB is ever exposed the stored value alone would let someone mint new
// access tokens indefinitely until expiry. Store only a hash — a stolen DB
// dump is then useless without also compromising the raw token in flight.
adminSchema.statics.hashToken = function (token) {
    return crypto.createHash("sha256").update(token).digest("hex");
};
export const Admin = mongoose.model("Admin", adminSchema);