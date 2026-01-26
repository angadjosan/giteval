// Analysis pipeline orchestrator
import { Job } from '../../../shared/types';
import { DatabaseService } from '../db';
import { CacheCheckStep } from './cache-check';
import { CloneStep } from './clone';
import { StaticAnalysisStep } from './static-analysis';
import { CodeParserStep } from './code-parser';
import { TestAnalyzerStep } from './test-analyzer';
import { DocumentationScannerStep } from './documentation-scanner';
import { SecurityScannerStep } from './security-scanner';
import { MetricsCollectorStep } from './metrics-collector';
import { AIEvaluatorStep } from './ai-evaluator';
import { ArchitectureDiagramStep } from './architecture-diagram';
import { VisualizationStep } from './visualization';
import { ReportAssemblyStep } from './report-assembly';
import { CacheStorageStep } from './cache-storage';
import { CleanupStep } from './cleanup';

export interface PipelineContext {
  job: Job;
  owner: string;
  repo: string;
  commitSha?: string;
  clonePath?: string;
  data: Record<string, any>;
}

export interface PipelineStep {
  name: string;
  execute(context: PipelineContext): Promise<void>;
}

export class AnalysisPipeline {
  private steps: PipelineStep[] = [
    new CacheCheckStep(),
    new CloneStep(),
    new StaticAnalysisStep(),
    new CodeParserStep(),
    new TestAnalyzerStep(),
    new DocumentationScannerStep(),
    new SecurityScannerStep(),
    new MetricsCollectorStep(),
    new AIEvaluatorStep(),
    new ArchitectureDiagramStep(),
    new VisualizationStep(),
    new ReportAssemblyStep(),
    new CacheStorageStep(),
    new CleanupStep(),
  ];

  /**
   * Execute the analysis pipeline for a job
   */
  async execute(job: Job): Promise<any> {
    const context: PipelineContext = {
      job,
      owner: job.payload.owner,
      repo: job.payload.repo,
      data: {},
    };

    try {
      // Sequential execution with progress tracking
      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];

        console.log(`[Pipeline] Starting step ${i + 1}/${this.steps.length}: ${step.name}`);

        try {
          await step.execute(context);
        } catch (error) {
          console.error(`[Pipeline] Step ${step.name} failed:`, error);
          throw error;
        }

        // Update progress
        const progress = Math.floor(((i + 1) / this.steps.length) * 100);
        await this.updateJobProgress(job.id, progress);

        // If cache hit, return early
        if (context.data.cached && step.name === 'CacheCheck') {
          console.log('[Pipeline] Cache hit, returning cached evaluation');
          const { updateJob } = await import('../db');
          await updateJob(job.id, {
            status: 'completed',
            progress: 100,
            resultId: context.data.evaluation.id,
          });
          return context.data.evaluation;
        }
      }

      console.log('[Pipeline] Pipeline completed successfully');
      return context.data.evaluation;

    } catch (error: any) {
      console.error('[Pipeline] Pipeline failed:', error);
      await this.handleStepFailure(job.id, error);
      throw error;
    }
  }

  /**
   * Execute pipeline with parallel optimization for independent steps
   */
  async executeOptimized(job: Job): Promise<any> {
    const context: PipelineContext = {
      job,
      owner: job.payload.owner,
      repo: job.payload.repo,
      data: {},
    };

    try {
      // Step 1: Cache check (sequential)
      await new CacheCheckStep().execute(context);
      await this.updateJobProgress(job.id, 7);

      if (context.data.cached) {
        const { updateJob } = await import('../db');
        await updateJob(job.id, {
          status: 'completed',
          progress: 100,
          resultId: context.data.evaluation.id,
        });
        return context.data.evaluation;
      }

      // Step 2: Clone repository (sequential)
      await new CloneStep().execute(context);
      await this.updateJobProgress(job.id, 14);

      // Steps 3-7: Run analysis in parallel (independent steps)
      await Promise.all([
        new StaticAnalysisStep().execute(context),
        new CodeParserStep().execute(context),
        new TestAnalyzerStep().execute(context),
        new DocumentationScannerStep().execute(context),
        new SecurityScannerStep().execute(context),
      ]);
      await this.updateJobProgress(job.id, 50);

      // Step 8: Collect metrics (depends on previous steps)
      await new MetricsCollectorStep().execute(context);
      await this.updateJobProgress(job.id, 57);

      // Steps 9-10: AI processing (can be parallel)
      await Promise.all([
        new AIEvaluatorStep().execute(context),
        new ArchitectureDiagramStep().execute(context),
      ]);
      await this.updateJobProgress(job.id, 71);

      // Steps 11-14: Finalization (sequential)
      await new VisualizationStep().execute(context);
      await this.updateJobProgress(job.id, 78);

      await new ReportAssemblyStep().execute(context);
      await this.updateJobProgress(job.id, 85);

      await new CacheStorageStep().execute(context);
      await this.updateJobProgress(job.id, 92);

      await new CleanupStep().execute(context);
      await this.updateJobProgress(job.id, 100);

      return context.data.evaluation;

    } catch (error: any) {
      console.error('[Pipeline] Optimized pipeline failed:', error);
      await this.handleStepFailure(job.id, error);
      throw error;
    }
  }

  /**
   * Update job progress in database
   */
  private async updateJobProgress(jobId: string, progress: number): Promise<void> {
    try {
      const { updateJob } = await import('../db');
      await updateJob(jobId, { progress });
    } catch (error) {
      console.error('[Pipeline] Failed to update job progress:', error);
      // Don't throw - progress update failure shouldn't stop pipeline
    }
  }

  /**
   * Handle step failure
   */
  private async handleStepFailure(jobId: string, error: any): Promise<void> {
    try {
      const { updateJob } = await import('../db');
      await updateJob(jobId, {
        status: 'failed',
        error: error.message || 'Unknown error occurred',
      });
    } catch (updateError) {
      console.error('[Pipeline] Failed to update job status:', updateError);
    }
  }
}

/**
 * Convenience function to execute the pipeline for a job
 */
export async function executePipeline(jobId: string, owner: string, repo: string): Promise<any> {
  const { getDatabaseService } = await import('../services/instances');
  const databaseService = getDatabaseService();
  
  // Get the job from database
  const job = await databaseService.getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  // Update job status to processing
  await databaseService.updateJob(jobId, {
    status: 'processing',
    progress: 0,
  });

  // Create pipeline instance and execute
  const pipeline = new AnalysisPipeline();
  return pipeline.executeOptimized(job);
}
