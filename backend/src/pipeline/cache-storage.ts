// Step 13: Cache storage - store evaluation in Redis and database
import { PipelineStep, PipelineContext } from './orchestrator';
import { setEvaluation } from '../services/cache';
import { saveEvaluation } from '../db/supabase';
import { updateJob } from '../db/supabase';

export class CacheStorageStep implements PipelineStep {
  name = 'CacheStorage';

  async execute(context: PipelineContext): Promise<void> {
    const { owner, repo, commitSha } = context;

    try {
      console.log('[CacheStorage] Storing evaluation in cache');

      const evaluation = context.data.evaluation;

      if (!evaluation) {
        throw new Error('Evaluation not found in context');
      }

      if (!commitSha) {
        throw new Error('Commit SHA not found in context');
      }

      // Save to database (warm cache) - this sets the ID
      const savedEvaluation = await saveEvaluation(
        evaluation,
        context.data.categoryScores
      );

      // Update evaluation with database ID
      evaluation.id = savedEvaluation.id;
      context.data.evaluation = savedEvaluation;

      // Store in Redis (hot cache)
      await setEvaluation(owner, repo, commitSha, savedEvaluation);

      // Update job with result_id
      await updateJob(context.job.id, {
        result_id: savedEvaluation.id,
      });

      console.log('[CacheStorage] Evaluation stored successfully:', {
        evaluationId: savedEvaluation.id,
      });

    } catch (error: any) {
      console.error('[CacheStorage] Storage failed:', error);
      throw new Error(`Cache storage failed: ${error.message}`);
    }
  }
}
