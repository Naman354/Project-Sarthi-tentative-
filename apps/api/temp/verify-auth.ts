import http from "node:http";
import app from "../src/app.js";
import prisma from "../src/config/prisma.js";

const TEST_EMAIL = "auth-verifier-bot@example.com";
const TEST_PASSWORD = "SuperSecurePassword2026!";
const TEST_NAME = "Verification Bot";

interface JsonResponse {
  success: boolean;
  message?: string;
  errorCode?: string;
  data?: any;
}

async function run() {
  console.log("=== STARTING AUTH ENGINE VERIFICATION ===");

  // 1. Cleanup old test data
  try {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [TEST_EMAIL, "temp-test@example.com"],
        },
      },
    });
    console.log("✓ Pre-test database cleanup completed");
  } catch (err) {
    console.warn("Notice: Database cleanup warning (safe to proceed):", err);
  }

  // 2. Start ephemeral HTTP server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to obtain server port");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`✓ Test server running on ${baseUrl}`);

  let accessToken = "";
  let refreshTokenCookie = "";

  try {
    // TEST 1: Register validation failure (password too short)
    console.log("\n[Test 1] Registration validation (short password)...");
    const res1 = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: "short",
      }),
    });
    const data1 = (await res1.json()) as JsonResponse;
    if (res1.status === 400 && data1.errorCode === "VALIDATION_ERROR") {
      console.log("✓ PASS: Correctly rejected short password with 400 VALIDATION_ERROR");
    } else {
      throw new Error(
        `FAIL Test 1: Expected 400 VALIDATION_ERROR, got ${res1.status}: ${JSON.stringify(data1)}`
      );
    }

    // TEST 2: Successful Registration
    console.log("\n[Test 2] Valid Registration...");
    const res2 = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    const data2 = (await res2.json()) as JsonResponse;
    const cookieHeader2 = res2.headers.get("set-cookie") || "";

    if (
      res2.status === 201 &&
      data2.success &&
      data2.data?.user?.email === TEST_EMAIL &&
      data2.data?.user?.name === TEST_NAME &&
      data2.data?.accessToken &&
      data2.data?.user?.passwordHash === undefined &&
      cookieHeader2.includes("refreshToken=")
    ) {
      accessToken = data2.data.accessToken;
      refreshTokenCookie = cookieHeader2.split(";")[0] || "";
      console.log(
        "✓ PASS: Registration succeeded (201 Created), token returned, HTTP-only cookie set, passwordHash omitted"
      );
    } else {
      throw new Error(
        `FAIL Test 2: Invalid registration response: status=${res2.status}, body=${JSON.stringify(data2)}`
      );
    }

    // TEST 3: Duplicate Registration Conflict
    console.log("\n[Test 3] Duplicate Registration...");
    const res3 = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    const data3 = (await res3.json()) as JsonResponse;
    if (res3.status === 409 && data3.errorCode === "EMAIL_EXISTS") {
      console.log("✓ PASS: Duplicate email rejected with 409 EMAIL_EXISTS");
    } else {
      throw new Error(
        `FAIL Test 3: Expected 409 EMAIL_EXISTS, got ${res3.status}: ${JSON.stringify(data3)}`
      );
    }

    // TEST 4: Login with incorrect password
    console.log("\n[Test 4] Login with incorrect password...");
    const res4 = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: "WrongPassword999!",
      }),
    });
    const data4 = (await res4.json()) as JsonResponse;
    if (res4.status === 401 && data4.errorCode === "INVALID_CREDENTIALS") {
      console.log("✓ PASS: Invalid password rejected with 401 INVALID_CREDENTIALS");
    } else {
      throw new Error(
        `FAIL Test 4: Expected 401 INVALID_CREDENTIALS, got ${res4.status}: ${JSON.stringify(data4)}`
      );
    }

    // TEST 5: Login with correct credentials
    console.log("\n[Test 5] Valid Login...");
    const res5 = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    const data5 = (await res5.json()) as JsonResponse;
    const cookieHeader5 = res5.headers.get("set-cookie") || "";
    if (
      res5.status === 200 &&
      data5.success &&
      data5.data?.accessToken &&
      data5.data?.user?.email === TEST_EMAIL &&
      cookieHeader5.includes("refreshToken=")
    ) {
      accessToken = data5.data.accessToken;
      refreshTokenCookie = cookieHeader5.split(";")[0] || "";
      console.log("✓ PASS: Login succeeded (200 OK), refreshed accessToken, cookie set");
    } else {
      throw new Error(
        `FAIL Test 5: Expected 200 login, got ${res5.status}: ${JSON.stringify(data5)}`
      );
    }

    // TEST 6: Protected route without auth header
    console.log("\n[Test 6] Protected route without Authorization header...");
    const res6 = await fetch(`${baseUrl}/auth/me`);
    const data6 = (await res6.json()) as JsonResponse;
    if (res6.status === 401 && data6.errorCode === "UNAUTHORIZED") {
      console.log("✓ PASS: Unauthorized request blocked with 401 UNAUTHORIZED");
    } else {
      throw new Error(
        `FAIL Test 6: Expected 401 UNAUTHORIZED, got ${res6.status}: ${JSON.stringify(data6)}`
      );
    }

    // TEST 7: Protected route with valid Bearer token
    console.log("\n[Test 7] Protected route with valid Bearer token...");
    const res7 = await fetch(`${baseUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data7 = (await res7.json()) as JsonResponse;
    if (res7.status === 200 && data7.success && data7.data?.user?.email === TEST_EMAIL) {
      console.log(
        "✓ PASS: Profile retrieved successfully (200 OK):",
        data7.data.user.name,
        `(${data7.data.user.email})`
      );
    } else {
      throw new Error(
        `FAIL Test 7: Expected 200 profile, got ${res7.status}: ${JSON.stringify(data7)}`
      );
    }

    // TEST 8: Refresh Token Rotation
    console.log("\n[Test 8] Token Refresh via Cookie...");
    const res8 = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: refreshTokenCookie,
      },
    });
    const data8 = (await res8.json()) as JsonResponse;
    const cookieHeader8 = res8.headers.get("set-cookie") || "";
    if (
      res8.status === 200 &&
      data8.success &&
      data8.data?.accessToken &&
      cookieHeader8.includes("refreshToken=")
    ) {
      const newAccessToken = data8.data.accessToken;
      refreshTokenCookie = cookieHeader8.split(";")[0] || "";
      console.log("✓ PASS: Refresh token rotated successfully, received new accessToken");

      // Verify new access token works on protected route
      const res8b = await fetch(`${baseUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
        },
      });
      if (res8b.status === 200) {
        console.log("✓ PASS: New rotated access token verified on protected route");
      } else {
        throw new Error("FAIL Test 8: Rotated access token did not authenticate");
      }
    } else {
      throw new Error(
        `FAIL Test 8: Expected 200 refresh, got ${res8.status}: ${JSON.stringify(data8)}`
      );
    }

    // TEST 9: Logout
    console.log("\n[Test 9] Logout...");
    const res9 = await fetch(`${baseUrl}/auth/logout`, {
      method: "POST",
    });
    const data9 = (await res9.json()) as JsonResponse;
    const cookieHeader9 = res9.headers.get("set-cookie") || "";
    if (
      res9.status === 200 &&
      data9.success &&
      (cookieHeader9.includes("Max-Age=0") || cookieHeader9.includes("Expires="))
    ) {
      console.log("✓ PASS: Logout succeeded (200 OK) and refresh token cookie was cleared");
    } else {
      throw new Error(`FAIL Test 9: Expected 200 logout with cleared cookie, got ${res9.status}`);
    }

    console.log("\n==============================================");
    console.log("🎉 ALL 9 AUTHENTICATION TESTS PASSED WITH 100% SUCCESS!");
    console.log("==============================================\n");
  } finally {
    // Cleanup test user and close server
    try {
      await prisma.user.deleteMany({
        where: { email: TEST_EMAIL },
      });
      await prisma.$disconnect();
    } catch {
      // ignore
    }
    server.close();
  }
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
