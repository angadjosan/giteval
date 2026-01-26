// Step 10: Architecture diagram generation using Claude
import { PipelineStep, PipelineContext } from './orchestrator';
import { generateArchitectureDiagram } from '../services/claude';
import type { Metrics, RepositoryMetadata } from '../../../shared/types';

export class ArchitectureDiagramStep implements PipelineStep {
  name = 'ArchitectureDiagram';

  async execute(context: PipelineContext): Promise<void> {
    const { owner, repo } = context;

    try {
      console.log('[ArchitectureDiagram] Generating architecture diagram');

      const metadata = context.data.repositoryMetadata as RepositoryMetadata;
      const metrics = context.data.metrics as Metrics;

      if (!metadata || !metrics) {
        throw new Error('Missing metadata or metrics for diagram generation');
      }

      // Prepare context for diagram generation
      const diagramContext = {
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

      // Generate Mermaid diagram using Claude
      const diagram = await generateArchitectureDiagram(diagramContext);

      context.data.architectureDiagram = diagram;

      console.log('[ArchitectureDiagram] Diagram generated successfully');

    } catch (error: any) {
      console.error('[ArchitectureDiagram] Generation failed:', error);
      // Don't throw - architecture diagram is nice-to-have, not critical
      context.data.architectureDiagram = this.generateFallbackDiagram(context);
      console.log('[ArchitectureDiagram] Using fallback diagram');
    }
  }

  private generateFallbackDiagram(context: PipelineContext): string {
    // Generate a simple fallback diagram
    const metadata = context.data.repositoryMetadata as RepositoryMetadata | undefined;
    const languages = metadata?.languages.join(', ') || 'Multiple';

    return `graph TD
    A[${context.repo}] --> B[${languages}]
    B --> C[Source Code]
    B --> D[Tests]
    C --> E[Build Output]`;
  }
}
