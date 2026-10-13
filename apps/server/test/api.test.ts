import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/index";

describe("Auth and Team API - Integration Tests", () => {
  const uniqueNum = Math.floor(Math.random() * 89999 + 10000);
  const testUser = {
    username: `user_${uniqueNum}`,
    email: `test_${uniqueNum}@rajaranionline.com`,
    password: "Password123!",
    confirmPassword: "Password123!",
  };

  let sessionToken: string;

  it("POST /api/auth/register should create new user with unique playerCode", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);
    if (res.status !== 201) {
      console.log("Register failed with status", res.status, res.body);
    }

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.playerCode).toMatch(/^RR[A-Z0-9]{5}$/);
    expect(res.body.token).toBeDefined();
    sessionToken = res.body.token;
  });

  it("POST /api/auth/register should reject duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.error).toContain("already registered");
  });

  it("POST /api/auth/login should authenticate user with valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it("GET /api/players/me should return player profile with playerCode", async () => {
    const res = await request(app)
      .get("/api/players/me")
      .set("Authorization", `Bearer ${sessionToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.player.username).toBe(testUser.username);
  });

  it("POST /api/teams should create team and assign user as OWNER", async () => {
    const res = await request(app)
      .post("/api/teams")
      .set("Authorization", `Bearer ${sessionToken}`)
      .send({
        name: `Team Chola ${uniqueNum}`,
        description: "Royal paper chit team",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.team.inviteCode).toMatch(/^TM[A-Z0-9]{4}$/);
  });
});
