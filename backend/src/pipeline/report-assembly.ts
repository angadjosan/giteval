// Step 12: Report assembly - combine all data into final evaluation
import { PipelineStep, PipelineContext } from './orchestrator';
import { Evaluation, CategoryScore } from '../../../shared/types';

export class ReportAssemblyStep implements PipelineStep {
  name = 'ReportAssembly';

  async execute(context: PipelineContext): Promise<void> {
    const { owner, repo, commitSha } = context;

    try {
      console.log('[ReportAssembly] Assembling final report');

      if (!commitSha) {
        throw new Error('Commit SHA not found in context');
      }

      // Calculate code quality and product quality scores
      const categoryScores: CategoryScore[] = context.data.categoryScores || [];

      const codeQualityCategory = categoryScores.find(c => c.category === 'Code Quality');
      const productQualityCategory = categoryScores.find(c => c.category === 'Product Quality');

      const codeQualityScore = codeQualityCategory?.score || 0;
      const productQualityScore = productQualityCategory?.score || 0;

      // Assemble the final evaluation object
      const evaluation: Evaluation = {
        id: '', // Will be set by database
        repositoryUrl: `https://github.com/${owner}/${repo}`,
        owner,
        repo,
        commitSha,

        overallScore: context.data.overallScore || 0,
        grade: context.data.grade || 'F',
        codeQualityScore,
        productQualityScore,

        summary: context.data.summary || '',
        strengths: context.data.strengths || [],
        improvements: context.data.improvements || [],
        suggestions: context.data.suggestions || [],
        categoryScores,

        architectureDiagram: context.data.architectureDiagram || '',
        metrics: context.data.metrics || {
          languages: {},
          totalLines: 0,
          totalFiles: 0,
          testFiles: 0,
          dependencies: [],
          fileStructure: [],
          complexity: { average: 0, max: 0, distribution: {} },
        },
        metadata: context.data.repositoryMetadata || {
          languages: [],
          stars: 0,
          forks: 0,
          watchers: 0,
          openIssues: 0,
          lastUpdated: new Date(),
          contributors: [],
          topics: [],
        },

        evaluatedAt: new Date(),
        cached: false,
      };

      context.data.evaluation = evaluation;
      context.data.categoryScores = categoryScores;

      console.log('[ReportAssembly] Report assembled successfully:', {
        overallScore: evaluation.overallScore,
        grade: evaluation.grade,
      });

    } catch (error: any) {
      console.error('[ReportAssembly] Assembly failed:', error);
      throw new Error(`Report assembly failed: ${error.message}`);
    }
  }
}
