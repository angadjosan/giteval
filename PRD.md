# Product Requirements Document: GitEval

## Overview

GitEval is a tool for evaluating GitHub repositories. Users input a repository URL and receive an AI-powered assessment with a score out of 100, architecture diagrams, and actionable insights.

**URL Structure:**
- Repository: `github.com/user/repo` → `giteval.com/user/repo`
- User Profile (Premium): `github.com/username` → `giteval.com/username`

## Problem Statement

Evaluating a GitHub repository manually is time-consuming. You need to understand the code structure, test coverage, architecture, documentation quality, and overall code quality. GitEval automates this process, providing an objective, comprehensive evaluation in seconds.

## Core Value Proposition

**For Repository Owners:**
- Get objective feedback on your code quality
- Identify areas for improvement
- Showcase your work with shareable evaluation reports

**For Reviewers:**
- Quickly assess repository quality before diving deep
- Understand architecture and code structure at a glance
- Make informed decisions about using or contributing to a project

## Core Feature: Repository Evaluation

### Input
- GitHub repository URL: `github.com/user/repo`
- Output: `giteval.com/user/repo` (shareable evaluation report)

### Caching
- Previously evaluated repositories are cached
- Cache key: repository URL + commit SHA
- Cached results served instantly (no re-analysis needed)
- Cache invalidated when repository receives new commits

### Evaluation Process

1. **Cache Check**: If repository was evaluated recently with same commit SHA, return cached result
2. **Repository Analysis**: Clone and analyze codebase
3. **AI Evaluation**: AI agent evaluates repository and provides score out of 100
4. **Report Generation**: Create shareable report with visualizations and insights
5. **Cache Storage**: Store results for future requests

### What Gets Evaluated

**Code Quality (60 points):**
- Testing (20 pts): Test coverage, quality, edge cases
- Code Organization (15 pts): Structure, modularity, separation of concerns
- Documentation (10 pts): README, comments, API docs, setup instructions
- Performance (10 pts): Algorithm efficiency, bottlenecks, scalability
- Best Practices (5 pts): Error handling, security, type safety, CI/CD

**Product Quality (40 points):**
- Problem Novelty (15 pts): Unique or interesting problem being solved
- Real-World Utility (15 pts): Solves genuine user need, production-ready
- Technical Difficulty (10 pts): Complexity of problem domain and implementation

**Total Score: 100 points**

### Report Contents

**Score & Overview:**
- Overall score out of 100
- Letter grade (A+, A, B+, B, etc.)
- Category breakdowns with visual progress bars
- AI-generated summary (2-3 paragraphs)

**Architecture Diagram:**
- Auto-generated system architecture visualization
- Shows major components, data flow, dependencies
- Technology stack visualization
- Interactive (zoom/pan)

**Detailed Analysis:**
- Criterion-by-criterion breakdown
- Specific evidence and reasoning for each score
- Key strengths identified
- Areas for improvement

**Useful Insights:**
- **Improvement Recommendations**: Prioritized, actionable suggestions with expected score impact
- **Code Quality Suggestions**: Specific code patterns to improve (e.g., "Add error handling in X function")
- **Architecture Recommendations**: Refactoring and architectural improvement suggestions
- **Testing Gaps**: Areas lacking test coverage with specific test case suggestions
- **Security Scan**: Basic vulnerability detection (SQL injection, XSS, etc.)
- **Dependency Health**: Outdated packages, known vulnerabilities
- **Performance Insights**: Identified bottlenecks and optimization opportunities
- **Code Smells**: Detected issues with explanations and fixes

**Visualizations:**
- Language distribution chart
- File structure tree
- Commit activity timeline
- Test coverage visualization
- Dependency graph
- Code metrics dashboard

**Metadata:**
- Repository language(s)
- Stars, forks, watchers
- Last updated date
- Primary contributors
- License information

### Sharing Options

- Direct shareable link: `giteval.com/user/repo`
- Social media cards (Open Graph) with score preview
- PDF export
- Embeddable badge for README files
- JSON/API access for programmatic use

## User Profile Evaluation

**Whole Person Analysis:**
- Evaluates all public repositories for a GitHub user
- Aggregates scores across repositories
- Provides comprehensive profile score
- Identifies skill specializations
- Shows consistency across projects

**Report Includes:**
- Overall profile score (aggregate)
- Repository portfolio breakdown
- Skill specialization analysis (frontend, backend, DevOps, etc.)
- Consistency metrics
- Top repositories showcase
- Growth trajectory (if re-evaluated over time)

**URL:** `giteval.com/username`

## User Flows

### Flow 1: Evaluate a Repository

1. User visits `giteval.com`
2. Enters GitHub repository URL (e.g., `github.com/user/repo`)
3. Clicks "Evaluate Repository"
4. System checks cache:
   - **If cached**: Instant results
   - **If not cached**: Shows loading screen (30-60 seconds)
5. User views evaluation report at `giteval.com/user/repo`
6. User can:
   - Share the link
   - Download PDF
   - Copy badge code for README
   - View detailed insights and recommendations

### Flow 2: View Cached Evaluation

1. User enters repository URL that was previously evaluated
2. System checks cache and finds match
3. Results displayed instantly (no waiting)
4. User views report

### Flow 3: Evaluate User Profile

1. User enters GitHub username
2. System analyzes all public repositories
3. Generates comprehensive profile evaluation
4. User views profile report at `giteval.com/username`
5. Can share profile link

### Flow 4: Share Evaluation

1. User shares `giteval.com/user/repo` link
2. Recipient clicks link
3. Views evaluation report (no login required)
4. Can explore architecture diagram, insights, and recommendations

## Technical Architecture

### Frontend
- Next.js 14+ (App Router)
- React Server Components
- TailwindCSS
- Recharts/D3.js for visualizations
- Mermaid.js for architecture diagrams

### Backend
- Next.js API routes
- GitHub API integration
- Anthropic Claude API for AI evaluation
- PostgreSQL for storing evaluations
- Redis for caching

### Analysis Pipeline

```
1. Cache Check (by URL + commit SHA)
   ↓ (if not cached)
2. Clone Repository
   ↓
3. Static Analysis
   - Language detection
   - File structure analysis
   - Code metrics
   ↓
4. Code Parsing
   - AST analysis
   - Pattern detection
   - Complexity metrics
   ↓
5. Test Detection
   - Test file identification
   - Coverage analysis
   - Assertion quality
   ↓
6. Documentation Scan
   - README analysis
   - Code comments
   - API documentation
   ↓
7. Dependency Analysis
   - Package.json/requirements.txt parsing
   - Vulnerability check
   - Outdated packages
   ↓
8. Security Scan
   - Basic vulnerability detection
   - Common security issues
   ↓
9. AI Evaluation
   - Claude analyzes code with rubric
   - Generates score out of 100
   - Provides reasoning and evidence
   ↓
10. AI Insights Generation
    - Improvement recommendations
    - Code quality suggestions
    - Architecture recommendations
    ↓
11. Architecture Diagram Generation
    - Component identification
    - Dependency mapping
    - Visual diagram creation
    ↓
12. Visualization Generation
    - Charts and graphs
    - Metrics dashboards
    ↓
13. Report Assembly
    - Combine all data
    - Generate shareable format
    ↓
14. Cache Storage
    - Store results (URL + commit SHA)
    ↓
15. Cleanup
    - Remove temporary files
```

## Anti-Gaming Mechanisms

**Design Principles:**
- Reward genuine engineering work over superficial metrics
- Detect and account for optimization attempts
- Value real problem-solving over boilerplate code
- Analyze commit history for authenticity

**Protections:**
- Detect auto-generated test files with low assertion quality
- Identify copy-pasted boilerplate vs. custom implementation
- Analyze commit patterns for suspicious activity
- Validate that tests actually test meaningful behavior
- Cross-reference README claims with actual implementation
- Check for over-documentation of obvious code

## Success Metrics

**Usage:**
- Evaluations generated per week
- Cache hit rate
- Unique repositories evaluated
- Return rate (users evaluating multiple repos)

**Engagement:**
- Time spent on reports
- Share rate
- Badge installations
- PDF downloads

**Quality:**
- User feedback on evaluation accuracy
- Correlation with human expert reviews
- Diversity of repository types analyzed

## Open Questions

1. **Private Repositories**: Support via OAuth in future?
3. **Language Support**: Start with specific languages (JS/TS, Python) or universal?
4. **Re-evaluation**: Allow users to re-evaluate to track improvements over time?
5. **Comparison**: Compare two repositories side-by-side?

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI gives inaccurate scores | High | Multi-model validation, human spot-checks, user feedback loop |
| Users game the system | Medium | Anti-gaming mechanisms, holistic evaluation, commit history analysis |
| GitHub API rate limits | Medium | Aggressive caching, authenticated API calls, queue system |
| Analysis takes too long | Medium | Parallel processing, progressive results, repo size limits |
| Cache invalidation issues | Low | Use commit SHA, clear cache on new commits |

## Dependencies

**External Services:**
- GitHub API (repository access)
- Anthropic Claude API (code analysis)
- Google App Engine (hosting)
- Supabase (database)
- Redis (caching)