// Step 3: Static analysis - language detection, file structure
import { PipelineStep, PipelineContext } from './orchestrator';
import { getLanguageDistribution } from '../services/github';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export class StaticAnalysisStep implements PipelineStep {
  name = 'StaticAnalysis';

  async execute(context: PipelineContext): Promise<void> {
    const { owner, repo, clonePath } = context;

    if (!clonePath) {
      throw new Error('Clone path not found in context');
    }

    try {
      console.log('[StaticAnalysis] Analyzing file structure and languages');

      // Get language distribution from GitHub API
      const languages = await getLanguageDistribution(owner, repo);
      context.data.languages = languages;

      // Count lines of code by language
      const linesByLanguage = await this.countLinesByLanguage(clonePath);
      context.data.linesByLanguage = linesByLanguage;

      // Build file structure tree
      const fileStructure = await this.buildFileStructure(clonePath);
      context.data.fileStructure = fileStructure;

      // Get total line count
      const totalLines = await this.getTotalLineCount(clonePath);
      context.data.totalLines = totalLines;

      // Identify project type
      const projectType = await this.identifyProjectType(clonePath);
      context.data.projectType = projectType;

      console.log('[StaticAnalysis] Analysis complete:', {
        languages: Object.keys(languages).join(', '),
        totalLines,
        projectType,
      });

    } catch (error: any) {
      console.error('[StaticAnalysis] Analysis failed:', error);
      throw new Error(`Static analysis failed: ${error.message}`);
    }
  }

  private async countLinesByLanguage(clonePath: string): Promise<Record<string, number>> {
    try {
      const extensionMap: Record<string, string> = {
        '.js': 'JavaScript',
        '.jsx': 'JavaScript',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript',
        '.py': 'Python',
        '.java': 'Java',
        '.go': 'Go',
        '.rb': 'Ruby',
        '.php': 'PHP',
        '.c': 'C',
        '.cpp': 'C++',
        '.cs': 'C#',
        '.rs': 'Rust',
        '.swift': 'Swift',
      };

      const linesByLanguage: Record<string, number> = {};

      for (const [ext, lang] of Object.entries(extensionMap)) {
        try {
          const { stdout } = await execAsync(
            `find "${clonePath}" -name "*${ext}" -type f -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}'`,
            { timeout: 30000 }
          );

          const lines = parseInt(stdout.trim() || '0', 10);
          if (lines > 0) {
            linesByLanguage[lang] = lines;
          }
        } catch (error) {
          // Skip if no files found for this extension
        }
      }

      return linesByLanguage;
    } catch (error) {
      console.error('[StaticAnalysis] Failed to count lines by language:', error);
      return {};
    }
  }

  private async getTotalLineCount(clonePath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `find "${clonePath}" -type f -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.py" -o -name "*.java" -o -name "*.go" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}'`,
        { timeout: 30000 }
      );

      return parseInt(stdout.trim() || '0', 10);
    } catch (error) {
      console.error('[StaticAnalysis] Failed to count total lines:', error);
      return 0;
    }
  }

  private async buildFileStructure(clonePath: string): Promise<any[]> {
    try {
      // Get directory tree structure (limited depth)
      const { stdout } = await execAsync(
        `cd "${clonePath}" && find . -maxdepth 3 -type f -o -type d | head -100`,
        { timeout: 30000 }
      );

      const paths = stdout.trim().split('\n').filter(p => p && p !== '.');

      return paths.map(p => ({
        path: p.replace('./', ''),
        type: p.endsWith('/') ? 'directory' : 'file',
      }));
    } catch (error) {
      console.error('[StaticAnalysis] Failed to build file structure:', error);
      return [];
    }
  }

  private async identifyProjectType(clonePath: string): Promise<string> {
    try {
      // Check for common project files
      const files = await fs.readdir(clonePath);

      if (files.includes('package.json')) return 'Node.js/JavaScript';
      if (files.includes('requirements.txt') || files.includes('setup.py')) return 'Python';
      if (files.includes('pom.xml') || files.includes('build.gradle')) return 'Java';
      if (files.includes('go.mod')) return 'Go';
      if (files.includes('Cargo.toml')) return 'Rust';
      if (files.includes('Package.swift')) return 'Swift';
      if (files.includes('Gemfile')) return 'Ruby';
      if (files.includes('composer.json')) return 'PHP';
      if (files.includes('CMakeLists.txt')) return 'C/C++';

      return 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  }
}
