import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

/* ================= TOKEN GENERATORS ================= */

const generateAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "7d",
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });

/* ================= REGISTER ================= */

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("Request Body:", req.body);

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password required",
      });
    }

    const existing = await User.findOne({ email });

    console.log("Checking if email exists:", email);

    if (existing) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    console.log("Creating user with hashed password:", hashedPassword);

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    console.log("User created successfully:", user);

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });

  } catch (error) {

    console.error("🚨 REGISTER ERROR:", error?.message || error);

    if (error?.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return res.status(400).json({
        message: `Validation Error: ${messages}`,
      });
    }

    if (error?.code === 11000) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    if (error?.name === "MongoServerError") {
      return res.status(500).json({
        message: "Database connection failed",
      });
    }

    return res.status(500).json({
      message:
        process.env.NODE_ENV === "production"
          ? "Server error"
          : error.message,
    });
  }
};

/* ================= LOGIN ================= */

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error?.message || error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* ================= REFRESH TOKEN ================= */

export const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Refresh token required",
      });
    }

    const user = await User.findOne({ refreshToken: token });

    if (!user) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err || !decoded) {
        return res.status(401).json({
          message: "Invalid refresh token",
        });
      }

      const newAccessToken = generateAccessToken(decoded.userId);

      return res.status(200).json({
        accessToken: newAccessToken,
      });
    });

  } catch (error) {
    console.error("REFRESH ERROR:", error?.message || error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* ================= LOGOUT ================= */

export const logout = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Refresh token required",
      });
    }

    const user = await User.findOne({ refreshToken: token });

    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    return res.status(200).json({
      message: "Logged out successfully",
    });

  } catch (error) {
    console.error("LOGOUT ERROR:", error?.message || error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
/* ================= GET CURRENT USER ================= */

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("GET CURRENT USER ERROR:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

/* ================= UPDATE PROFILE ================= */

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { name, email } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Email already in use",
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

/* ================= CHANGE PASSWORD ================= */

eexport const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully",
    });

  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error?.message || error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* ================= REQUEST PASSWORD RESET ================= */

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    console.log("RESET REQUEST:", email);

    if (!email) {
      return res.status(400).json({
        message: "Email required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000;

    await user.save();

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Missing EMAIL_USER or EMAIL_PASS");
      return res.status(500).json({
        message: "Email service not configured",
      });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const resetURL =
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"KairoPath" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset - KairoPath",
      html: `
        <h2>Password Reset</h2>
        <p>You requested password reset.</p>
        <a href="${resetURL}" 
           style="padding:12px 20px;background:#10b981;color:white;text-decoration:none;border-radius:8px;">
           Reset Password
        </a>
        <p>This link valid for 1 hour.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "Reset link sent to your email!",
    });

  } catch (error) {
    console.error("RESET ERROR:", error?.message || error);

    return res.status(500).json({
      message: "Failed to send reset email. Check logs.",
    });
  }
};

/* ================= RESET PASSWORD ================= */

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and password required",
      });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(newPassword, salt);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    return res.status(200).json({
      message: "Password reset successful",
    });

  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error?.message || error);

    return res.status(500).json({
      message: "Error resetting password",
    });
  }
};