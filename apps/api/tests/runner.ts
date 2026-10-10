import { runParserTests } from "./unit/parsers.test.js";
import { runGraphTests } from "./unit/graph.test.js";
import { runAnalysisTests } from "./unit/analysis.test.js";
import { runEvidenceFoundationTests } from "./unit/evidence-foundation.test.js";
import { runProjectBriefTests } from "./unit/project-brief.test.js";

async function main() {
  const startTime = Date.now();
  console.log("=========================================================");
  console.log("   PROJECT SARTHI - AUTOMATED TEST SUITE (MILESTONE 10)  ");
  console.log("=========================================================");

  const results: Array<{ name: string; passed: number; failed: number }> = [];

  try {
    results.push(await runParserTests());
    results.push(await runGraphTests());
    results.push(await runAnalysisTests());
    results.push(await runEvidenceFoundationTests());
    results.push(await runProjectBriefTests());
  } catch (error) {
    console.error("\nUnexpected test suite runner failure:", error);
    process.exit(1);
  }

  const durationMs = Date.now() - startTime;
  console.log("\n=========================================================");
  console.log("                     TEST SUMMARY                        ");
  console.log("=========================================================");

  let totalPassed = 0;
  let totalFailed = 0;

  for (const res of results) {
    const status = res.failed === 0 ? "PASSED" : "FAILED";
    console.log(
      `  ${res.name.padEnd(35)} : [${status}] (${res.passed} passed, ${res.failed} failed)`
    );
    totalPassed += res.passed;
    totalFailed += res.failed;
  }

  console.log("---------------------------------------------------------");
  console.log(`  Total Passed : ${totalPassed}`);
  console.log(`  Total Failed : ${totalFailed}`);
  console.log(`  Duration     : ${durationMs}ms`);
  console.log("=========================================================");

  if (totalFailed > 0) {
    console.error("\n Test suite failed with errors.");
    process.exit(1);
  } else {
    console.log("\n All test suites passed successfully!");
    process.exit(0);
  }
}

void main();
