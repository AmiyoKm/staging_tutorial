#!/usr/bin/env bun
// backend/scripts/setup-neon.ts

/**
 * Neon setup script for CI/CD deployment
 *
 * Usage: bun run neon:setup --environment=staging|production
 *
 * This script:
 * 1. Ensures the Neon branch exists for the environment
 * 2. Gets the connection string for that branch
 * 3. Runs migrations against the branch
 */

import { ENVIRONMENT_BRANCHES, parseArgs } from "./neon-utils";

// Neon API interfaces
interface NeonBranch {
  id: string;
  name: string;
  current_state: string;
  primary?: boolean;
}

interface NeonBranchesResponse {
  branches: NeonBranch[];
}

interface NeonEndpoint {
  id: string;
  current_state: string;
  pending_state?: string;
}

interface NeonBranchResponse {
  branch: NeonBranch;
  endpoints: NeonEndpoint[];
  connection_uris?: { connection_uri: string }[];
}

interface NeonConnectionStringResponse {
  connection_uri?: string;
  uri?: string;
}

// ANSI colors for output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step: number, message: string) {
  log(`\n[Step ${step}] ${message}`, "blue");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Neon API helper functions
async function listNeonBranches(
  projectId: string,
  apiKey: string,
): Promise<NeonBranch[]> {
  log("Listing branches via Neon API...");

  const response = await fetch(
    `https://console.neon.tech/api/v2/projects/${projectId}/branches`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to list branches: ${response.statusText}`);
  }

  const data = (await response.json()) as NeonBranchesResponse;
  return data.branches || [];
}

async function createNeonBranch(
  projectId: string,
  apiKey: string,
  branchName: string,
  parentId: string,
): Promise<NeonBranchResponse> {
  log(`Creating branch "${branchName}" from parent "${parentId}"...`);

  const response = await fetch(
    `https://console.neon.tech/api/v2/projects/${projectId}/branches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch: {
          name: branchName,
          parent_id: parentId,
        },
        endpoints: [
          {
            type: "read_write",
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to create branch: ${response.statusText}`);
  }

  return (await response.json()) as NeonBranchResponse;
}

async function deleteNeonBranch(
  projectId: string,
  apiKey: string,
  branchId: string,
): Promise<void> {
  log(`Deleting archived branch ${branchId}...`);

  const response = await fetch(
    `https://console.neon.tech/api/v2/projects/${projectId}/branches/${branchId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to delete branch: ${response.statusText}`);
  }

  log(`Branch deleted successfully`, "green");
}

async function getConnectionString(
  projectId: string,
  apiKey: string,
  branchId: string,
): Promise<string> {
  log("Getting connection string...");

  const response = await fetch(
    `https://console.neon.tech/api/v2/projects/${projectId}/connection-uris`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch_id: branchId,
        database_name: "neondb",
        role_name: "neondb_owner",
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to get connection string: ${response.statusText}`);
  }

  const data = (await response.json()) as NeonConnectionStringResponse;
  // Neon returns: { "connection_uri": "postgresql://..." }
  return data.connection_uri || data.uri || "";
}

async function main() {
  try {
    log("🚀 Neon Setup Script for Deployment Automation", "green");

    const { environment } = parseArgs();
    log(`Environment: ${environment}`, "yellow");

    const projectId = process.env.NEON_PROJECT_ID;
    const apiKey = process.env.NEON_API_KEY;

    if (!projectId) throw new Error("NEON_PROJECT_ID is required");
    if (!apiKey) throw new Error("NEON_API_KEY is required");

    const branchName = ENVIRONMENT_BRANCHES[environment];

    // Step 1: Check and create branch if needed
    logStep(1, "Checking Neon branches...");
    const branches = await listNeonBranches(projectId, apiKey);
    log(`Found ${branches.length} existing branches`);

    const existingBranch = branches.find((b) => b.name === branchName);

    let branchId: string;
    let connectionString: string;
    if (existingBranch) {
      // Archived branches don't have compute endpoints, delete and recreate
      if (existingBranch.current_state === "archived") {
        log(`Branch "${branchName}" is archived, deleting and recreating...`, "yellow");

        await deleteNeonBranch(projectId, apiKey, existingBranch.id);

        const primaryBranch = branches.find(
          (b) =>
            b.primary || b.name === "production" || b.name === "br-diffusion",
        );
        if (!primaryBranch) {
          throw new Error("No parent branch found to create from");
        }

        log(`Waiting for deletion to complete...`);
        await sleep(5000);

        log(`Creating new "${branchName}" branch from "${primaryBranch.name}"...`);

        let branchResponse: NeonBranchResponse | null = null;
        let attempts = 0;
        const maxAttempts = 3;
        while (attempts < maxAttempts) {
          try {
            branchResponse = await createNeonBranch(
              projectId,
              apiKey,
              branchName,
              primaryBranch.id,
            );
            break;
          } catch (error) {
            attempts++;
            if (
              error instanceof Error &&
              error.message.includes("Locked") &&
              attempts < maxAttempts
            ) {
              log(`Branch still locked, retrying (${attempts}/${maxAttempts})...`, "yellow");
              await sleep(3000);
            } else {
              throw error;
            }
          }
        }

        if (!branchResponse) {
          throw new Error("Failed to create branch after ${maxAttempts} attempts");
        }

        branchId = branchResponse.branch.id;
        log(
          `Branch recreated: ${branchId} (${branchResponse.branch.current_state})`,
          "green",
        );

        const connectionUri =
          branchResponse.connection_uris?.[0]?.connection_uri;
        if (!connectionUri) {
          throw new Error("No connection URI returned from branch creation");
        }
        connectionString = connectionUri;
      } else {
        branchId = existingBranch.id;
        log(
          `Branch "${branchName}" already exists (${existingBranch.current_state})`,
          "green",
        );
        connectionString = await getConnectionString(
          projectId,
          apiKey,
          branchId,
        );
      }
    } else {
      // Find the primary/production branch as parent
      const primaryBranch = branches.find(
        (b) =>
          b.primary || b.name === "production" || b.name === "br-diffusion",
      );
      if (!primaryBranch) {
        throw new Error("No parent branch found to create from");
      }

      log(`Creating "${branchName}" branch from "${primaryBranch.name}"...`);
      const branchResponse = await createNeonBranch(
        projectId,
        apiKey,
        branchName,
        primaryBranch.id,
      );
      branchId = branchResponse.branch.id;
      log(
        `Branch created: ${branchId} (${branchResponse.branch.current_state})`,
        "green",
      );

      // Use connection URI from the branch creation response
      const connectionUri = branchResponse.connection_uris?.[0]?.connection_uri;
      if (!connectionUri) {
        throw new Error("No connection URI returned from branch creation");
      }
      connectionString = connectionUri;
    }

    logStep(2, "Connection string retrieved...");
    log(`Connection string length: ${connectionString.length}`, "green");

    // Set DATABASE_URL for migrations
    process.env.DATABASE_URL = connectionString;

    // Step 3: Run migrations
    logStep(3, "Running migrations...");
    const { spawn } = await import("child_process");

    await new Promise<void>((resolve, reject) => {
      const migrate = spawn("bun", ["run", "db:migrate"], {
        stdio: "inherit",
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: connectionString },
      });

      migrate.on("close", (code) => {
        if (code === 0) {
          log("Migrations completed successfully!", "green");
          resolve();
        } else {
          reject(new Error(`Migrations failed with code ${code}`));
        }
      });
    });

    log("\n✅ Neon setup completed successfully!", "green");
    log(`Branch: ${branchName}`, "yellow");
    log(`Branch ID: ${branchId}`, "yellow");

    // GitHub Actions can capture this
    console.log(`neon_branch=${branchName}`);
    console.log(`neon_branch_id=${branchId}`);
  } catch (error) {
    if (error instanceof Error) {
      log(`\n❌ Error: ${error.message}`, "red");
      console.error(error);
    }
    process.exit(1);
  }
}

main();
