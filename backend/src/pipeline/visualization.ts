// Step 11: Visualization generation - prepare chart data
import { PipelineStep, PipelineContext } from './orchestrator';

export class VisualizationStep implements PipelineStep {
  name = 'Visualization';

  async execute(context: PipelineContext): Promise<void> {
    try {
      console.log('[Visualization] Generating visualization data');

      // Prepare language distribution chart data
      const languageChart = this.generateLanguageChart(context.data.languages || {});

      // Prepare test coverage visualization
      const coverageChart = this.generateCoverageChart(context.data.testCoverage || 0);

      // Prepare complexity distribution chart
      const complexityChart = this.generateComplexityChart(
        context.data.complexity?.distribution || {}
      );

      // Prepare category scores chart
      const categoryChart = this.generateCategoryScoresChart(
        context.data.categoryScores || []
      );

      // Store visualization data
      context.data.visualizations = {
        languageChart,
        coverageChart,
        complexityChart,
        categoryChart,
      };

      console.log('[Visualization] Visualization data generated');

    } catch (error: any) {
      console.error('[Visualization] Generation failed:', error);
      // Don't throw - visualizations are nice-to-have
      context.data.visualizations = {};
    }
  }

  private generateLanguageChart(languages: Record<string, number>): any {
    const data = Object.entries(languages).map(([name, bytes]) => ({
      name,
      value: bytes,
      percentage: 0, // Will be calculated on frontend
    }));

    return {
      type: 'pie',
      data,
      title: 'Language Distribution',
    };
  }

  private generateCoverageChart(coverage: number): any {
    return {
      type: 'progress',
      value: coverage,
      max: 100,
      title: 'Test Coverage',
      color: coverage >= 80 ? 'green' : coverage >= 60 ? 'yellow' : 'red',
    };
  }

  private generateComplexityChart(distribution: Record<string, number>): any {
    const data = Object.entries(distribution).map(([level, count]) => ({
      level,
      count,
    }));

    return {
      type: 'bar',
      data,
      title: 'Code Complexity Distribution',
    };
  }

  private generateCategoryScoresChart(categoryScores: any[]): any {
    const data = categoryScores.map(category => ({
      category: category.category,
      score: category.score,
      maxPoints: category.maxPoints,
      percentage: (category.score / category.maxPoints) * 100,
    }));

    return {
      type: 'bar',
      data,
      title: 'Category Scores',
    };
  }
}
