// Step 7: Security scanning - vulnerability detection and security issues
import { PipelineStep, PipelineContext } from './orchestrator';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SecurityScannerStep implements PipelineStep {
  name = 'SecurityScanner';

  async execute(context: PipelineContext): Promise<void> {
    const { clonePath } = context;

    if (!clonePath) {
      throw new Error('Clone path not found in context');
    }

    try {
      console.log('[SecurityScanner] Scanning for security issues');

      // Scan for hardcoded secrets
      const secrets = await this.scanForSecrets(clonePath);
      context.data.secrets = secrets;

      // Check for common vulnerabilities
      const vulnerabilities = await this.checkVulnerabilities(clonePath);
      context.data.vulnerabilities = vulnerabilities;

      // Check dependency security
      const depSecurity = await this.checkDependencySecurity(clonePath);
      context.data.dependencySecurity = depSecurity;

      // Check for common security issues in code
      const codeIssues = await this.scanCodeSecurityIssues(clonePath);
      context.data.securityIssues = codeIssues;

      const totalIssues =
        secrets.found.length +
        vulnerabilities.length +
        codeIssues.length;

      console.log('[SecurityScanner] Scanning complete:', {
        secrets: secrets.found.length,
        vulnerabilities: vulnerabilities.length,
        codeIssues: codeIssues.length,
        totalIssues,
      });

    } catch (error: any) {
      console.error('[SecurityScanner] Scanning failed:', error);
      throw new Error(`Security scanning failed: ${error.message}`);
    }
  }

  private async scanForSecrets(clonePath: string): Promise<any> {
    try {
      const secretPatterns = [
        { name: 'API Key', pattern: /api[_-]?key["\s:=]+[a-zA-Z0-9]{20,}/gi },
        { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g },
        { name: 'Private Key', pattern: /-----BEGIN (RSA |)PRIVATE KEY-----/g },
        { name: 'Password', pattern: /password["\s:=]+[^\s"]{8,}/gi },
        { name: 'Secret', pattern: /secret["\s:=]+[a-zA-Z0-9]{20,}/gi },
        { name: 'Token', pattern: /token["\s:=]+[a-zA-Z0-9]{20,}/gi },
      ];

      const found: any[] = [];

      // Get source files (exclude node_modules, .git, etc.)
      const { stdout } = await execAsync(
        `find "${clonePath}" -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.env*" -o -name "*.yml" -o -name "*.yaml" \\) ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null | head -200`,
        { timeout: 30000 }
      );

      const files = stdout.trim().split('\n').filter(f => f);

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');

          for (const { name, pattern } of secretPatterns) {
            const matches = content.match(pattern);
            if (matches) {
              // Don't include the actual secret value
              found.push({
                type: name,
                file: path.relative(clonePath, file),
                count: matches.length,
              });
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      return {
        found,
        severity: found.length > 0 ? 'high' : 'none',
      };
    } catch (error) {
      console.error('[SecurityScanner] Secret scanning failed:', error);
      return { found: [], severity: 'none' };
    }
  }

  private async checkVulnerabilities(clonePath: string): Promise<any[]> {
    try {
      const vulnerabilities: any[] = [];

      // Check for common vulnerability patterns
      const vulnPatterns = [
        {
          name: 'SQL Injection Risk',
          pattern: /query.*\+.*|execute.*\+.*|sql.*\+.*/gi,
          severity: 'high',
        },
        {
          name: 'XSS Risk',
          pattern: /innerHTML|dangerouslySetInnerHTML/gi,
          severity: 'medium',
        },
        {
          name: 'Command Injection Risk',
          pattern: /exec\(.*\+|system\(.*\+|eval\(/gi,
          severity: 'high',
        },
        {
          name: 'Insecure Random',
          pattern: /Math\.random\(\)/gi,
          severity: 'low',
        },
      ];

      const { stdout } = await execAsync(
        `find "${clonePath}" -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.py" \\) ! -path "*/node_modules/*" ! -path "*/test/*" 2>/dev/null | head -100`,
        { timeout: 30000 }
      );

      const files = stdout.trim().split('\n').filter(f => f);

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');

          for (const { name, pattern, severity } of vulnPatterns) {
            const matches = content.match(pattern);
            if (matches) {
              vulnerabilities.push({
                name,
                severity,
                file: path.relative(clonePath, file),
                count: matches.length,
              });
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      return vulnerabilities;
    } catch (error) {
      console.error('[SecurityScanner] Vulnerability check failed:', error);
      return [];
    }
  }

  private async checkDependencySecurity(clonePath: string): Promise<any> {
    try {
      // Check if npm audit exists (for Node.js projects)
      const packageJsonPath = path.join(clonePath, 'package.json');
      try {
        await fs.access(packageJsonPath);

        // Check if package-lock.json exists
        const packageLockPath = path.join(clonePath, 'package-lock.json');
        try {
          await fs.access(packageLockPath);

          // Run npm audit (if npm is available)
          try {
            const { stdout } = await execAsync(`cd "${clonePath}" && npm audit --json 2>/dev/null`, {
              timeout: 60000,
            });

            const auditResult = JSON.parse(stdout);

            return {
              scanned: true,
              vulnerabilities: auditResult.metadata?.vulnerabilities || {},
              total: auditResult.metadata?.total || 0,
            };
          } catch (error) {
            // npm audit failed or not available
            return { scanned: false, note: 'npm audit not available' };
          }
        } catch (error) {
          return { scanned: false, note: 'package-lock.json not found' };
        }
      } catch (error) {
        // Not a Node.js project
      }

      // Check for Python projects
      const requirementsPath = path.join(clonePath, 'requirements.txt');
      try {
        await fs.access(requirementsPath);
        // Could run safety check here if available
        return { scanned: false, note: 'Python project - automated scan not available' };
      } catch (error) {
        // Not a Python project
      }

      return { scanned: false, note: 'No supported dependency manager found' };
    } catch (error) {
      console.error('[SecurityScanner] Dependency security check failed:', error);
      return { scanned: false, error: error.message };
    }
  }

  private async scanCodeSecurityIssues(clonePath: string): Promise<any[]> {
    try {
      const issues: any[] = [];

      // Check for insecure configurations
      const configChecks = [
        {
          file: '.env',
          issue: 'Environment file in repository',
          severity: 'high',
        },
        {
          file: '.env.production',
          issue: 'Production environment file in repository',
          severity: 'critical',
        },
        {
          file: 'config/credentials.yml',
          issue: 'Credentials file in repository',
          severity: 'high',
        },
      ];

      for (const { file, issue, severity } of configChecks) {
        const filePath = path.join(clonePath, file);
        try {
          await fs.access(filePath);
          issues.push({
            type: 'Insecure Configuration',
            issue,
            severity,
            file,
          });
        } catch (error) {
          // File doesn't exist - that's good
        }
      }

      // Check for missing security headers (in web apps)
      const { stdout } = await execAsync(
        `find "${clonePath}" -type f \\( -name "*.js" -o -name "*.ts" \\) ! -path "*/node_modules/*" 2>/dev/null | head -50`,
        { timeout: 30000 }
      );

      const files = stdout.trim().split('\n').filter(f => f);

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');

          // Check for CORS misconfiguration
          if (content.includes('Access-Control-Allow-Origin') && content.includes('*')) {
            issues.push({
              type: 'CORS Misconfiguration',
              issue: 'Overly permissive CORS policy',
              severity: 'medium',
              file: path.relative(clonePath, file),
            });
          }

          // Check for disabled security features
          if (content.includes('helmet') && content.includes('false')) {
            issues.push({
              type: 'Security Feature Disabled',
              issue: 'Security headers disabled',
              severity: 'medium',
              file: path.relative(clonePath, file),
            });
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      return issues;
    } catch (error) {
      console.error('[SecurityScanner] Code security scan failed:', error);
      return [];
    }
  }
}
