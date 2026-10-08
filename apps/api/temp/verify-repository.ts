import prisma from "../src/config/prisma.js";
import { repositoryService } from "../src/services/repository.service.js";
import { analysisRepository } from "../src/repositories/analysis.repository.js";
import app from "../src/app.js";
import type { Server } from "node:http";

const PORT = 5098;
const BASE_URL = `http://localhost:${PORT}`;

async function main() {
  console.log("=== Milestone 4: Repository Integration Verification Suite ===");

  const server: Server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 300));

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      console.log(`  PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  const timestamp = Date.now();
  const userAEmail = `repo_owner_${timestamp}@example.com`;
  const userBEmail = `repo_intruder_${timestamp}@example.com`;
  const password = "Password123!";

  let tokenA = "";
  let tokenB = "";
  let projectAId = "";

  try {
    // 1. Register User A
    console.log("\n1. Register User A and User B");
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "User A", email: userAEmail, password }),
    });
    const regDataA = (await regResA.json()) as { success: boolean; data: { accessToken: string } };
    assert(regResA.status === 201 && regDataA.success, "User A registered successfully");
    tokenA = regDataA.data.accessToken;

    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "User B", email: userBEmail, password }),
    });
    const regDataB = (await regResB.json()) as { success: boolean; data: { accessToken: string } };
    assert(regResB.status === 201 && regDataB.success, "User B registered successfully");
    tokenB = regDataB.data.accessToken;

    // 2. Create Project for User A with public repo
    console.log("\n2. Create Project with GitHub URL");
    const createRes = await fetch(`${BASE_URL}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: "Octocat Hello World",
        description: "Small test repository",
        githubUrl: "https://github.com/octocat/Hello-World",
      }),
    });
    const createData = (await createRes.json()) as {
      success: boolean;
      data: { project: { id: string; githubUrl: string; defaultBranch: string } };
    };
    assert(createRes.status === 201 && createData.success, "Project created successfully");
    projectAId = createData.data.project.id;

    // 3. Initial Status Check (Before Clone)
    console.log("\n3. Verify Initial Status before Clone");
    const initialStatusRes = await fetch(`${BASE_URL}/projects/${projectAId}/status`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const initialStatusData = (await initialStatusRes.json()) as {
      success: boolean;
      data: { isCloned: boolean; latestAnalysis: unknown; metadata: unknown };
    };
    assert(initialStatusRes.status === 200, "Initial status endpoint returns 200");
    assert(initialStatusData.data.isCloned === false, "Project isCloned is initially false");
    assert(initialStatusData.data.latestAnalysis === null, "latestAnalysis is initially null");

    // 4. Trigger Analysis / Clone (First Run)
    console.log("\n4. Trigger POST /projects/:id/analyze (Initial Clone)");
    const analyzeRes1 = await fetch(`${BASE_URL}/projects/${projectAId}/analyze`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const analyzeData1 = (await analyzeRes1.json()) as {
      success: boolean;
      data: {
        project: { defaultBranch: string; lastAnalysis: string };
        analysis: { status: string; summary: string; analysisDuration: number };
        metadata: {
          branch: string;
          commitHash: string;
          fileCount: number;
          directoryCount: number;
        };
      };
    };

    assert(analyzeRes1.status === 200, "POST /analyze returned HTTP 200");
    assert(analyzeData1.success === true, "Response reports success: true");
    assert(analyzeData1.data.analysis.status === "completed", "Analysis status is 'completed'");
    assert(analyzeData1.data.metadata.commitHash.length > 0, "Commit hash was extracted");
    assert(analyzeData1.data.metadata.fileCount > 0, "Files were detected in cloned repo");
    assert(
      Boolean(analyzeData1.data.project.lastAnalysis),
      "project.lastAnalysis timestamp updated"
    );
    console.log(`     Branch: ${analyzeData1.data.metadata.branch}`);
    console.log(`     Commit: ${analyzeData1.data.metadata.commitHash}`);
    console.log(`     Files : ${analyzeData1.data.metadata.fileCount}`);
    console.log(`     Summary: ${analyzeData1.data.analysis.summary}`);

    // 5. Trigger Analysis / Pull (Second Run)
    console.log("\n5. Trigger POST /projects/:id/analyze (Subsequent Pull)");
    const analyzeRes2 = await fetch(`${BASE_URL}/projects/${projectAId}/analyze`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const analyzeData2 = (await analyzeRes2.json()) as {
      success: boolean;
      data: {
        analysis: { status: string; summary: string };
        metadata: { branch: string };
      };
    };
    assert(analyzeRes2.status === 200, "Subsequent analyze returned HTTP 200");
    assert(
      analyzeData2.data.analysis.status === "completed",
      "Second analysis completed cleanly via pull"
    );
    assert(
      analyzeData2.data.analysis.summary.includes("pulled"),
      "Analysis summary indicates repo was pulled"
    );

    // 6. Check GET /projects/:id/status after Clone
    console.log("\n6. Verify GET /projects/:id/status after Clone");
    const postStatusRes = await fetch(`${BASE_URL}/projects/${projectAId}/status`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const postStatusData = (await postStatusRes.json()) as {
      success: boolean;
      data: {
        isCloned: boolean;
        latestAnalysis: { status: string };
        metadata: { commitHash: string; fileCount: number };
      };
    };
    assert(postStatusRes.status === 200, "Status endpoint returns 200 after clone");
    assert(postStatusData.data.isCloned === true, "Project reports isCloned: true");
    assert(
      postStatusData.data.latestAnalysis.status === "completed",
      "Status reports completed analysis"
    );
    assert(postStatusData.data.metadata.fileCount > 0, "Status returns repo metadata");

    // 7. Authorization Isolation Checks (User B cannot access User A's project)
    console.log("\n7. Authorization Isolation Check (Forbidden for other users)");
    const intruderAnalyzeRes = await fetch(`${BASE_URL}/projects/${projectAId}/analyze`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(intruderAnalyzeRes.status === 403, "User B gets 403 Forbidden on POST /analyze");

    const intruderStatusRes = await fetch(`${BASE_URL}/projects/${projectAId}/status`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(intruderStatusRes.status === 403, "User B gets 403 Forbidden on GET /status");

    // 8. Graceful Degradation on Invalid/Inaccessible Repository
    console.log("\n8. Test Graceful Failure Handling on Inaccessible Repo");
    const badProjectRes = await fetch(`${BASE_URL}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: "Broken Repo Test",
        githubUrl: "https://github.com/nonexistent-org-09817234/totally-fake-repo-xyz",
      }),
    });
    const badProjectData = (await badProjectRes.json()) as {
      success: boolean;
      data: { project: { id: string } };
    };
    const badProjectId = badProjectData.data.project.id;

    const badAnalyzeRes = await fetch(`${BASE_URL}/projects/${badProjectId}/analyze`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const badAnalyzeData = (await badAnalyzeRes.json()) as {
      success: boolean;
      message: string;
      errorCode: string;
    };
    assert(badAnalyzeRes.status === 400, "Bad repository returns HTTP 400");
    assert(badAnalyzeData.errorCode === "CLONE_FAILED", "Returns CLONE_FAILED error code");

    // Verify DB recorded failure in Analysis table
    const failedAnalysis = await analysisRepository.findLatestByProjectId(badProjectId);
    assert(failedAnalysis !== null, "Analysis record was persisted in DB");
    assert(failedAnalysis?.status === "failed", "Analysis record status is set to 'failed'");

    console.log(`     Recorded failure message: ${failedAnalysis?.summary}`);

    // Cleanup bad project and temp clone
    await fetch(`${BASE_URL}/projects/${badProjectId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    await repositoryService.deleteRepository(badProjectId);

    console.log("\n=======================================================");
    console.log(`ALL TESTS PASSED! (${passedTests}/${totalTests})`);
    console.log("=======================================================");
  } finally {
    // Cleanup User A project and cloned directory
    if (projectAId) {
      await fetch(`${BASE_URL}/projects/${projectAId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenA}` },
      }).catch(() => {});
      await repositoryService.deleteRepository(projectAId).catch(() => {});
    }

    // Cleanup database test users
    await prisma.user.deleteMany({
      where: { email: { in: [userAEmail, userBEmail] } },
    });

    await prisma.$disconnect();
    server.close();
  }
}

main().catch((err) => {
  console.error("Verification failed with exception:", err);
  process.exit(1);
});
