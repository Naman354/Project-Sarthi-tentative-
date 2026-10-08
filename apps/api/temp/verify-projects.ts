import http from "node:http";
import app from "../src/app.js";
import prisma from "../src/config/prisma.js";

const USER1_EMAIL = "proj-test-user-1@example.com";
const USER2_EMAIL = "proj-test-user-2@example.com";
const TEST_PASSWORD = "Password123456!";

interface JsonResponse {
  success: boolean;
  message?: string;
  errorCode?: string;
  data?: any;
}

async function run() {
  console.log("=== STARTING PROJECT MANAGEMENT ENGINE VERIFICATION ===");

  // 1. Pre-test cleanup
  try {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [USER1_EMAIL, USER2_EMAIL],
        },
      },
    });
    console.log("✓ Pre-test database cleanup completed");
  } catch (err) {
    console.warn("Cleanup notice:", err);
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

  try {
    // 3. Register User 1 and User 2
    const resReg1 = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Developer One",
        email: USER1_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    const reg1Data = (await resReg1.json()) as JsonResponse;
    const user1Token = reg1Data.data.accessToken;

    const resReg2 = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Developer Two",
        email: USER2_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    const reg2Data = (await resReg2.json()) as JsonResponse;
    const user2Token = reg2Data.data.accessToken;

    console.log("✓ Both test users registered and authenticated");

    // TEST 1: GitHub URL validation rejection
    console.log("\n[Test 1] Rejecting invalid GitHub URLs...");
    const res1 = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        name: "Invalid Repo Test",
        githubUrl: "https://notgithub.com/someone/repo",
      }),
    });
    const data1 = (await res1.json()) as JsonResponse;
    if (res1.status === 400 && data1.errorCode === "VALIDATION_ERROR") {
      console.log("✓ PASS: Correctly rejected non-GitHub URL with 400 VALIDATION_ERROR");
    } else {
      throw new Error(
        `FAIL Test 1: Expected 400 VALIDATION_ERROR, got ${res1.status}: ${JSON.stringify(data1)}`
      );
    }

    // TEST 2: User 1 creates Project A (with .git and trailing slash to verify normalization)
    console.log("\n[Test 2] Creating Project A with URL normalization...");
    const res2 = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        name: "Project Sarthi",
        description: "Software understanding engine",
        githubUrl: "https://github.com/Naman354/Project-Sarthi-tentative-.git/",
      }),
    });
    const data2 = (await res2.json()) as JsonResponse;
    if (
      res2.status === 201 &&
      data2.success &&
      data2.data?.project?.id &&
      data2.data.project.githubUrl === "https://github.com/Naman354/Project-Sarthi-tentative-"
    ) {
      console.log(
        "✓ PASS: Project A created (201 Created) with URL normalized to:",
        data2.data.project.githubUrl
      );
    } else {
      throw new Error(
        `FAIL Test 2: Expected 201 project creation, got ${res2.status}: ${JSON.stringify(data2)}`
      );
    }
    const projectAId = data2.data.project.id;

    // TEST 3: User 1 creates Project B
    console.log("\n[Test 3] Creating Project B...");
    const res3 = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        name: "React Core",
        githubUrl: "https://github.com/facebook/react",
      }),
    });
    const data3 = (await res3.json()) as JsonResponse;
    if (res3.status === 201 && data3.success) {
      console.log("✓ PASS: Project B created successfully");
    } else {
      throw new Error(`FAIL Test 3: Failed to create Project B`);
    }

    // TEST 4: User 1 lists their projects
    console.log("\n[Test 4] User 1 lists projects...");
    const res4 = await fetch(`${baseUrl}/projects`, {
      headers: {
        Authorization: `Bearer ${user1Token}`,
      },
    });
    const data4 = (await res4.json()) as JsonResponse;
    if (
      res4.status === 200 &&
      data4.success &&
      Array.isArray(data4.data.projects) &&
      data4.data.projects.length === 2
    ) {
      console.log("✓ PASS: User 1 sees exactly their 2 projects");
    } else {
      throw new Error(`FAIL Test 4: Expected 2 projects, got ${JSON.stringify(data4)}`);
    }

    // TEST 5: User 2 lists their projects (Isolation check)
    console.log("\n[Test 5] User 2 lists projects (Tenant isolation)...");
    const res5 = await fetch(`${baseUrl}/projects`, {
      headers: {
        Authorization: `Bearer ${user2Token}`,
      },
    });
    const data5 = (await res5.json()) as JsonResponse;
    if (
      res5.status === 200 &&
      data5.success &&
      Array.isArray(data5.data.projects) &&
      data5.data.projects.length === 0
    ) {
      console.log("✓ PASS: User 2 sees 0 projects (strict isolation enforced)");
    } else {
      throw new Error(`FAIL Test 5: Expected 0 projects for User 2, got ${JSON.stringify(data5)}`);
    }

    // TEST 6: User 1 views Project A by ID
    console.log("\n[Test 6] User 1 views Project A...");
    const res6 = await fetch(`${baseUrl}/projects/${projectAId}`, {
      headers: {
        Authorization: `Bearer ${user1Token}`,
      },
    });
    const data6 = (await res6.json()) as JsonResponse;
    if (res6.status === 200 && data6.data?.project?.id === projectAId) {
      console.log("✓ PASS: User 1 successfully views Project A details");
    } else {
      throw new Error(`FAIL Test 6: Expected 200 project details, got ${res6.status}`);
    }

    // TEST 7: User 2 attempts to view User 1's Project A (Forbidden)
    console.log("\n[Test 7] User 2 attempts to access User 1's Project A...");
    const res7 = await fetch(`${baseUrl}/projects/${projectAId}`, {
      headers: {
        Authorization: `Bearer ${user2Token}`,
      },
    });
    const data7 = (await res7.json()) as JsonResponse;
    if (res7.status === 403 && data7.errorCode === "FORBIDDEN_PROJECT_ACCESS") {
      console.log("✓ PASS: Unauthorized access blocked with 403 FORBIDDEN_PROJECT_ACCESS");
    } else {
      throw new Error(
        `FAIL Test 7: Expected 403 FORBIDDEN, got ${res7.status}: ${JSON.stringify(data7)}`
      );
    }

    // TEST 8: User 2 attempts to delete User 1's Project A (Forbidden)
    console.log("\n[Test 8] User 2 attempts to delete User 1's Project A...");
    const res8 = await fetch(`${baseUrl}/projects/${projectAId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user2Token}`,
      },
    });
    const data8 = (await res8.json()) as JsonResponse;
    if (res8.status === 403 && data8.errorCode === "FORBIDDEN_PROJECT_ACCESS") {
      console.log("✓ PASS: Unauthorized delete blocked with 403 FORBIDDEN_PROJECT_ACCESS");
    } else {
      throw new Error(`FAIL Test 8: Expected 403 FORBIDDEN, got ${res8.status}`);
    }

    // TEST 9: User 1 updates Project A
    console.log("\n[Test 9] User 1 updates Project A...");
    const res9 = await fetch(`${baseUrl}/projects/${projectAId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        name: "Project Sarthi (Updated)",
      }),
    });
    const data9 = (await res9.json()) as JsonResponse;
    if (res9.status === 200 && data9.data?.project?.name === "Project Sarthi (Updated)") {
      console.log("✓ PASS: Project A updated successfully");
    } else {
      throw new Error(`FAIL Test 9: Expected 200 update, got ${res9.status}`);
    }

    // TEST 10: User 1 deletes Project A
    console.log("\n[Test 10] User 1 deletes Project A...");
    const res10 = await fetch(`${baseUrl}/projects/${projectAId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user1Token}`,
      },
    });
    const data10 = (await res10.json()) as JsonResponse;
    if (res10.status === 200 && data10.success) {
      console.log("✓ PASS: Project A deleted successfully (200 OK)");
    } else {
      throw new Error(`FAIL Test 10: Expected 200 delete, got ${res10.status}`);
    }

    // TEST 11: User 1 tries to fetch deleted Project A
    console.log("\n[Test 11] User 1 tries to fetch deleted Project A...");
    const res11 = await fetch(`${baseUrl}/projects/${projectAId}`, {
      headers: {
        Authorization: `Bearer ${user1Token}`,
      },
    });
    const data11 = (await res11.json()) as JsonResponse;
    if (res11.status === 404 && data11.errorCode === "PROJECT_NOT_FOUND") {
      console.log("✓ PASS: Deleted project returned 404 PROJECT_NOT_FOUND");
    } else {
      throw new Error(`FAIL Test 11: Expected 404 NOT_FOUND, got ${res11.status}`);
    }

    console.log("\n==============================================");
    console.log("🎉 ALL 11 PROJECT MANAGEMENT TESTS PASSED WITH 100% SUCCESS!");
    console.log("==============================================\n");
  } finally {
    // Cleanup test users and cascade
    try {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [USER1_EMAIL, USER2_EMAIL],
          },
        },
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
