import { Router, Response } from "express";
import { UpdateProfileSchema, ChangePasswordSchema } from "@raja-rani/shared";
import bcrypt from "bcryptjs";
import { prisma } from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// GET /api/players/me
router.get("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        playerCode: true,
        avatar: true,
        createdAt: true,
        playerStat: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "Player not found" });
    }

    return res.json({ success: true, player: user });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch player profile" });
  }
});

// PATCH /api/players/me
router.patch("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = UpdateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: "Invalid profile data", details: parseResult.error.errors });
    }

    const { username, avatar } = parseResult.data;

    if (username && username !== req.user!.username) {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        return res.status(409).json({ success: false, error: "Username already taken" });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(username ? { username } : {}),
        ...(avatar ? { avatar } : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        playerCode: true,
        avatar: true,
      },
    });

    return res.json({ success: true, message: "Profile updated", player: updatedUser });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to update profile" });
  }
});

// POST /api/players/change-password
router.post("/change-password", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = ChangePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: "Invalid password format" });
    }

    const { oldPassword, newPassword } = parseResult.data;

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to change password" });
  }
});

// GET /api/players/:playerCode
router.get("/:playerCode", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { playerCode } = req.params;
    const player = await prisma.user.findUnique({
      where: { playerCode: playerCode.toUpperCase() },
      select: {
        id: true,
        username: true,
        playerCode: true,
        avatar: true,
        createdAt: true,
        playerStat: {
          select: {
            gamesPlayed: true,
            wins: true,
            losses: true,
            totalPoints: true,
            rating: true,
          },
        },
      },
    });

    if (!player) {
      return res.status(404).json({ success: false, error: "Player code not found" });
    }

    return res.json({ success: true, player });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to query player" });
  }
});

export default router;
