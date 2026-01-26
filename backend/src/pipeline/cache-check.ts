// Step 1: Check if evaluation exists in cache
import { PipelineStep, PipelineContext } from './orchestrator';
import { getEvaluation as getCachedEvaluation } from '../services/cache';
import { getEvaluationByRepo } from '../db';
import { getCommitSha } from '../services/github';

export class CacheCheckStep implements PipelineStep {
  name = 'CacheCheck';

  async execute(context: PipelineContext): Promise<void> {
    const { owner, repo } = context;

    try {
      // Get latest commit SHA for the repository
      const commitSha = await getCommitSha(owner, repo);
      context.commitSha = commitSha;
      context.data.commitSha = commitSha;

      console.log(`[CacheCheck] Checking cache for ${owner}/${repo}@${commitSha}`);

      // Check Redis cache first (hot cache)
      let cachedEvaluation = await getCachedEvaluation(owner, repo, commitSha);

      if (cachedEvaluation) {
        console.log('[CacheCheck] Cache hit in Redis');
        context.data.cached = true;
        context.data.evaluation = cachedEvaluation;
        return;
      }

      // Check database (warm cache)
      cachedEvaluation = await getEvaluationByRepo(owner, repo, commitSha);

      if (cachedEvaluation) {
        console.log('[CacheCheck] Cache hit in database');
        context.data.cached = true;
        context.data.evaluation = cachedEvaluation;
        return;
      }

      console.log('[CacheCheck] Cache miss, will perform full analysis');
      context.data.cached = false;

    } catch (error) {
      console.error('[CacheCheck] Error during cache check:', error);
      // Don't throw - continue with analysis if cache check fails
      context.data.cached = false;
    }
  }
}
