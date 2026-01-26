import Anthropic from '@anthropic-ai/sdk';
import type {
  CategoryScore,
  Suggestion,
  Grade,
  Metrics
} from '../../../shared/types';
import { ErrorCode, EvaluationError } from '../../../shared/types';

interface ClaudeEvaluationResponse {
  overallScore: number;
  grade: Grade;
  categoryScores: CategoryScore[];
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestions: Suggestion[];
}

interface AnalysisInput {
  repoName: string;
  owner: string;
  repo: string;
  description?: string;
  languages: string[];
  stars: number;
  metrics: Metrics;
  readmeContent?: string;
  sampleCode?: string;
}

export class ClaudeService {
  private client: Anthropic;
  private model: string;

  constructor() {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY not set');
    }

    this.client = new Anthropic({ apiKey });
    this.model = process.env.CLAUDE_MODEL || 'claude-opus-4-5-20251101';
  }

  async evaluateRepository(input: AnalysisInput): Promise<ClaudeEvaluationResponse> {
    const prompt = this.buildEvaluationPrompt(input);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 8000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse JSON response
      const result = this.parseEvaluationResponse(content.text);
      return result;

    } catch (error: any) {
      if (error.status === 429) {
        throw new EvaluationError(
          'Claude API rate limit exceeded',
          ErrorCode.CLAUDE_API_ERROR,
          true
        );
      }

      throw new EvaluationError(
        `Claude API error: ${error.message}`,
        ErrorCode.CLAUDE_API_ERROR,
        false
      );
    }
  }

  async generateArchitectureDiagram(input: AnalysisInput): Promise<string> {
    const prompt = `You are analyzing a GitHub repository to generate a Mermaid architecture diagram.

Repository: ${input.owner}/${input.repo}
Languages: ${input.languages.join(', ')}
${input.description ? `Description: ${input.description}` : ''}

File Structure:
${this.formatFileStructure(input.metrics.fileStructure)}

${input.sampleCode ? `Sample Code:\n${input.sampleCode}` : ''}

Generate a Mermaid diagram that shows:
1. Major components/modules
2. Data flow between components
3. External dependencies
4. Technology stack

Respond ONLY with the Mermaid diagram code (no explanation, no markdown code fences).
Start directly with "graph TD" or similar Mermaid syntax.`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        temperature: 0.5,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return content.text.trim();

    } catch (error: any) {
      console.error('Failed to generate architecture diagram:', error);
      // Return a basic fallback diagram
      return `graph TD
    A[${input.repo}] --> B[Main Components]
    B --> C[${input.languages[0] || 'Code'}]`;
    }
  }

  private buildEvaluationPrompt(input: AnalysisInput): string {
    return `You are a senior software engineer evaluating a GitHub repository.
Provide an objective assessment based on the following data and rubric.

# Repository Information
- Name: ${input.owner}/${input.repo}
- Languages: ${input.languages.join(', ')}
- Stars: ${input.stars}
${input.description ? `- Description: ${input.description}` : ''}

# Code Metrics
- Total Files: ${input.metrics.totalFiles}
- Total Lines: ${input.metrics.totalLines}
- Test Files: ${input.metrics.testFiles}
${input.metrics.testCoverage ? `- Test Coverage: ${input.metrics.testCoverage}%` : ''}
- Average Complexity: ${input.metrics.complexity.average.toFixed(2)}
- Max Complexity: ${input.metrics.complexity.max}

# Language Distribution
${Object.entries(input.metrics.languages)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .map(([lang, bytes]) => `- ${lang}: ${this.formatBytes(bytes)}`)
  .join('\n')}

# Dependencies
${input.metrics.dependencies.slice(0, 10).map(d =>
  `- ${d.name} (${d.version}) - ${d.type}${d.vulnerabilities?.length ? ` - ⚠️ ${d.vulnerabilities.length} vulnerabilities` : ''}`
).join('\n')}

${input.readmeContent ? `# README Content\n${input.readmeContent.substring(0, 2000)}` : ''}

# Evaluation Rubric (Total: 100 points)

## Code Quality (60 points)

### Testing (20 points)
- Test coverage (0-10 pts): Consider test-to-code ratio, coverage percentage
- Test quality and assertions (0-5 pts): Meaningful tests, good assertions
- Edge case coverage (0-5 pts): Tests for error cases, boundary conditions

### Code Organization (15 points)
- Project structure (0-5 pts): Logical directory structure, separation of concerns
- Modularity (0-5 pts): DRY principles, reusable components
- File organization (0-5 pts): Consistent naming, appropriate file sizes

### Documentation (10 points)
- README quality (0-4 pts): Clear setup instructions, usage examples
- Code comments (0-3 pts): Meaningful comments, not over-commented
- API documentation (0-3 pts): Function docs, type definitions

### Performance (10 points)
- Algorithm efficiency (0-5 pts): Appropriate algorithms, time complexity
- Scalability considerations (0-5 pts): Can it handle growth, bottlenecks

### Best Practices (5 points)
- Error handling (0-2 pts): Try-catch, error messages, graceful failures
- Security practices (0-2 pts): Input validation, no hardcoded secrets
- CI/CD setup (0-1 pt): Automated builds, tests, deployments

## Product Quality (40 points)

### Problem Novelty (15 points)
- Uniqueness of problem (0-10 pts): Novel idea vs. common project
- Innovation in approach (0-5 pts): Creative solutions, new techniques

### Real-World Utility (15 points)
- Solves genuine need (0-10 pts): Practical use case, user value
- Production readiness (0-5 pts): Complete features, polished UX

### Technical Difficulty (10 points)
- Problem complexity (0-5 pts): Easy vs. challenging problem domain
- Implementation sophistication (0-5 pts): Technical depth, advanced concepts

# Your Task

Provide a JSON response with the following structure:

{
  "overallScore": <number 0-100>,
  "grade": "<A+|A|A-|B+|B|B-|C+|C|C-|D|F>",
  "categoryScores": [
    {
      "category": "Code Quality",
      "score": <number>,
      "maxPoints": 60,
      "criteria": [
        {
          "name": "Testing",
          "score": <number>,
          "maxPoints": 20,
          "reasoning": "<detailed explanation>",
          "evidence": ["<specific example>"]
        }
      ]
    },
    {
      "category": "Product Quality",
      "score": <number>,
      "maxPoints": 40,
      "criteria": [...]
    }
  ],
  "summary": "<2-3 paragraph overview>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "suggestions": [
    {
      "category": "Testing",
      "priority": "high",
      "title": "<suggestion title>",
      "description": "<detailed description>",
      "expectedImpact": <points improvement>,
      "specificExamples": ["<example>"]
    }
  ]
}

Be objective, specific, and provide concrete evidence for all scores. Respond ONLY with valid JSON.`;
  }

  private parseEvaluationResponse(text: string): ClaudeEvaluationResponse {
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (typeof parsed.overallScore !== 'number' ||
          typeof parsed.grade !== 'string' ||
          !Array.isArray(parsed.categoryScores) ||
          typeof parsed.summary !== 'string') {
        throw new Error('Invalid response structure');
      }

      return parsed as ClaudeEvaluationResponse;
    } catch (error) {
      throw new Error('Failed to parse Claude evaluation response');
    }
  }

  private formatFileStructure(nodes: any[], depth: number = 0): string {
    if (depth > 2) return ''; // Limit depth to avoid huge output

    return nodes
      .slice(0, 20) // Limit to 20 items per level
      .map(node => {
        const indent = '  '.repeat(depth);
        const type = node.type === 'directory' ? '📁' : '📄';
        let result = `${indent}${type} ${node.name}`;

        if (node.children && depth < 2) {
          result += '\n' + this.formatFileStructure(node.children, depth + 1);
        }

        return result;
      })
      .join('\n');
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  private calculateGrade(score: number): Grade {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 60) return 'D';
    return 'F';
  }
}

// Convenience function exports
import { getClaudeService } from './instances';

export async function evaluateRepository(input: AnalysisInput): Promise<ClaudeEvaluationResponse> {
  return getClaudeService().evaluateRepository(input);
}

export async function generateArchitectureDiagram(input: AnalysisInput): Promise<string> {
  return getClaudeService().generateArchitectureDiagram(input);
}
