// Step 8: Metrics collection - aggregate all analysis data
import { PipelineStep, PipelineContext } from './orchestrator';
import { Metrics } from '../../../shared/types';

export class MetricsCollectorStep implements PipelineStep {
  name = 'MetricsCollector';

  async execute(context: PipelineContext): Promise<void> {
    try {
      console.log('[MetricsCollector] Aggregating metrics');

      const metrics: Metrics = {
        // Languages from static analysis
        languages: context.data.languages || {},

        // File and line counts
        totalLines: context.data.totalLines || 0,
        totalFiles: context.data.fileCount || 0,

        // Test metrics
        testFiles: context.data.testFiles?.length || 0,
        testCoverage: context.data.testCoverage || 0,

        // Dependencies
        dependencies: this.collectDependencies(context),

        // File structure
        fileStructure: context.data.fileStructure || [],

        // Code complexity
        complexity: context.data.complexity || {
          average: 0,
          max: 0,
          distribution: {},
        },
      };

      // Add additional metrics from analysis
      const additionalMetrics = {
        projectType: context.data.projectType,
        linesByLanguage: context.data.linesByLanguage,
        codeStats: context.data.codeStats,
        testQuality: context.data.testQuality,
        testFrameworks: context.data.testFrameworks,
        readme: context.data.readme,
        comments: context.data.comments,
        apiDocs: context.data.apiDocs,
        additionalDocs: context.data.additionalDocs,
        secrets: context.data.secrets,
        vulnerabilities: context.data.vulnerabilities,
        securityIssues: context.data.securityIssues,
        dependencySecurity: context.data.dependencySecurity,
      };

      context.data.metrics = metrics;
      context.data.additionalMetrics = additionalMetrics;

      console.log('[MetricsCollector] Metrics aggregated:', {
        languages: Object.keys(metrics.languages).length,
        totalFiles: metrics.totalFiles,
        totalLines: metrics.totalLines,
        testCoverage: `${metrics.testCoverage}%`,
      });

    } catch (error: any) {
      console.error('[MetricsCollector] Collection failed:', error);
      throw new Error(`Metrics collection failed: ${error.message}`);
    }
  }

  private collectDependencies(context: PipelineContext): any[] {
    const deps = context.data.projectDependencies || { count: 0, list: [] };

    return deps.list.map((dep: string) => ({
      name: dep,
      version: 'unknown',
      type: 'production' as const,
      vulnerabilities: [],
    }));
  }
}
