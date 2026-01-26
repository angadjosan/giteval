// Step 6: Documentation scanning - README, comments, API docs
import { PipelineStep, PipelineContext } from './orchestrator';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class DocumentationScannerStep implements PipelineStep {
  name = 'DocumentationScanner';

  async execute(context: PipelineContext): Promise<void> {
    const { clonePath } = context;

    if (!clonePath) {
      throw new Error('Clone path not found in context');
    }

    try {
      console.log('[DocumentationScanner] Scanning documentation');

      // Analyze README
      const readme = await this.analyzeReadme(clonePath);
      context.data.readme = readme;

      // Count code comments
      const comments = await this.analyzeComments(clonePath);
      context.data.comments = comments;

      // Check for API documentation
      const apiDocs = await this.checkApiDocs(clonePath);
      context.data.apiDocs = apiDocs;

      // Check for additional docs
      const additionalDocs = await this.findAdditionalDocs(clonePath);
      context.data.additionalDocs = additionalDocs;

      console.log('[DocumentationScanner] Scanning complete:', {
        hasReadme: readme.exists,
        readmeQuality: readme.quality,
        commentDensity: `${comments.density}%`,
      });

    } catch (error: any) {
      console.error('[DocumentationScanner] Scanning failed:', error);
      throw new Error(`Documentation scanning failed: ${error.message}`);
    }
  }

  private async analyzeReadme(clonePath: string): Promise<any> {
    try {
      // Look for README files
      const readmePatterns = ['README.md', 'README.MD', 'readme.md', 'README', 'README.txt'];

      for (const pattern of readmePatterns) {
        const readmePath = path.join(clonePath, pattern);
        try {
          const content = await fs.readFile(readmePath, 'utf-8');

          const analysis = {
            exists: true,
            length: content.length,
            wordCount: content.split(/\s+/).length,
            sections: this.extractSections(content),
            quality: this.assessReadmeQuality(content),
            hasInstallation: /install|setup|getting started/i.test(content),
            hasUsage: /usage|example|how to use/i.test(content),
            hasContributing: /contributing|contribute/i.test(content),
            hasLicense: /license/i.test(content),
          };

          return analysis;
        } catch (error) {
          // Try next pattern
        }
      }

      return { exists: false, quality: 'none' };
    } catch (error) {
      return { exists: false, quality: 'none' };
    }
  }

  private extractSections(content: string): string[] {
    const sections: string[] = [];
    const headerRegex = /^#{1,3}\s+(.+)$/gm;
    let match;

    while ((match = headerRegex.exec(content)) !== null) {
      sections.push(match[1].trim());
    }

    return sections;
  }

  private assessReadmeQuality(content: string): string {
    const wordCount = content.split(/\s+/).length;

    // Check for key sections
    let score = 0;
    if (wordCount > 100) score++;
    if (wordCount > 300) score++;
    if (/install|setup/i.test(content)) score++;
    if (/usage|example/i.test(content)) score++;
    if (/api|reference/i.test(content)) score++;
    if (/contributing/i.test(content)) score++;
    if (/license/i.test(content)) score++;

    if (score === 0) return 'minimal';
    if (score <= 2) return 'basic';
    if (score <= 4) return 'good';
    if (score <= 6) return 'excellent';
    return 'comprehensive';
  }

  private async analyzeComments(clonePath: string): Promise<any> {
    try {
      // Find source files
      const { stdout } = await execAsync(
        `find "${clonePath}" -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.py" \\) ! -path "*/node_modules/*" 2>/dev/null | head -100`,
        { timeout: 30000 }
      );

      const files = stdout.trim().split('\n').filter(f => f);

      let totalLines = 0;
      let commentLines = 0;
      let filesWithComments = 0;
      let jsdocCount = 0;

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const lines = content.split('\n');
          totalLines += lines.length;

          // Count comment lines
          for (const line of lines) {
            const trimmed = line.trim();
            if (
              trimmed.startsWith('//') ||
              trimmed.startsWith('/*') ||
              trimmed.startsWith('*') ||
              trimmed.startsWith('#')
            ) {
              commentLines++;
            }
          }

          // Check for JSDoc/docstrings
          const jsdocMatches = content.match(/\/\*\*[\s\S]*?\*\//g);
          if (jsdocMatches) {
            jsdocCount += jsdocMatches.length;
            filesWithComments++;
          }

          // Python docstrings
          const docstringMatches = content.match(/"""[\s\S]*?"""/g);
          if (docstringMatches) {
            jsdocCount += docstringMatches.length;
            filesWithComments++;
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      const density = totalLines > 0 ? Math.round((commentLines / totalLines) * 100) : 0;

      return {
        totalLines,
        commentLines,
        density,
        jsdocCount,
        filesWithComments,
        quality: this.assessCommentQuality(density, jsdocCount),
      };
    } catch (error) {
      console.error('[DocumentationScanner] Comment analysis failed:', error);
      return {
        totalLines: 0,
        commentLines: 0,
        density: 0,
        jsdocCount: 0,
        filesWithComments: 0,
        quality: 'unknown',
      };
    }
  }

  private assessCommentQuality(density: number, jsdocCount: number): string {
    if (density < 5 && jsdocCount === 0) return 'minimal';
    if (density < 10 && jsdocCount < 5) return 'basic';
    if (density < 15 || jsdocCount < 10) return 'good';
    return 'excellent';
  }

  private async checkApiDocs(clonePath: string): Promise<any> {
    try {
      const docPatterns = [
        'docs/api',
        'docs/API',
        'API.md',
        'api.md',
        'docs/reference',
      ];

      const foundDocs: string[] = [];

      for (const pattern of docPatterns) {
        const docPath = path.join(clonePath, pattern);
        try {
          const stats = await fs.stat(docPath);
          if (stats.isFile() || stats.isDirectory()) {
            foundDocs.push(pattern);
          }
        } catch (error) {
          // Doc doesn't exist
        }
      }

      // Check for generated API docs (typedoc, sphinx, etc.)
      try {
        const { stdout } = await execAsync(
          `find "${clonePath}" -type d \\( -name "docs" -o -name "documentation" \\) 2>/dev/null | head -5`,
          { timeout: 10000 }
        );

        const docDirs = stdout.trim().split('\n').filter(d => d);
        foundDocs.push(...docDirs);
      } catch (error) {
        // No doc directories
      }

      return {
        exists: foundDocs.length > 0,
        paths: foundDocs,
      };
    } catch (error) {
      return { exists: false, paths: [] };
    }
  }

  private async findAdditionalDocs(clonePath: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync(
        `find "${clonePath}" -maxdepth 2 -type f \\( -name "CONTRIBUTING.md" -o -name "CHANGELOG.md" -o -name "LICENSE" -o -name "CODE_OF_CONDUCT.md" \\) 2>/dev/null`,
        { timeout: 10000 }
      );

      return stdout
        .trim()
        .split('\n')
        .filter(f => f)
        .map(f => path.basename(f));
    } catch (error) {
      return [];
    }
  }
}
