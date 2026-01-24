# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitEval is a repository evaluation platform that analyzes GitHub repositories and provides comprehensive scoring, insights, and architecture diagrams. The system uses AI (Claude API) to evaluate code quality and product quality, generating shareable reports at `giteval.com/owner/repo`.

**Key Features:**
- Repository evaluation with scores out of 100
- AI-powered code quality analysis
- Architecture diagram generation
- Caching system (Redis + Supabase)
- User profile evaluation (aggregates all repos for a user)

## Architecture

### Monorepo Structure

This is a monorepo with separate frontend and backend:

```
/frontend    - Next.js 14+ (App Router) application
/backend     - Analysis pipeline and services (Node.js/TypeScript)
/supabase    - Database configuration
```

### Frontend (Next.js)

- **Framework:** Next.js 14+ with App Router
- **Styling:** TailwindCSS 4
- **Visualizations:** Recharts for charts, Mermaid.js for architecture diagrams
- **Key Dependencies:** `react-hot-toast`, `lucide-react`, `clsx`

**Routing:**
- `/` - Landing page with repository input form
- `/[owner]/[repo]` - Repository evaluation report
- `/[username]` - User profile evaluation
- `/api/evaluate` - POST endpoint to start evaluation
- `/api/evaluation/[id]` - GET endpoint for evaluation status
- `/api/report/[owner]/[repo]` - GET endpoint for cached reports
- `/api/user-profile` - POST endpoint for user profile evaluation

**Components:**
- All UI components are in `/frontend/components/` (currently stubs)
- Types are defined in `/frontend/lib/types.ts`
- Utilities in `/frontend/lib/utils.ts`

### Backend (Analysis Pipeline)

The backend implements a multi-step analysis pipeline in `/backend/src/pipeline/`:

**Pipeline Steps (in order):**
1. `cache-check.ts` - Check if evaluation exists in cache
2. `clone.ts` - Clone repository to temporary directory
3. `static-analysis.ts` - Language detection, file structure
4. `code-parser.ts` - AST parsing using Tree-sitter
5. `test-analyzer.ts` - Test detection and coverage analysis
6. `documentation-scanner.ts` - README and documentation analysis
7. `security-scanner.ts` - Basic vulnerability detection
8. `metrics-collector.ts` - Aggregate all metrics
9. `ai-evaluator.ts` - Claude API evaluation
10. `architecture-diagram.ts` - Generate Mermaid diagram
11. `visualization.ts` - Generate charts and graphs
12. `report-assembly.ts` - Assemble final report
13. `cache-storage.ts` - Store results in cache
14. `cleanup.ts` - Remove temporary files

**Services:**
- `github.ts` - GitHub API integration
- `claude.ts` - Claude API for AI evaluation
- `cache.ts` - Redis cache service
- `supabase.ts` - Database operations

### Caching Strategy

Three-layer cache system:
1. **Redis (Hot Cache)** - 24 hour TTL, format: `eval:${owner}:${repo}:${commitSha}`
2. **Supabase (Warm Cache)** - Persistent storage, indexed by owner/repo/commitSha
3. **CDN (Edge Cache)** - 1 hour TTL for rendered pages

Cache key always includes commit SHA to ensure evaluations are tied to specific code versions.

### Evaluation Rubric

**Code Quality (60 points):**
- Testing (20 pts) - Coverage, quality, edge cases
- Code Organization (15 pts) - Structure, modularity, separation of concerns
- Documentation (10 pts) - README, comments, API docs
- Performance (10 pts) - Algorithm efficiency, scalability
- Best Practices (5 pts) - Error handling, security, CI/CD

**Product Quality (40 points):**
- Problem Novelty (15 pts) - Uniqueness of problem
- Real-World Utility (15 pts) - Solves genuine need, production-ready
- Technical Difficulty (10 pts) - Problem complexity, implementation sophistication

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

### Backend

```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start development server (when implemented)
npm test             # Run tests (not yet implemented)
```

### Supabase

The project uses Supabase for database. Configuration is in `/supabase/config.toml`.

**IMPORTANT** if you EVER want to make a migration. Please run supabase migration new. Do not try to make a migration in any other way.

**Database Schema:**
- `evaluations` - Stores repository evaluation results
- `category_scores` - Detailed score breakdowns by category
- `user_profiles` - User profile evaluations
- `jobs` - Async job queue for processing

## Key Implementation Patterns

### Pipeline Context

The analysis pipeline uses a shared context object passed between steps:

```typescript
interface PipelineContext {
  job: any;
  owner: string;
  repo: string;
  data: Record<string, any>;  // Accumulates results from each step
}
```

Each pipeline step:
1. Reads from `context.data` (results from previous steps)
2. Performs its analysis
3. Writes results back to `context.data`
4. Updates job progress in database

### Parallel Processing

Steps 3-7 (static analysis, code parsing, test analysis, documentation scanning, security scanning) can run in parallel since they have no interdependencies. The optimized pipeline should use `Promise.all()` to run these concurrently.

### Error Handling

All pipeline steps should:
- Throw typed errors with error codes (see `ErrorCode` enum in TDD.md)
- Mark recoverable errors appropriately
- Update job status to 'failed' with error message on unrecoverable errors
- Clean up temporary resources in finally blocks

### Anti-Gaming Mechanisms

The evaluation should detect and penalize:
- Auto-generated test files with low assertion quality
- Copy-pasted boilerplate code
- Suspicious commit patterns
- Over-documentation of obvious code
- README claims not matching actual implementation

## Environment Variables

Required environment variables:

```bash
# GitHub
GITHUB_TOKEN=<personal access token>

# Claude API
CLAUDE_API_KEY=<api key>
CLAUDE_MODEL=claude-opus-4-5-20251101

# Database
SUPABASE_URL=<project url>
SUPABASE_KEY=<service role key>

# Cache
REDIS_URL=<redis connection string>

# Storage (for cloned repos)
GCS_BUCKET=giteval-repos
```

## Important Design Decisions

1. **Commit SHA as Cache Key:** Always include commit SHA in cache lookups to ensure evaluations match specific code versions. Never cache by URL alone.

2. **No Code Storage:** The system should never permanently store repository code - only clone temporarily, analyze, then delete. Only metadata and analysis results are stored.

3. **Size Limits:** Repositories are limited to 1GB max size and 10,000 files. Analysis timeout is 5 minutes max.

4. **Prompt Design:** The Claude API evaluation uses a structured prompt with detailed rubric (see TDD.md lines 582-686). Always request JSON responses with specific schema for parsing.

5. **Progress Updates:** Update job progress after each pipeline step so users can see real-time progress during the 30-60 second analysis.

6. **Component Stubs:** Most frontend components and all backend pipeline steps are currently empty stubs. Implementation should follow the interfaces and patterns documented in TDD.md.

## Project Status

This is an early-stage project with:
- Project structure and architecture defined (PRD.md, TDD.md, STRUCTURE.md)
- Frontend scaffolding in place (Next.js app router, empty components)
- Backend structure defined (pipeline steps, services as stubs)
- Supabase configuration initialized
- **No actual implementation yet** - all files are stubs or TODOs

When implementing features:
1. Follow the evaluation rubric defined in PRD.md
2. Implement pipeline steps in the order they execute
3. Use TypeScript interfaces from TDD.md (lines 292-410)
4. Maintain the three-layer caching strategy
5. Test with real GitHub repositories to validate analysis accuracy
