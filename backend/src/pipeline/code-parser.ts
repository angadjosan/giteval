// Step 4: Code parsing - AST analysis and complexity metrics
import { PipelineStep, PipelineContext } from './orchestrator';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export class CodeParserStep implements PipelineStep {
  name = 'CodeParser';

  async execute(context: PipelineContext): Promise<void> {
    const { clonePath } = context;

    if (!clonePath) {
      throw new Error('Clone path not found in context');
    }

    try {
      console.log('[CodeParser] Parsing code and calculating complexity metrics');

      // Analyze code complexity
      const complexity = await this.analyzeComplexity(clonePath);
      context.data.complexity = complexity;

      // Extract functions and classes (simplified)
      const codeStats = await this.extractCodeStats(clonePath);
      context.data.codeStats = codeStats;

      // Analyze imports and dependencies
      const dependencies = await this.analyzeDependencies(clonePath);
      context.data.projectDependencies = dependencies;

      console.log('[CodeParser] Parsing complete:', {
        avgComplexity: complexity.average,
        functions: codeStats.functions,
        classes: codeStats.classes,
      });

    } catch (error: any) {
      console.error('[CodeParser] Parsing failed:', error);
      throw new Error(`Code parsing failed: ${error.message}`);
    }
  }

  private async analyzeComplexity(clonePath: string): Promise<any> {
    try {
      // Simple complexity estimation based on code patterns
      // In production, use proper AST parsing with Tree-sitter or similar

      const jsFiles = await this.findFiles(clonePath, ['.js', '.ts', '.jsx', '.tsx']);
      let totalComplexity = 0;
      let maxComplexity = 0;
      const distribution: Record<string, number> = {
        simple: 0,
        moderate: 0,
        complex: 0,
      };

      for (const file of jsFiles.slice(0, 50)) { // Sample first 50 files
        try {
          const content = await fs.readFile(file, 'utf-8');
          const complexity = this.estimateComplexity(content);

          totalComplexity += complexity;
          maxComplexity = Math.max(maxComplexity, complexity);

          if (complexity < 5) distribution.simple++;
          else if (complexity < 10) distribution.moderate++;
          else distribution.complex++;
        } catch (error) {
          // Skip files that can't be read
        }
      }

      const average = jsFiles.length > 0 ? totalComplexity / Math.min(jsFiles.length, 50) : 0;

      return {
        average: Math.round(average * 10) / 10,
        max: maxComplexity,
        distribution,
      };
    } catch (error) {
      console.error('[CodeParser] Complexity analysis failed:', error);
      return { average: 0, max: 0, distribution: {} };
    }
  }

  private estimateComplexity(content: string): number {
    // Simple cyclomatic complexity estimation
    let complexity = 1; // Base complexity

    // Count control flow statements
    const patterns = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?/g, // Ternary operators
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private async extractCodeStats(clonePath: string): Promise<any> {
    try {
      const jsFiles = await this.findFiles(clonePath, ['.js', '.ts', '.jsx', '.tsx']);

      let functionCount = 0;
      let classCount = 0;
      let totalFileSize = 0;

      for (const file of jsFiles.slice(0, 100)) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          totalFileSize += content.length;

          // Count functions (simple pattern matching)
          const functionMatches = content.match(/\bfunction\s+\w+|const\s+\w+\s*=\s*\(|^\s*\w+\s*\(/gm);
          if (functionMatches) functionCount += functionMatches.length;

          // Count classes
          const classMatches = content.match(/\bclass\s+\w+/g);
          if (classMatches) classCount += classMatches.length;
        } catch (error) {
          // Skip files that can't be read
        }
      }

      return {
        functions: functionCount,
        classes: classCount,
        avgFileSize: jsFiles.length > 0 ? Math.round(totalFileSize / Math.min(jsFiles.length, 100)) : 0,
      };
    } catch (error) {
      console.error('[CodeParser] Code stats extraction failed:', error);
      return { functions: 0, classes: 0, avgFileSize: 0 };
    }
  }

  private async analyzeDependencies(clonePath: string): Promise<any> {
    try {
      // Check for package.json (Node.js)
      const packageJsonPath = path.join(clonePath, 'package.json');
      try {
        const content = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(content);

        const dependencies = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        return {
          count: Object.keys(dependencies).length,
          list: Object.keys(dependencies).slice(0, 20), // Top 20
        };
      } catch (error) {
        // No package.json found
      }

      // Check for requirements.txt (Python)
      const requirementsPath = path.join(clonePath, 'requirements.txt');
      try {
        const content = await fs.readFile(requirementsPath, 'utf-8');
        const deps = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

        return {
          count: deps.length,
          list: deps.slice(0, 20),
        };
      } catch (error) {
        // No requirements.txt found
      }

      return { count: 0, list: [] };
    } catch (error) {
      console.error('[CodeParser] Dependency analysis failed:', error);
      return { count: 0, list: [] };
    }
  }

  private async findFiles(clonePath: string, extensions: string[]): Promise<string[]> {
    try {
      const extPattern = extensions.map(ext => `-name "*${ext}"`).join(' -o ');
      const { stdout } = await execAsync(
        `find "${clonePath}" -type f \\( ${extPattern} \\) 2>/dev/null`,
        { timeout: 30000 }
      );

      return stdout.trim().split('\n').filter(f => f);
    } catch (error) {
      return [];
    }
  }
}
