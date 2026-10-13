import { Router, Response } from "express";
import { CreateTeamSchema, JoinTeamByCodeSchema } from "@raja-rani/shared";
import { prisma } from "../db";
import { generateTeamInviteCode } from "../utils/crypto";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// POST /api/teams (Create Team)
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = CreateTeamSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: "Invalid team data", details: parseResult.error.errors });
    }

    const { name, description } = parseResult.data;

    let inviteCode = generateTeamInviteCode();
    let collision = await prisma.team.findUnique({ where: { inviteCode } });
    while (collision) {
      inviteCode = generateTeamInviteCode();
      collision = await prisma.team.findUnique({ where: { inviteCode } });
    }

    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name,
          description: description || null,
          inviteCode,
          ownerId: req.user!.id,
          visibility: "PUBLIC",
        },
      });

      await tx.teamMembership.create({
        data: {
          teamId: newTeam.id,
          userId: req.user!.id,
          role: "OWNER",
        },
      });

      return newTeam;
    });

    return res.status(201).json({ success: true, message: "Team created successfully", team });
  } catch (error) {
    console.error("Create team error:", error);
    return res.status(500).json({ success: false, error: "Failed to create team" });
  }
});

// GET /api/teams (Browse Teams & User's Teams)
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userTeams = await prisma.teamMembership.findMany({
      where: { userId: req.user!.id },
      include: {
        team: {
          include: {
            owner: { select: { id: true, username: true } },
            _count: { select: { memberships: true } },
          },
        },
      },
    });

    const publicTeams = await prisma.team.findMany({
      where: { visibility: "PUBLIC" },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, username: true } },
        _count: { select: { memberships: true } },
      },
    });

    return res.json({
      success: true,
      myTeams: userTeams.map((m) => ({
        ...m.team,
        myRole: m.role,
        memberCount: m.team._count.memberships,
      })),
      publicTeams: publicTeams.map((t) => ({
        ...t,
        memberCount: t._count.memberships,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch teams" });
  }
});

// POST /api/teams/join-by-code
router.post("/join-by-code", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = JoinTeamByCodeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: "Invalid invitation code" });
    }

    const { inviteCode } = parseResult.data;

    const team = await prisma.team.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
    });

    if (!team) {
      return res.status(404).json({ success: false, error: "Team with this code was not found" });
    }

    const existingMembership = await prisma.teamMembership.findUnique({
      where: {
        teamId_userId: {
          teamId: team.id,
          userId: req.user!.id,
        },
      },
    });

    if (existingMembership) {
      return res.status(409).json({ success: false, error: "You are already a member of this team" });
    }

    await prisma.teamMembership.create({
      data: {
        teamId: team.id,
        userId: req.user!.id,
        role: "MEMBER",
      },
    });

    return res.json({ success: true, message: `Successfully joined ${team.name}`, teamId: team.id });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to join team" });
  }
});

// GET /api/teams/:id
router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true, playerCode: true } },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                playerCode: true,
                avatar: true,
                playerStat: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }

    return res.json({ success: true, team });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch team details" });
  }
});

// POST /api/teams/:id/leave
router.post("/:id/leave", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const team = await prisma.team.findUnique({ where: { id } });

    if (!team) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }

    if (team.ownerId === req.user!.id) {
      return res.status(400).json({
        success: false,
        error: "Owner cannot leave team. Transfer ownership or delete team instead.",
      });
    }

    await prisma.teamMembership.delete({
      where: {
        teamId_userId: {
          teamId: id,
          userId: req.user!.id,
        },
      },
    });

    return res.json({ success: true, message: "Left team successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to leave team" });
  }
});

// DELETE /api/teams/:id/members/:userId (Remove member by owner)
router.delete("/:id/members/:userId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, userId } = req.params;
    const team = await prisma.team.findUnique({ where: { id } });

    if (!team) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }

    if (team.ownerId !== req.user!.id) {
      return res.status(403).json({ success: false, error: "Only team owner can remove members" });
    }

    if (userId === team.ownerId) {
      return res.status(400).json({ success: false, error: "Cannot remove team owner" });
    }

    await prisma.teamMembership.delete({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
    });

    return res.json({ success: true, message: "Member removed" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to remove member" });
  }
});

// DELETE /api/teams/:id (Delete team by owner)
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const team = await prisma.team.findUnique({ where: { id } });

    if (!team) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }

    if (team.ownerId !== req.user!.id) {
      return res.status(403).json({ success: false, error: "Only team owner can delete team" });
    }

    await prisma.team.delete({ where: { id } });

    return res.json({ success: true, message: "Team deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to delete team" });
  }
});

export default router;
