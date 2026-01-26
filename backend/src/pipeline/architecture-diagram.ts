// Step 10: Architecture diagram generation using Claude
import { PipelineStep, PipelineContext } from './orchestrator';
import { generateArchitectureDiagram } from '../services/claude';

export class ArchitectureDiagramStep implements PipelineStep {
  name = 'ArchitectureDiagram';

  async execute(context: PipelineContext): Promise<void> {
    const { owner, repo } = context;

    try {
      console.log('[ArchitectureDiagram] Generating architecture diagram');

      // Prepare context for diagram generation
      const diagramContext = {
        owner,
        repo,
        projectType: context.data.projectType,
        languages: context.data.languages,
        fileStructure: context.data.fileStructure,
        dependencies: context.data.projectDependencies,
        metadata: context.data.repositoryMetadata,
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
    const projectType = context.data.projectType || 'Application';
    const languages = Object.keys(context.data.languages || {}).join(', ') || 'Multiple';

    return `graph TD
    A[${projectType}] --> B[${languages}]
    B --> C[Source Code]
    B --> D[Tests]
    C --> E[Build Output]`;
  }
}
