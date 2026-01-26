// Step 5: Test analysis - detect tests, analyze coverage and quality
import { PipelineStep, PipelineContext } from './orchestrator';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export class TestAnalyzerStep implements PipelineStep {
  name = 'TestAnalyzer';

  async execute(context: PipelineContext): Promise<void> {
    const { clonePath } = context;

    if (!clonePath) {
      throw new Error('Clone path not found in context');
    }

    try {
      console.log('[TestAnalyzer] Analyzing tests');

      // Find test files
      const testFiles = await this.findTestFiles(clonePath);
      context.data.testFiles = testFiles;

      // Analyze test quality
      const testQuality = await this.analyzeTestQuality(clonePath, testFiles);
      context.data.testQuality = testQuality;

      // Estimate test coverage
      const coverage = await this.estimateCoverage(clonePath, testFiles);
      context.data.testCoverage = coverage;

      // Identify test frameworks
      const frameworks = await this.identifyTestFrameworks(clonePath);
      context.data.testFrameworks = frameworks;

      console.log('[TestAnalyzer] Analysis complete:', {
        testFiles: testFiles.length,
        frameworks,
        estimatedCoverage: `${coverage}%`,
      });

    } catch (error: any) {
      console.error('[TestAnalyzer] Analysis failed:', error);
      throw new Error(`Test analysis failed: ${error.message}`);
    }
  }

  private async findTestFiles(clonePath: string): Promise<string[]> {
    try {
      // Common test file patterns
      const patterns = [
        '*.test.js',
        '*.test.ts',
        '*.spec.js',
        '*.spec.ts',
        '*.test.jsx',
        '*.test.tsx',
        '*.spec.jsx',
        '*.spec.tsx',
        '*_test.py',
        '*_test.go',
        '*Test.java',
      ];

      const findCommands = patterns.map(
        pattern => `find "${clonePath}" -name "${pattern}" -type f 2>/dev/null`
      );

      const results = await Promise.all(
        findCommands.map(async cmd => {
          try {
            const { stdout } = await execAsync(cmd, { timeout: 30000 });
            return stdout.trim().split('\n').filter(f => f);
          } catch (error) {
            return [];
          }
        })
      );

      // Also check for __tests__ directories
      try {
        const { stdout } = await execAsync(
          `find "${clonePath}" -type d -name "__tests__" 2>/dev/null`,
          { timeout: 30000 }
        );

        const testDirs = stdout.trim().split('\n').filter(d => d);

        for (const dir of testDirs) {
          try {
            const { stdout: files } = await execAsync(
              `find "${dir}" -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \\) 2>/dev/null`,
              { timeout: 30000 }
            );
            results.push(files.trim().split('\n').filter(f => f));
          } catch (error) {
            // Skip if no files found
          }
        }
      } catch (error) {
        // No __tests__ directories
      }

      return results.flat();
    } catch (error) {
      console.error('[TestAnalyzer] Failed to find test files:', error);
      return [];
    }
  }

  private async analyzeTestQuality(clonePath: string, testFiles: string[]): Promise<any> {
    try {
      let totalAssertions = 0;
      let totalTests = 0;
      let filesAnalyzed = 0;

      for (const file of testFiles.slice(0, 50)) { // Sample first 50 test files
        try {
          const content = await fs.readFile(file, 'utf-8');

          // Count test cases
          const testMatches = content.match(/\b(it|test|describe)\s*\(/g);
          if (testMatches) totalTests += testMatches.length;

          // Count assertions
          const assertionPatterns = [
            /\bexpect\s*\(/g,
            /\bassert/g,
            /\.should\./g,
            /\.toBe\(/g,
            /\.toEqual\(/g,
            /\.toHaveBeenCalled/g,
          ];

          for (const pattern of assertionPatterns) {
            const matches = content.match(pattern);
            if (matches) totalAssertions += matches.length;
          }

          filesAnalyzed++;
        } catch (error) {
          // Skip files that can't be read
        }
      }

      const avgAssertionsPerTest = totalTests > 0 ? totalAssertions / totalTests : 0;

      return {
        totalTests,
        totalAssertions,
        avgAssertionsPerTest: Math.round(avgAssertionsPerTest * 10) / 10,
        filesAnalyzed,
        quality: this.assessTestQuality(avgAssertionsPerTest, totalTests),
      };
    } catch (error) {
      console.error('[TestAnalyzer] Test quality analysis failed:', error);
      return {
        totalTests: 0,
        totalAssertions: 0,
        avgAssertionsPerTest: 0,
        filesAnalyzed: 0,
        quality: 'unknown',
      };
    }
  }

  private assessTestQuality(avgAssertions: number, totalTests: number): string {
    if (totalTests === 0) return 'none';
    if (avgAssertions < 1) return 'poor';
    if (avgAssertions < 2) return 'fair';
    if (avgAssertions < 3) return 'good';
    return 'excellent';
  }

  private async estimateCoverage(clonePath: string, testFiles: string[]): Promise<number> {
    try {
      // Simple estimation: ratio of test files to source files
      const sourceFiles = await this.countSourceFiles(clonePath);
      const testFileCount = testFiles.length;

      if (sourceFiles === 0) return 0;

      // Rough estimate: assume each test file covers 2-3 source files
      const estimatedCoverage = Math.min(100, (testFileCount * 2.5 / sourceFiles) * 100);

      return Math.round(estimatedCoverage);
    } catch (error) {
      return 0;
    }
  }

  private async countSourceFiles(clonePath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `find "${clonePath}" -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.py" -o -name "*.java" -o -name "*.go" \\) ! -path "*/node_modules/*" ! -path "*/test/*" ! -path "*/__tests__/*" ! -name "*.test.*" ! -name "*.spec.*" 2>/dev/null | wc -l`,
        { timeout: 30000 }
      );

      return parseInt(stdout.trim() || '0', 10);
    } catch (error) {
      return 0;
    }
  }

  private async identifyTestFrameworks(clonePath: string): Promise<string[]> {
    try {
      const frameworks: string[] = [];

      // Check package.json for test frameworks
      const packageJsonPath = path.join(clonePath, 'package.json');
      try {
        const content = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(content);

        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        const frameworkMap: Record<string, string> = {
          'jest': 'Jest',
          'mocha': 'Mocha',
          'jasmine': 'Jasmine',
          'vitest': 'Vitest',
          'cypress': 'Cypress',
          'playwright': 'Playwright',
          'pytest': 'Pytest',
          'unittest': 'unittest',
        };

        for (const [dep, framework] of Object.entries(frameworkMap)) {
          if (allDeps[dep]) {
            frameworks.push(framework);
          }
        }
      } catch (error) {
        // No package.json
      }

      // Check for Python test frameworks
      const requirementsPath = path.join(clonePath, 'requirements.txt');
      try {
        const content = await fs.readFile(requirementsPath, 'utf-8');
        if (content.includes('pytest')) frameworks.push('Pytest');
        if (content.includes('unittest')) frameworks.push('unittest');
      } catch (error) {
        // No requirements.txt
      }

      return frameworks.length > 0 ? frameworks : ['Unknown'];
    } catch (error) {
      return ['Unknown'];
    }
  }
}
