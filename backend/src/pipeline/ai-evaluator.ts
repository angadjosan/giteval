// Step 9: AI evaluation using Claude API
import { PipelineStep, PipelineContext } from './orchestrator';
import { evaluateRepository } from '../services/claude';
import { getRepositoryMetadata } from '../services/github';
import type { Metrics } from '../../../shared/types';

export class AIEvaluatorStep implements PipelineStep {
  name = 'AIEvaluator';

  async execute(context: PipelineContext): Promise<void> {
    const { owner, repo } = context;

    try {
      console.log('[AIEvaluator] Starting AI evaluation');

      // Get repository metadata from GitHub
      const metadata = await getRepositoryMetadata(owner, repo);
      context.data.repositoryMetadata = metadata;

      // Prepare evaluation context
      const metrics = context.data.metrics as Metrics;
      const evaluationContext = {
        repoName: `${owner}/${repo}`,
        owner,
        repo,
        description: metadata.description,
        languages: metadata.languages,
        stars: metadata.stars,
        metrics,
        readmeContent: context.data.readmeContent,
        sampleCode: context.data.sampleCode,
      };

      // Call Claude API for evaluation
      const evaluation = await evaluateRepository(evaluationContext);

      // Store evaluation results
      context.data.aiEvaluation = evaluation;
      context.data.overallScore = evaluation.overallScore;
      context.data.grade = evaluation.grade;
      context.data.categoryScores = evaluation.categoryScores;
      context.data.summary = evaluation.summary;
      context.data.strengths = evaluation.strengths;
      context.data.improvements = evaluation.improvements;
      context.data.suggestions = evaluation.suggestions;

      console.log('[AIEvaluator] Evaluation complete:', {
        overallScore: evaluation.overallScore,
        grade: evaluation.grade,
        codeQualityScore: evaluation.categoryScores.find((c: any) => c.category === 'Code Quality')?.score,
        productQualityScore: evaluation.categoryScores.find((c: any) => c.category === 'Product Quality')?.score,
      });

    } catch (error: any) {
      console.error('[AIEvaluator] Evaluation failed:', error);
      throw new Error(`AI evaluation failed: ${error.message}`);
    }
  }
}
