import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Raja Rani Online initial players & data...");

  const testPassword = await bcrypt.hash("password123", 10);

  const players = [
    { username: "RajaVikram", email: "raja@rajaranionline.com", playerCode: "RRVIK01" },
    { username: "RaniDevi", email: "rani@rajaranionline.com", playerCode: "RRRAN02" },
    { username: "ManthiriBirbal", email: "manthiri@rajaranionline.com", playerCode: "RRBIR03" },
    { username: "InspectorVijay", email: "police@rajaranionline.com", playerCode: "RRPOL04" },
    { username: "ThirudanRobin", email: "thief@rajaranionline.com", playerCode: "RRTHF05" },
    { username: "SenapathiKarna", email: "senapathi@rajaranionline.com", playerCode: "RRSEN06" },
    { username: "PrajaiCitizen", email: "citizen@rajaranionline.com", playerCode: "RRPRA07" },
  ];

  for (const p of players) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        username: p.username,
        email: p.email,
        passwordHash: testPassword,
        playerCode: p.playerCode,
        avatar: "avatar_1",
        playerStat: {
          create: {
            gamesPlayed: Math.floor(Math.random() * 20) + 5,
            wins: Math.floor(Math.random() * 10) + 2,
            losses: Math.floor(Math.random() * 8) + 1,
            totalPoints: Math.floor(Math.random() * 8000) + 2000,
            rating: Math.floor(Math.random() * 300) + 1200,
          },
        },
      },
    });

    console.log(`Created seed player: ${user.username} (${user.playerCode})`);
  }

  // Create demo Team
  const owner = await prisma.user.findFirst();
  if (owner) {
    const demoTeam = await prisma.team.upsert({
      where: { inviteCode: "TMROYAL" },
      update: {},
      create: {
        name: "Chola Dynasty Royals",
        description: "Elite Raja Rani players guild celebrating heritage paper chit matches.",
        inviteCode: "TMROYAL",
        visibility: "PUBLIC",
        ownerId: owner.id,
        memberships: {
          create: {
            userId: owner.id,
            role: "OWNER",
          },
        },
      },
    });
    console.log(`Created demo team: ${demoTeam.name} (${demoTeam.inviteCode})`);
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
