# Technical Design Document: GitEval

**Version:** 1.0
**Last Updated:** January 2026
**Status:** Draft

## System Architecture Overview

GitEval is a repository evaluation platform that analyzes GitHub repositories and provides comprehensive scoring and insights. The system follows a request-response architecture with background job processing for repository analysis.

### High-Level Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────────────┐
│     Google App Engine (Next.js)     │
│  ┌────────────┐    ┌─────────────┐ │
│  │  Frontend  │    │  API Routes │ │
│  │   (RSC)    │◄───┤  (Backend)  │ │
│  └────────────┘    └──────┬──────┘ │
└────────────────────────────┼────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │  GitHub  │      │  Claude  │      │  Redis   │
    │   API    │      │   API    │      │  Cache   │
    └──────────┘      └──────────┘      └──────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │   Supabase   │
                      │  PostgreSQL  │
                      └──────────────┘
```

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI**: React Server Components + Client Components
- **Styling**: TailwindCSS
- **Visualizations**: Recharts for charts, Mermaid.js for diagrams
- **State Management**: React Context + URL state

### Backend
- **Runtime**: Node.js on Google App Engine
- **Framework**: Next.js API Routes
- **Language**: TypeScript
- **Code Analysis**: Tree-sitter for AST parsing
- **Job Queue**: In-memory queue with persistent backing

### Infrastructure
- **Hosting**: Google App Engine (Standard or Flexible environment)
- **Database**: Supabase (PostgreSQL)
- **Cache**: Redis (Google Cloud Memorystore or Redis Labs)
- **Storage**: Google Cloud Storage (for cloned repos)
- **CDN**: Google Cloud CDN

### External APIs
- **GitHub API**: Repository data, metadata, commit history
- **Claude API**: AI-powered code evaluation and insights

## Component Design

### 1. Frontend Layer

#### Pages
```typescript
/app
  /page.tsx                    // Landing page with input form
  /[owner]/[repo]/page.tsx     // Repository evaluation report
  /[username]/page.tsx         // User profile evaluation
  /api/                        // API routes
```

#### Key Components
- **EvaluationForm**: Input for GitHub URLs, validation, submission
- **ScoreDisplay**: Overall score with grade and visual indicators
- **CategoryBreakdown**: Detailed score breakdown by category
- **ArchitectureDiagram**: Interactive Mermaid diagram renderer
- **InsightsList**: Improvement recommendations and suggestions
- **MetricsVisualization**: Charts for language distribution, test coverage, etc.
- **SharePanel**: Social sharing, PDF export, badge generation

### 2. API Layer

#### Endpoints

**POST /api/evaluate**
```typescript
Request:
{
  url: string;  // github.com/owner/repo
  force?: boolean;  // bypass cache
}

Response:
{
  evaluationId: string;
  cached: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  redirectUrl: string;  // /owner/repo
}
```

**GET /api/evaluation/[id]**
```typescript
Response:
{
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;  // 0-100
  evaluation?: Evaluation;  // full evaluation object when completed
  error?: string;
}
```

**GET /api/report/[owner]/[repo]**
```typescript
Response: Evaluation | null
```

**POST /api/user-profile**
```typescript
Request:
{
  username: string;
}

Response:
{
  profileId: string;
  repositoryCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}
```

### 3. Analysis Pipeline

#### Core Modules

**RepositoryCloner**
- Clones repository to temporary directory in Cloud Storage
- Handles authentication for public repos
- Enforces size limits (max 1GB)
- Cleanup after analysis

**StaticAnalyzer**
- Language detection (GitHub Linguist)
- File structure analysis
- Line counting
- Dependency extraction (package.json, requirements.txt, go.mod, etc.)

**CodeParser**
- AST generation using Tree-sitter
- Complexity metrics (cyclomatic complexity)
- Function/class extraction
- Import/dependency graph

**TestAnalyzer**
- Test file detection (patterns: *.test.*, *.spec.*, __tests__/*)
- Test framework identification
- Assertion counting
- Coverage report parsing (if available)

**DocumentationScanner**
- README analysis (structure, completeness)
- Code comment extraction
- JSDoc/docstring detection
- API documentation presence

**SecurityScanner**
- Pattern matching for common vulnerabilities
- Dependency vulnerability check via GitHub API
- Sensitive data detection (hardcoded secrets, API keys)
- OWASP top 10 basic checks

**MetricsCollector**
- Aggregates all analysis data
- Normalizes scores
- Prepares data for AI evaluation

**AIEvaluator**
- Sends structured data to Claude API
- Uses detailed rubric for scoring
- Generates summary and insights
- Produces architecture diagram description

**ReportGenerator**
- Assembles all components into final report
- Generates visualizations
- Creates shareable format
- Stores in database

## Data Models

### Database Schema (Supabase/PostgreSQL)

```sql
-- Evaluations table
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_url TEXT NOT NULL,
  owner TEXT NOT NULL,
  repo TEXT NOT NULL,
  commit_sha TEXT NOT NULL,

  -- Scores
  overall_score DECIMAL(5,2) NOT NULL,
  grade VARCHAR(3) NOT NULL,
  code_quality_score DECIMAL(5,2) NOT NULL,
  product_quality_score DECIMAL(5,2) NOT NULL,

  -- Analysis results
  summary TEXT,
  strengths JSONB,
  improvements JSONB,
  suggestions JSONB,

  -- Visualizations
  architecture_diagram TEXT,
  metrics JSONB,

  -- Metadata
  metadata JSONB,

  -- Timestamps
  evaluated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Caching
  cached BOOLEAN DEFAULT FALSE,

  -- Composite unique constraint for cache lookup
  UNIQUE(owner, repo, commit_sha)
);

CREATE INDEX idx_evaluations_owner_repo ON evaluations(owner, repo);
CREATE INDEX idx_evaluations_commit_sha ON evaluations(commit_sha);
CREATE INDEX idx_evaluations_evaluated_at ON evaluations(evaluated_at DESC);

-- Category scores table
CREATE TABLE category_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  max_points INTEGER NOT NULL,
  criteria JSONB NOT NULL
);

CREATE INDEX idx_category_scores_evaluation ON category_scores(evaluation_id);

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  overall_score DECIMAL(5,2),
  repository_count INTEGER,
  analysis JSONB,
  evaluated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- Job queue table (for async processing)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,  -- 'repository' | 'user_profile'
  payload JSONB NOT NULL,
  status TEXT NOT NULL,  -- 'pending' | 'processing' | 'completed' | 'failed'
  progress INTEGER DEFAULT 0,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
```

### TypeScript Interfaces

```typescript
interface Evaluation {
  id: string;
  repositoryUrl: string;
  owner: string;
  repo: string;
  commitSha: string;

  overallScore: number;
  grade: Grade;
  codeQualityScore: number;
  productQualityScore: number;

  summary: string;
  strengths: string[];
  improvements: string[];
  suggestions: Suggestion[];

  architectureDiagram: string;
  metrics: Metrics;
  metadata: RepositoryMetadata;

  evaluatedAt: Date;
  cached: boolean;
}

type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';

interface CategoryScore {
  category: string;
  score: number;
  maxPoints: number;
  criteria: CriterionScore[];
}

interface CriterionScore {
  name: string;
  score: number;
  maxPoints: number;
  reasoning: string;
  evidence: string[];
}

interface Suggestion {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: number;
  specificExamples: string[];
}

interface Metrics {
  languages: Record<string, number>;
  totalLines: number;
  totalFiles: number;
  testFiles: number;
  testCoverage?: number;
  dependencies: Dependency[];
  fileStructure: FileNode[];
  complexity: {
    average: number;
    max: number;
    distribution: Record<string, number>;
  };
}

interface Dependency {
  name: string;
  version: string;
  type: 'production' | 'development';
  vulnerabilities?: Vulnerability[];
}

interface Vulnerability {
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  fixAvailable: boolean;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
}

interface RepositoryMetadata {
  languages: string[];
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  lastUpdated: Date;
  license?: string;
  contributors: Contributor[];
  topics: string[];
}

interface Contributor {
  username: string;
  contributions: number;
  avatarUrl: string;
}

interface Job {
  id: string;
  type: 'repository' | 'user_profile';
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
```

## Caching Strategy

### Three-Layer Cache

**Layer 1: Redis (Hot Cache)**
- TTL: 24 hours
- Key format: `eval:${owner}:${repo}:${commitSha}`
- Stores complete evaluation JSON
- Fast lookup for recent evaluations

**Layer 2: Database (Warm Cache)**
- Persistent storage
- Indexed by owner, repo, commit SHA
- Serves as source of truth
- No automatic expiration

**Layer 3: CDN (Edge Cache)**
- Caches rendered report pages
- TTL: 1 hour
- Cache key includes commit SHA
- Invalidated on new evaluations

### Cache Invalidation

```typescript
async function getCachedEvaluation(
  owner: string,
  repo: string,
  commitSha: string
): Promise<Evaluation | null> {
  // Check Redis first
  const redisKey = `eval:${owner}:${repo}:${commitSha}`;
  const cached = await redis.get(redisKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Check database
  const dbResult = await supabase
    .from('evaluations')
    .select('*')
    .eq('owner', owner)
    .eq('repo', repo)
    .eq('commit_sha', commitSha)
    .single();

  if (dbResult.data) {
    // Populate Redis
    await redis.set(redisKey, JSON.stringify(dbResult.data), 'EX', 86400);
    return dbResult.data;
  }

  return null;
}
```

## Analysis Pipeline Implementation

### Pipeline Orchestrator

```typescript
class AnalysisPipeline {
  private steps: PipelineStep[] = [
    new CacheCheckStep(),
    new RepositoryCloneStep(),
    new StaticAnalysisStep(),
    new CodeParsingStep(),
    new TestAnalysisStep(),
    new DocumentationScanStep(),
    new SecurityScanStep(),
    new MetricsCollectionStep(),
    new AIEvaluationStep(),
    new ArchitectureDiagramStep(),
    new VisualizationStep(),
    new ReportAssemblyStep(),
    new CacheStorageStep(),
    new CleanupStep(),
  ];

  async execute(job: Job): Promise<Evaluation> {
    const context: PipelineContext = {
      job,
      owner: job.payload.owner,
      repo: job.payload.repo,
      data: {},
    };

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];

      try {
        await step.execute(context);

        // Update progress
        const progress = Math.floor(((i + 1) / this.steps.length) * 100);
        await this.updateJobProgress(job.id, progress);

      } catch (error) {
        await this.handleStepFailure(job.id, step.name, error);
        throw error;
      }
    }

    return context.data.evaluation;
  }
}

interface PipelineStep {
  name: string;
  execute(context: PipelineContext): Promise<void>;
}

interface PipelineContext {
  job: Job;
  owner: string;
  repo: string;
  data: Record<string, any>;
}
```

### Parallel Processing Optimization

```typescript
class OptimizedAnalysisPipeline extends AnalysisPipeline {
  async execute(job: Job): Promise<Evaluation> {
    const context = this.initContext(job);

    // Step 1: Cache check (sequential)
    await new CacheCheckStep().execute(context);
    if (context.data.cached) {
      return context.data.evaluation;
    }

    // Step 2: Clone repository (sequential)
    await new RepositoryCloneStep().execute(context);

    // Step 3-7: Run analysis in parallel
    await Promise.all([
      new StaticAnalysisStep().execute(context),
      new CodeParsingStep().execute(context),
      new TestAnalysisStep().execute(context),
      new DocumentationScanStep().execute(context),
      new SecurityScanStep().execute(context),
    ]);

    // Step 8: Collect metrics (depends on previous steps)
    await new MetricsCollectionStep().execute(context);

    // Step 9-10: AI processing (can be parallel)
    await Promise.all([
      new AIEvaluationStep().execute(context),
      new ArchitectureDiagramStep().execute(context),
    ]);

    // Step 11-14: Finalization (sequential)
    await new VisualizationStep().execute(context);
    await new ReportAssemblyStep().execute(context);
    await new CacheStorageStep().execute(context);
    await new CleanupStep().execute(context);

    return context.data.evaluation;
  }
}
```

## AI Evaluation Prompt Design

### Structured Prompt Template

```typescript
const EVALUATION_PROMPT = `You are a senior software engineer evaluating a GitHub repository.
Provide an objective assessment based on the following data and rubric.

# Repository Information
- Name: {repo_name}
- Languages: {languages}
- Stars: {stars}
- Description: {description}

# Code Metrics
{code_metrics}

# Test Analysis
{test_analysis}

# Documentation
{documentation_analysis}

# Security Scan Results
{security_findings}

# Rubric (Total: 100 points)

## Code Quality (60 points)

### Testing (20 points)
- Test coverage (0-10 pts)
- Test quality and assertions (0-5 pts)
- Edge case coverage (0-5 pts)

### Code Organization (15 points)
- Project structure (0-5 pts)
- Modularity and separation of concerns (0-5 pts)
- File organization (0-5 pts)

### Documentation (10 points)
- README quality (0-4 pts)
- Code comments (0-3 pts)
- API documentation (0-3 pts)

### Performance (10 points)
- Algorithm efficiency (0-5 pts)
- Scalability considerations (0-5 pts)

### Best Practices (5 points)
- Error handling (0-2 pts)
- Security practices (0-2 pts)
- CI/CD setup (0-1 pt)

## Product Quality (40 points)

### Problem Novelty (15 points)
- Uniqueness of problem (0-10 pts)
- Innovation in approach (0-5 pts)

### Real-World Utility (15 points)
- Solves genuine need (0-10 pts)
- Production readiness (0-5 pts)

### Technical Difficulty (10 points)
- Problem complexity (0-5 pts)
- Implementation sophistication (0-5 pts)

# Your Task

Provide a JSON response with the following structure:
{
  "overallScore": <number 0-100>,
  "grade": "<letter grade>",
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
          "evidence": ["<specific example>", ...]
        },
        ...
      ]
    },
    ...
  ],
  "summary": "<2-3 paragraph overview>",
  "strengths": ["<strength 1>", ...],
  "improvements": ["<improvement 1>", ...],
  "suggestions": [
    {
      "category": "<category>",
      "priority": "<high|medium|low>",
      "title": "<suggestion title>",
      "description": "<detailed description>",
      "expectedImpact": <points improvement>,
      "specificExamples": ["<example>", ...]
    },
    ...
  ]
}

Be objective, specific, and provide concrete evidence for all scores.`;
```

## Deployment Architecture

### Google App Engine Configuration

**app.yaml**
```yaml
runtime: nodejs20
instance_class: F4  # Or F4_1G for more memory

env_variables:
  NODE_ENV: "production"
  GITHUB_TOKEN: "secret"
  CLAUDE_API_KEY: "secret"
  REDIS_URL: "secret"
  SUPABASE_URL: "secret"
  SUPABASE_KEY: "secret"

automatic_scaling:
  target_cpu_utilization: 0.65
  min_instances: 1
  max_instances: 20
  min_pending_latency: 30ms
  max_pending_latency: automatic
  max_concurrent_requests: 10

handlers:
  - url: /.*
    script: auto
    secure: always
    redirect_http_response_code: 301
```

### Environment Variables

```bash
# GitHub
GITHUB_TOKEN=<personal access token>
GITHUB_API_URL=https://api.github.com

# Claude API
CLAUDE_API_KEY=<api key>
CLAUDE_MODEL=claude-opus-4-5-20251101

# Database
SUPABASE_URL=<project url>
SUPABASE_KEY=<service role key>

# Cache
REDIS_URL=<redis connection string>

# Storage
GCS_BUCKET=giteval-repos

# App
BASE_URL=https://giteval.com
NODE_ENV=production
```

## Security Considerations

### API Security
- Rate limiting per IP (100 requests/hour for unauthenticated)
- API key authentication for programmatic access
- CORS policy for web requests
- Input validation and sanitization

### Repository Analysis Security
- Sandbox cloned repositories (separate container/VM)
- Timeout limits on analysis (max 5 minutes)
- Size limits (max 1GB repository size)
- No code execution from analyzed repositories
- Scan for malware before analysis

### Data Security
- HTTPS only
- Encrypted database connections
- No storage of repository code (only metadata)
- PII handling compliance
- Secrets detection and redaction

## Scalability & Performance

### Optimization Strategies

**Repository Size Limits**
- Max size: 1GB
- Max files: 10,000
- Timeout: 5 minutes per analysis

**Analysis Parallelization**
- Independent steps run concurrently
- Worker pool for CPU-intensive tasks
- Streaming results to reduce memory

**Database Optimization**
- Indexes on common queries
- Connection pooling
- Read replicas for report serving

**Caching Strategy**
- Redis for hot data (24hr TTL)
- Database for persistence
- CDN for static assets and pages

### Load Handling

**Horizontal Scaling**
- App Engine auto-scaling based on CPU
- Multiple instances handle concurrent requests
- Job queue prevents resource exhaustion

**Rate Limiting**
- Per-IP limits for anonymous users
- Authenticated users get higher limits
- Queue system for burst traffic

## Error Handling

### Error Categories

```typescript
class EvaluationError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public recoverable: boolean = false
  ) {
    super(message);
  }
}

enum ErrorCode {
  // User errors
  INVALID_URL = 'invalid_url',
  REPOSITORY_NOT_FOUND = 'repository_not_found',
  REPOSITORY_TOO_LARGE = 'repository_too_large',
  PRIVATE_REPOSITORY = 'private_repository',

  // System errors
  GITHUB_API_ERROR = 'github_api_error',
  CLAUDE_API_ERROR = 'claude_api_error',
  DATABASE_ERROR = 'database_error',
  CACHE_ERROR = 'cache_error',

  // Processing errors
  CLONE_FAILED = 'clone_failed',
  ANALYSIS_TIMEOUT = 'analysis_timeout',
  PARSING_ERROR = 'parsing_error',

  // Internal errors
  UNKNOWN_ERROR = 'unknown_error',
}
```

### Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  backoff: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      if (!isRetryable(error)) throw error;

      await sleep(backoff * Math.pow(2, i));
    }
  }
  throw new Error('Max retries exceeded');
}

function isRetryable(error: any): boolean {
  // Network errors, rate limits, timeouts are retryable
  return (
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    error.status === 429 ||
    error.status === 503
  );
}
```

## Monitoring & Observability

### Metrics to Track

**Application Metrics**
- Evaluations per hour/day
- Cache hit rate
- Average analysis duration
- Error rate by type
- API response times

**Infrastructure Metrics**
- CPU usage
- Memory usage
- Database connections
- Redis operations/sec
- Network I/O

**Business Metrics**
- Unique repositories evaluated
- User retention
- Share rate
- Most evaluated repositories

### Logging Strategy

```typescript
interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context: {
    evaluationId?: string;
    owner?: string;
    repo?: string;
    step?: string;
    duration?: number;
    error?: any;
  };
}

class Logger {
  log(entry: LogEntry) {
    // Send to Google Cloud Logging
    console.log(JSON.stringify(entry));
  }

  trackEvaluation(evaluationId: string, step: string, duration: number) {
    this.log({
      timestamp: new Date(),
      level: 'info',
      message: 'Pipeline step completed',
      context: { evaluationId, step, duration },
    });
  }
}
```

### Alerting

- Error rate > 5% (critical)
- Analysis duration > 120s (warning)
- Cache miss rate > 80% (warning)
- API rate limit approaching (warning)
- Database connection pool exhausted (critical)

## API Rate Limits & Quotas

### GitHub API
- Authenticated: 5,000 requests/hour
- Strategy: Cache metadata aggressively, use conditional requests

### Claude API
- Per account limits (varies by plan)
- Strategy: Batch requests where possible, use caching

### Internal Quotas
- Anonymous users: 5 evaluations/hour
- Authenticated users: 50 evaluations/hour
- Repository size: 1GB max
- Analysis timeout: 5 minutes max

## Future Technical Considerations

### Potential Improvements
- **Microservices**: Split analysis pipeline into separate services
- **Message Queue**: Use Cloud Pub/Sub for job queue
- **Kubernetes**: Move from App Engine to GKE for more control
- **Multi-region**: Deploy to multiple regions for lower latency
- **ML Model**: Train custom model for code quality prediction
- **Webhook Integration**: GitHub webhooks for automatic re-evaluation

### Technical Debt to Avoid
- Don't skip database migrations
- Don't hardcode configuration
- Don't skip integration tests
- Don't ignore security updates
- Don't accumulate unused dependencies
