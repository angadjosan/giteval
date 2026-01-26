// Service instances - singleton pattern for services used across the application
import { GitHubService } from './github';
import { ClaudeService } from './claude';
import { CacheService } from './cache';
import { DatabaseService } from '../db';

// Singleton instances
let githubService: GitHubService | null = null;
let claudeService: ClaudeService | null = null;
let cacheService: CacheService | null = null;
let databaseService: DatabaseService | null = null;

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
