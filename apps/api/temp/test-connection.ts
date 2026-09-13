import prisma from "../src/config/prisma.js";

async function verifyModels() {
  try {
    console.log("Verifying PostgreSQL database tables via Prisma...");
    const [users, projects, graphVersions, nodes, edges, analyses, insights, healthMetrics] =
      await Promise.all([
        prisma.user.findMany(),
        prisma.project.findMany(),
        prisma.graphVersion.findMany(),
        prisma.node.findMany(),
        prisma.edge.findMany(),
        prisma.analysis.findMany(),
        prisma.insight.findMany(),
        prisma.healthMetric.findMany(),
      ]);

    console.log("All tables exist and are queryable!");
    console.log({
      usersCount: users.length,
      projectsCount: projects.length,
      graphVersionsCount: graphVersions.length,
      nodesCount: nodes.length,
      edgesCount: edges.length,
      analysesCount: analyses.length,
      insightsCount: insights.length,
      healthMetricsCount: healthMetrics.length,
    });
  } catch (error: any) {
    console.error("Verification failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyModels();
