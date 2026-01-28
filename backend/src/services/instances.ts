// Service instances - singleton pattern for services used across the application
import { GitHubService } from './github';
import { ClaudeService } from './claude';
import { CacheService } from './cache';
import { DatabaseService } from '../db';
import { getSecret } from '../utils/secrets';

// Singleton instances
let githubService: GitHubService | null = null;
let claudeService: ClaudeService | null = null;
let cacheService: CacheService | null = null;
let databaseService: DatabaseService | null = null;

// Initialize services with secrets from Secret Manager
let servicesInitialized = false;

export async function initializeServices(): Promise<void> {
  if (servicesInitialized) {
    return;
  }

  // Preload secrets (this will cache them)
  const secrets = [
    { secretName: 'giteval-github-token', envVarName: 'GITHUB_TOKEN' },
    { secretName: 'giteval-claude-api-key', envVarName: 'CLAUDE_API_KEY' },
    { secretName: 'giteval-supabase-url', envVarName: 'SUPABASE_URL' },
    { secretName: 'giteval-supabase-service-role-key', envVarName: 'SUPABASE_SERVICE_ROLE_KEY' },
    { secretName: 'giteval-redis-url', envVarName: 'REDIS_URL' },
  ];

  await Promise.all(
    secrets.map(async ({ secretName, envVarName }) => {
      const value = await getSecret(secretName, envVarName);
      if (value && !process.env[envVarName]) {
        process.env[envVarName] = value;
      }
    })
  );

  // Load optional secrets
  const optionalSecrets = [
    { secretName: 'giteval-frontend-url', envVarName: 'FRONTEND_URL' },
    { secretName: 'giteval-custom-domain', envVarName: 'CUSTOM_DOMAIN' },
    { secretName: 'giteval-github-api-url', envVarName: 'GITHUB_API_URL', defaultValue: 'https://api.github.com' },
    { secretName: 'giteval-claude-model', envVarName: 'CLAUDE_MODEL', defaultValue: 'claude-opus-4-5-20251101' },
    { secretName: 'giteval-temp-dir', envVarName: 'TEMP_DIR', defaultValue: '/tmp/giteval' },
    { secretName: 'giteval-max-repo-size-mb', envVarName: 'MAX_REPO_SIZE_MB', defaultValue: '1024' },
    { secretName: 'giteval-max-repo-files', envVarName: 'MAX_REPO_FILES', defaultValue: '10000' },
    { secretName: 'giteval-analysis-timeout-ms', envVarName: 'ANALYSIS_TIMEOUT_MS', defaultValue: '300000' },
  ];

  await Promise.all(
    optionalSecrets.map(async ({ secretName, envVarName, defaultValue }) => {
      const value = await getSecret(secretName, envVarName, defaultValue);
      if (value && !process.env[envVarName]) {
        process.env[envVarName] = value;
      } else if (defaultValue && !process.env[envVarName]) {
        process.env[envVarName] = defaultValue;
      }
    })
  );

  servicesInitialized = true;
}

export function getGitHubService(): GitHubService {
  if (!githubService) {
    githubService = new GitHubService();
  }
  return githubService;
}

export function getClaudeService(): ClaudeService {
  if (!claudeService) {
    claudeService = new ClaudeService();
  }
  return claudeService;
}

export function getCacheService(): CacheService {
  if (!cacheService) {
    cacheService = new CacheService();
    // Auto-connect on first access
    cacheService.connect().catch(err => {
      console.error('Failed to auto-connect cache service:', err);
    });
  }
  return cacheService;
}

export function getDatabaseService(): DatabaseService {
  if (!databaseService) {
    databaseService = new DatabaseService();
  }
  return databaseService;
}
