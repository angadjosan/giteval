# GitEval Project Structure

## Frontend (`/frontend`)

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page with EvaluationForm
│   ├── globals.css             # Global styles
│   │
│   ├── [owner]/[repo]/
│   │   └── page.tsx            # Repository evaluation report page
│   │
│   ├── [username]/
│   │   └── page.tsx            # User profile evaluation page
│   │
│   └── api/                    # API routes
│       ├── evaluate/
│       │   └── route.ts        # POST /api/evaluate
│       ├── evaluation/[id]/
│       │   └── route.ts        # GET /api/evaluation/[id]
│       ├── report/[owner]/[repo]/
│       │   └── route.ts        # GET /api/report/[owner]/[repo]
│       └── user-profile/
│           └── route.ts        # POST /api/user-profile
│
├── components/
│   ├── EvaluationForm.tsx      # Repository URL input form
│   ├── ScoreDisplay.tsx        # Overall score with grade display
│   ├── CategoryBreakdown.tsx   # Detailed score breakdown by category
│   ├── ArchitectureDiagram.tsx # Mermaid diagram renderer
│   ├── InsightsList.tsx        # Improvement suggestions list
│   ├── MetricsVisualization.tsx # Charts and graphs for metrics
│   ├── SharePanel.tsx          # Share links, PDF export, badge
│   └── RepositoryMetadata.tsx  # Stars, forks, contributors, etc.
│
├── lib/
│   ├── types.ts                # TypeScript interfaces
│   └── utils.ts                # Utility functions
│
├── public/                     # Static assets
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Backend (`/backend`)

```
backend/
├── src/
│   ├── services/               # External service integrations
│   │   ├── github.ts           # GitHub API client
│   │   ├── claude.ts           # Claude API client
│   │   └── cache.ts            # Redis cache service
│   │
│   ├── db/
│   │   └── supabase.ts         # Supabase database client
│   │
│   ├── pipeline/               # Analysis pipeline
│   │   ├── orchestrator.ts     # Pipeline coordinator
│   │   ├── cache-check.ts      # Step 1: Check cache
│   │   ├── clone.ts            # Step 2: Clone repository
│   │   ├── static-analysis.ts  # Step 3: Static analysis
│   │   ├── code-parser.ts      # Step 4: AST parsing
│   │   ├── test-analyzer.ts    # Step 5: Test detection
│   │   ├── documentation-scanner.ts  # Step 6: Doc analysis
│   │   ├── security-scanner.ts # Step 7: Security scan
│   │   ├── metrics-collector.ts # Step 8: Aggregate metrics
│   │   ├── ai-evaluator.ts     # Step 9: Claude evaluation
│   │   ├── architecture-diagram.ts # Step 10: Diagram generation
│   │   ├── visualization.ts    # Step 11: Chart generation
│   │   ├── report-assembly.ts  # Step 12: Assemble report
│   │   ├── cache-storage.ts    # Step 13: Store in cache
│   │   └── cleanup.ts          # Step 14: Cleanup temp files
│   │
│   └── utils/                  # Utility functions
│
└── package.json
```

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI**: React Server Components + Client Components
- **Styling**: TailwindCSS 4
- **Visualizations**: Recharts, Mermaid.js
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Language**: TypeScript

### Backend
- **Runtime**: Node.js on Google App Engine
- **APIs**: GitHub API, Anthropic Claude API
- **Database**: Supabase (PostgreSQL)
- **Cache**: Redis
- **Storage**: Google Cloud Storage
- **Language**: TypeScript

## Key Routes

### Pages
- `/` - Landing page with repository input
- `/[owner]/[repo]` - Repository evaluation report
- `/[username]` - User profile evaluation

### API Endpoints
- `POST /api/evaluate` - Start repository evaluation
- `GET /api/evaluation/[id]` - Get evaluation status/results
- `GET /api/report/[owner]/[repo]` - Get cached report
- `POST /api/user-profile` - Start user profile evaluation

## Development

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (when implemented)
cd backend
npm install
npm run dev
```

## Next Steps

1. Implement component logic in `components/`
2. Complete API route implementations in `app/api/`
3. Build out backend pipeline steps
4. Set up Supabase database schema
5. Configure Redis cache
6. Integrate GitHub and Claude APIs
7. Deploy to Google App Engine
