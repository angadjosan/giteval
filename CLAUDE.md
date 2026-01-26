# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitEval is a repository evaluation platform that analyzes GitHub repositories and provides comprehensive scoring, insights, and architecture diagrams. The system uses AI (Claude API) to evaluate code quality and product quality, generating shareable reports at `giteval.com/owner/repo`.

**Key Features:**
- Repository evaluation with scores out of 100 (graded A+ to F)
- AI-powered code quality analysis using Claude Opus 4.5
- Architecture diagram generation (Mermaid.js)
- Three-layer caching system (Redis + Supabase + CDN)
- User profile evaluation (aggregates all repos for a user)
- Real-time progress tracking during analysis

## Architecture

### Monorepo Structure

This is a TypeScript monorepo with separate frontend and backend:

```
/frontend    - Next.js 14+ (App Router) application
/backend     - Analysis pipeline and services (Node.js/TypeScript)
/shared      - Shared TypeScript type definitions
/supabase    - Database configuration and migrations
```

### Tech Stack

**Frontend:**
- Next.js 16.1.4 with App Router
- React 19.2.3
- TypeScript 5
- TailwindCSS 4
- Recharts (data visualization)
- Mermaid.js (architecture diagrams)
- Supabase client
- React Hot Toast (notifications)
- Lucide React (icons)

**Backend:**
- Node.js with Express 5
- TypeScript 5
- Anthropic SDK (Claude API)
- Redis (hot cache)
- Supabase/PostgreSQL (persistent storage)
- Simple Git (repository cloning)

**External APIs:**
- GitHub API (repository data)
- Claude API (AI evaluation)

### Frontend (Next.js)

**Status:** Substantially implemented with working UI components

**Routing:**
- `/` - Landing page with hero, features, how-it-works, evaluation criteria
- `/[owner]/[repo]` - Repository evaluation report (skeleton structure)
- `/[username]` - User profile evaluation (skeleton structure)
- `/api/evaluate` - POST endpoint to start evaluation
- `/api/evaluation/[id]` - GET endpoint for evaluation status polling
- `/api/report/[owner]/[repo]` - GET endpoint for cached reports
- `/api/user-profile` - POST endpoint for user profile evaluation

**Components** (`/frontend/components/`):
All components are fully implemented:
- `EvaluationForm.tsx` - Repository URL input with validation and examples
- `ScoreDisplay.tsx` - Overall score and grade visualization
- `CategoryBreakdown.tsx` - Detailed category scores
- `ArchitectureDiagram.tsx` - Mermaid diagram renderer
- `InsightsList.tsx` - Strengths and improvements
- `MetricsVisualization.tsx` - Charts and graphs (Recharts)
- `RepositoryMetadata.tsx` - Repository stats and info
- `SharePanel.tsx` - Social sharing functionality
- `ScrollToTopButton.tsx` - UX enhancement

**Utilities:**
- `/frontend/lib/types.ts` - Frontend-specific type definitions (mirrors shared types)
- `/frontend/lib/utils.ts` - Utility functions (clsx wrapper)

### Backend (Analysis Pipeline)

**Status:** Fully implemented with all 14 pipeline steps

The backend implements a sequential analysis pipeline orchestrated by `/backend/src/pipeline/orchestrator.ts` (203 lines).

**Pipeline Steps** (`/backend/src/pipeline/`):

1. **cache-check.ts** (50 lines) - Check Redis and Supabase for cached evaluation
2. **clone.ts** (82 lines) - Clone repository with size/file limits (1GB, 10k files)
3. **static-analysis.ts** (154 lines) - Language detection, line counts, file structure
4. **code-parser.ts** (208 lines) - AST analysis, complexity metrics, dependency extraction
5. **test-analyzer.ts** (258 lines) - Test detection, coverage analysis, quality assessment
6. **documentation-scanner.ts** (261 lines) - README analysis, comment parsing, documentation quality
7. **security-scanner.ts** (303 lines) - Vulnerability detection, hardcoded secret scanning
8. **metrics-collector.ts** (81 lines) - Aggregate all metrics from previous steps
9. **ai-evaluator.ts** (59 lines) - Claude API evaluation with detailed rubric
10. **architecture-diagram.ts** (61 lines) - Generate Mermaid architecture diagram
11. **visualization.ts** (95 lines) - Generate chart data for frontend
12. **report-assembly.ts** (83 lines) - Assemble final evaluation report
13. **cache-storage.ts** (52 lines) - Store results in Redis and Supabase
14. **cleanup.ts** (47 lines) - Remove temporary cloned repository

**Services** (`/backend/src/services/`):

All services are fully implemented and accessed via singleton pattern through `/backend/src/instances.ts`:

- **github.ts** - GitHub API integration
  - Repository data fetching
  - Commit SHA retrieval
  - Language distribution
  - Contributor data
  - URL parsing (supports multiple formats)
  - Repository size validation

- **claude.ts** - Claude API integration
  - Repository evaluation with structured rubric
  - Architecture diagram generation
  - JSON response parsing and validation
  - Uses claude-opus-4-5-20251101 model

- **cache.ts** - Redis caching
  - 24-hour TTL for evaluations
  - Job progress tracking
  - Key format: `eval:${owner}:${repo}:${commitSha}`

- **supabase.ts** (DatabaseService) - PostgreSQL operations
  - Evaluation storage and retrieval
  - Category scores management
  - User profile management
  - Job queue operations
  - Database-to-TypeScript type conversion

**Database** (`/backend/src/db/`):
- `supabase.ts` - Database service implementation with type conversions

### Shared Types (`/shared/types.ts`)

Comprehensive TypeScript type definitions shared between frontend and backend:

**Core Types:**
- `Evaluation` - Complete evaluation result
- `CategoryScore` - Category-level scores (Testing, Code Organization, etc.)
- `CriterionScore` - Individual criterion within a category
- `Suggestion` - Improvement recommendations with priority and impact
- `Metrics` - Code metrics (languages, lines, files, complexity, dependencies)
- `RepositoryMetadata` - GitHub repository information
- `UserProfile` - User evaluation aggregation
- `Job` - Async job tracking with progress
- `Grade` - Letter grades (A+ to F)

**Supporting Types:**
- `Dependency` - Package dependency with vulnerabilities
- `Vulnerability` - Security vulnerability data
- `FileNode` - File structure tree
- `Contributor` - Repository contributor
- `ErrorCode` - Structured error handling enum

**API Types:**
- Request/Response types for all endpoints
- Database conversion types for Supabase

### Evaluation Rubric

**Code Quality (60 points):**
- **Testing (20 pts)** - Coverage, quality, edge cases, anti-gaming detection
- **Code Organization (15 pts)** - Structure, modularity, separation of concerns
- **Documentation (10 pts)** - README quality, comments, API docs
- **Performance (10 pts)** - Algorithm efficiency, scalability considerations
- **Best Practices (5 pts)** - Error handling, security, CI/CD setup

**Product Quality (40 points):**
- **Problem Novelty (15 pts)** - Uniqueness of problem being solved
- **Real-World Utility (15 pts)** - Solves genuine need, production-ready
- **Technical Difficulty (10 pts)** - Problem complexity, implementation sophistication

**Anti-Gaming Mechanisms:**
The AI evaluator detects and penalizes:
- Auto-generated test files with low assertion quality
- Copy-pasted boilerplate code
- Suspicious commit patterns (e.g., massive test file dumps)
- Over-documentation of trivial code
- README claims not matching actual implementation

### Caching Strategy

Three-layer cache system:

1. **Redis (Hot Cache)**
   - 24 hour TTL
   - Key format: `eval:${owner}:${repo}:${commitSha}`
   - Fastest lookup for recent evaluations

2. **Supabase (Warm Cache)**
   - Persistent storage in PostgreSQL
   - Indexed by owner/repo/commitSha
   - Fallback when Redis expires

3. **CDN (Edge Cache)**
   - Planned for production deployment
   - 1 hour TTL for rendered pages
   - Not yet implemented

**Important:** Cache keys always include commit SHA to ensure evaluations are tied to specific code versions.

## Development Commands

### Frontend

```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

**Environment Variables** (`.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### Backend

```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start Express server on port 3001
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled JavaScript
```

**Environment Variables** (`.env`):
```bash
# GitHub API
GITHUB_TOKEN=<personal-access-token>
GITHUB_API_URL=https://api.github.com

# Claude API
CLAUDE_API_KEY=<anthropic-api-key>
CLAUDE_MODEL=claude-opus-4-5-20251101

# Database
SUPABASE_URL=<project-url>
SUPABASE_KEY=<service-role-key>

# Cache
REDIS_URL=<redis-connection-string>

# Limits
MAX_REPO_SIZE=1073741824      # 1GB in bytes
MAX_FILE_COUNT=10000
ANALYSIS_TIMEOUT=300000        # 5 minutes in ms
CLONE_TIMEOUT=60000           # 1 minute in ms

# Server
PORT=3001
```

### Supabase

**IMPORTANT:** Always use Supabase CLI for migrations.

```bash
# Create a new migration
supabase migration new <migration_name>

# Apply migrations locally
supabase db reset

# Push to production
supabase db push
```

Configuration is in `/supabase/config.toml`.

**Database Schema:**
- `evaluations` - Repository evaluation results
- `category_scores` - Detailed score breakdowns by category
- `user_profiles` - User profile evaluations
- `jobs` - Async job queue with progress tracking

## Key Implementation Patterns

### Pipeline Context

The analysis pipeline uses a shared context object passed through all steps:

```typescript
interface PipelineContext {
  job: any;              // Job from database with progress tracking
  owner: string;         // Repository owner
  repo: string;          // Repository name
  data: Record<string, any>;  // Accumulates results from each step
}
```

**Pipeline Flow:**
1. Each step reads from `context.data` (results from previous steps)
2. Performs its specific analysis
3. Writes results back to `context.data`
4. Updates job progress in database
5. Returns updated context to next step

### Parallel Processing

The orchestrator provides two execution modes:

- **Sequential** (`execute()`): Steps run one after another
- **Optimized** (`executeOptimized()`): Steps 3-7 run in parallel via `Promise.all()`

Steps 3-7 can run concurrently since they have no interdependencies:
- Static Analysis
- Code Parser
- Test Analyzer
- Documentation Scanner
- Security Scanner

This reduces total analysis time by ~40%.

### Singleton Services

All services are instantiated once and exported from `/backend/src/instances.ts`:

```typescript
export const githubService = new GitHubService();
export const claudeService = new ClaudeService();
export const cacheService = new CacheService();
export const databaseService = new DatabaseService();
```

Pipeline steps and API routes import these singletons rather than creating new instances.

### Error Handling

All pipeline steps follow consistent error handling:

```typescript
try {
  // Step logic
  return context;
} catch (error) {
  // Log error
  // Update job status to 'failed'
  // Re-throw for orchestrator to handle
  throw error;
} finally {
  // Clean up resources if needed
}
```

Errors use the `ErrorCode` enum from shared types:
- `GITHUB_API_ERROR`
- `CLONE_FAILED`
- `REPOSITORY_TOO_LARGE`
- `ANALYSIS_TIMEOUT`
- `CLAUDE_API_ERROR`
- etc.

### Type Safety

The project maintains strict type safety:
- Shared types in `/shared/types.ts`
- Database types converted to application types via helper functions
- All API requests/responses typed
- No `any` types except in `context.data` accumulator

## Important Design Decisions

### 1. Commit SHA as Cache Key
Always include commit SHA in cache lookups to ensure evaluations match specific code versions. Never cache by URL alone. If a repository is updated, the new commit gets a fresh evaluation.

### 2. No Code Storage
The system never permanently stores repository code. The flow is:
1. Clone to temporary directory
2. Analyze
3. Delete clone
4. Store only metadata and analysis results

This ensures we don't violate repository licenses and keeps storage costs minimal.

### 3. Size Limits
Hard limits to prevent abuse and ensure reasonable analysis times:
- **Repository size**: 1GB max
- **File count**: 10,000 files max
- **Analysis timeout**: 5 minutes max
- **Clone timeout**: 1 minute max

These are enforced in the clone step and configurable via environment variables.

### 4. Prompt Engineering
The Claude API evaluation uses a detailed structured prompt with:
- Complete evaluation rubric with point values
- Anti-gaming detection requirements
- JSON schema for response format
- Specific examples and evidence requirements

See `/backend/src/services/claude.ts` for the full prompt.

### 5. Progress Updates
Job progress is updated after each pipeline step (0-100%):
- 0%: Job created
- 10%: Cache checked
- 20%: Repository cloned
- 30-70%: Analysis steps
- 80%: AI evaluation
- 90%: Report assembly
- 100%: Complete

This provides real-time feedback during the 30-60 second analysis.

### 6. Gradual Fallback
When fetching evaluations:
1. Check Redis first (fastest)
2. If miss, check Supabase
3. If found in Supabase, backfill Redis
4. If miss completely, return null (trigger new evaluation)

## Project Status

**Implementation Status:**

✅ **Fully Implemented:**
- All 14 backend pipeline steps
- All 4 core services (GitHub, Claude, Cache, Database)
- Frontend landing page with full UI
- All 9 UI components
- Shared type system
- Database schema and migrations
- Three-layer caching strategy
- Error handling framework
- Pipeline orchestrator with parallel optimization

⚠️ **Partially Implemented:**
- Dynamic report pages (`/[owner]/[repo]` skeleton exists)
- User profile evaluation (`/[username]` skeleton exists)
- Some advanced visualization features
- CDN/edge caching layer

📋 **Not Yet Implemented:**
- Production deployment configuration
- Rate limiting and abuse prevention
- Email notifications
- Webhook support for automatic re-evaluation
- Public API for third-party integrations

## Git Workflow

**Current Branch:** main

**Recent Commits:**
- `65f0cb5` - Add keys + clean up
- `0201d85` - Phase 3: Frontend implementation
- `da1ac77` - Phase 2: Backend analysis pipeline implementation
- `a4f531e` - Phase 1: Core infrastructure
- `3ea7625` - Supabase initialization

**Modified Files (uncommitted):**
- `backend/src/db/supabase.ts`
- `backend/src/pipeline/orchestrator.ts`
- `backend/src/services/cache.ts`
- `backend/src/services/claude.ts`
- `backend/src/services/github.ts`
- `shared/` (new directory)

## Testing Strategy

**Current Status:** No automated tests yet

**Recommended Approach:**
1. Unit tests for services (GitHub, Claude, Cache, Database)
2. Integration tests for pipeline steps
3. End-to-end tests for full evaluation flow
4. Mock external APIs (GitHub, Claude) in tests
5. Use real repositories for validation testing

**Test Repositories:**
Consider testing against well-known repos with varying quality:
- High quality: `facebook/react`, `microsoft/vscode`
- Medium quality: Popular but imperfect projects
- Low quality: Minimal repos, tutorial projects

## Performance Considerations

**Current Performance:**
- Sequential pipeline: ~60-90 seconds
- Optimized pipeline: ~40-60 seconds (40% faster)
- Most time spent in: Clone (10-20s), AI evaluation (15-25s), Code parsing (5-10s)

**Optimization Opportunities:**
1. Parallel execution of independent steps (✅ implemented)
2. Incremental clones (shallow clone with depth=1)
3. Selective file parsing (skip node_modules, etc.)
4. Response streaming for long-running evaluations
5. Background job queue for async processing

## Security Considerations

**Secrets Scanning:**
The security scanner detects hardcoded secrets but does NOT extract or store them. It only reports their presence.

**API Key Protection:**
- GitHub token: Read-only access, public repos only
- Claude API key: Rate-limited, monitored for abuse
- Supabase service key: Backend only, never exposed to frontend

**Repository Safety:**
- Clones are isolated to temporary directories
- No code execution from evaluated repositories
- Size limits prevent resource exhaustion
- Timeouts prevent hanging operations

## Deployment

**Planned Architecture:**
- Frontend: Vercel (Next.js native deployment)
- Backend: Railway or Render (Node.js hosting)
- Database: Supabase (managed PostgreSQL)
- Cache: Upstash Redis (serverless Redis)
- CDN: Cloudflare (edge caching)

**Environment Setup:**
See "Environment Variables" sections above for required configuration.

## Troubleshooting

**Common Issues:**

1. **Clone fails**: Check GitHub token permissions, repository size, network connectivity
2. **Claude API errors**: Verify API key, check rate limits, ensure model name is correct
3. **Cache misses**: Verify Redis connection, check TTL configuration
4. **Database errors**: Check Supabase connection, verify migrations are applied
5. **Frontend build fails**: Ensure all environment variables are set, check Node.js version

**Debugging:**
- Backend logs to console (consider adding structured logging)
- Frontend uses React Hot Toast for user-facing errors
- Check job status in database for pipeline failures
- Monitor Redis for cache hit rates
