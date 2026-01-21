/**
 * Neon MCP helper utilities for deployment automation
 * These utilities wrap Neon MCP server tool calls
 */

export interface NeonConfig {
  projectId: string;
  apiKey: string;
}

export interface BranchInfo {
  id: string;
  name: string;
  state: string;
}

export const ENVIRONMENT_BRANCHES = {
  staging: 'staging',
  production: 'production'
} as const;

export type Environment = keyof typeof ENVIRONMENT_BRANCHES;

/**
 * Validates environment argument
 */
export function validateEnvironment(env: string): Environment {
  const validEnvs = Object.keys(ENVIRONMENT_BRANCHES);
  if (!validEnvs.includes(env)) {
    throw new Error(`Invalid environment: ${env}. Must be one of: ${validEnvs.join(', ')}`);
  }
  return env as Environment;
}

/**
 * Parses CLI arguments
 */
export function parseArgs(): { environment: Environment } {
  const args = process.argv.slice(2);
  const envArg = args.find(arg => arg.startsWith('--environment='));

  if (!envArg) {
    throw new Error('--environment flag is required (staging|production)');
  }

  const environment = envArg.split('=')[1];
  return { environment: validateEnvironment(environment) };
}
