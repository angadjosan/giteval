// Database service exports
export { DatabaseService } from './supabase';

// Convenience function exports for backward compatibility
import { DatabaseService } from './supabase';
import type { Evaluation, Job, CategoryScore, UserProfile } from '../../../shared/types';

// Create singleton instance
let dbServiceInstance: DatabaseService | null = null;

function getDbService(): DatabaseService {
  if (!dbServiceInstance) {
    dbServiceInstance = new DatabaseService();
  }
  return dbServiceInstance;
}

export async function saveEvaluation(
  evaluation: Omit<Evaluation, 'id' | 'evaluatedAt' | 'cached'>,
  categoryScores: CategoryScore[]
): Promise<Evaluation> {
  const dbService = getDbService();
  const id = await dbService.saveEvaluation(evaluation, categoryScores);
  const saved = await dbService.getEvaluation(id);
  if (!saved) {
    throw new Error('Failed to retrieve saved evaluation');
  }
  return saved;
}

export async function getEvaluation(id: string): Promise<Evaluation | null> {
  return getDbService().getEvaluation(id);
}

export async function getEvaluationByRepo(
  owner: string,
  repo: string,
  commitSha?: string
): Promise<Evaluation | null> {
  return getDbService().getEvaluationByRepo(owner, repo, commitSha);
}

export async function getCategoryScores(evaluationId: string): Promise<CategoryScore[]> {
  return getDbService().getCategoryScores(evaluationId);
}

export async function saveUserProfile(
  profile: Omit<UserProfile, 'id' | 'evaluatedAt'>
): Promise<string> {
  return getDbService().saveUserProfile(profile);
}

export async function getUserProfile(username: string): Promise<UserProfile | null> {
  return getDbService().getUserProfile(username);
}

export async function createJob(
  type: 'repository' | 'user_profile',
  payload: any
): Promise<string> {
  return getDbService().createJob(type, payload);
}

export async function updateJob(
  id: string,
  updates: {
    status?: Job['status'];
    progress?: number;
    error?: string;
    resultId?: string;
  }
): Promise<void> {
  return getDbService().updateJob(id, updates);
}

export async function getJob(id: string): Promise<Job | null> {
  return getDbService().getJob(id);
}

export async function getPendingJobs(limit?: number): Promise<Job[]> {
  return getDbService().getPendingJobs(limit);
}
