import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from "@raja-rani/shared";
import { prisma } from "../db";
import { generatePlayerCode, generateSessionToken } from "../utils/crypto";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import crypto from "crypto";

const router = Router();
const SESSION_EXPIRY_DAYS = 7;

// Register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.errors[0]?.message || "Invalid input",
        details: parseResult.error.errors,
      });
    }

    const { username, email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: { equals: username } },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return res.status(409).json({ success: false, error: "Email is already registered" });
      }
      return res.status(409).json({ success: false, error: "Username is already taken" });
    }

    // Generate unique player code
    let playerCode = generatePlayerCode();
    let collisionCheck = await prisma.user.findUnique({ where: { playerCode } });
    while (collisionCheck) {
      playerCode = generatePlayerCode();
      collisionCheck = await prisma.user.findUnique({ where: { playerCode } });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email: normalizedEmail,
        passwordHash,
        playerCode,
        avatar: "avatar_1",
        playerStat: {
          create: {
            rating: 1200,
          },
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        playerCode: true,
        avatar: true,
      },
    });

    // Create session
    const token = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    res.cookie("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user,
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ success: false, error: "Failed to register user" });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: "Invalid email or password" });
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    const token = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    res.cookie("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        playerCode: user.playerCode,
        avatar: user.avatar,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, error: "Failed to log in" });
  }
});

// Logout
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.session_token || req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }
    res.clearCookie("session_token");
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to logout" });
  }
});

// Me
router.get("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await prisma.playerStat.findUnique({
      where: { userId: req.user!.id },
    });
    return res.json({
      success: true,
      user: req.user,
      stats: stats || { gamesPlayed: 0, wins: 0, losses: 0, totalPoints: 0, rating: 1200 },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});

// Forgot password
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const parseResult = ForgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: "Valid email is required" });
    }

    const { email } = parseResult.data;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Don't leak user existence
      return res.json({
        success: true,
        message: "If that email exists, reset instructions have been generated.",
      });
    }

    const resetToken = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // In development mode, provide token directly for testing convenience!
    return res.json({
      success: true,
      message: "Password reset initiated.",
      devToken: process.env.NODE_ENV !== "production" ? resetToken : undefined,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to process reset" });
  }
});

// Reset password
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const parseResult = ResetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: "Invalid token or password" });
    }

    const { token, newPassword } = parseResult.data;

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: "Invalid or expired reset token" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all existing sessions
      prisma.session.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);

    return res.json({ success: true, message: "Password updated successfully. Please log in." });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to reset password" });
  }
});

export default router;
