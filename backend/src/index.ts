import express from 'express';
import dotenv from 'dotenv';
import { getDatabaseService, getGitHubService } from './services/instances';
import { executePipeline } from './pipeline/orchestrator';
import type { Job, Evaluation } from '../../shared/types';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - allow frontend to call backend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /api/evaluate - Start repository evaluation
app.post('/api/evaluate', async (req: express.Request, res: express.Response) => {
  try {
    const { url, force = false } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    // Parse GitHub URL
    let owner: string;
    let repo: string;

    try {
      const githubService = getGitHubService();
      const parsed = githubService.parseGitHubUrl(url);
      if (!parsed) {
        return res.status(400).json({ error: 'Invalid GitHub URL format' });
      }
      owner = parsed.owner;
      repo = parsed.repo;
    } catch (error: any) {
      return res.status(400).json({ error: `Invalid GitHub URL: ${error.message}` });
    }

    // Create job
    const databaseService = getDatabaseService();
    const jobId = await databaseService.createJob('repository', { owner, repo, force });

    console.log(`[API] Created evaluation job ${jobId} for ${owner}/${repo}`);

    // Start pipeline execution asynchronously (don't await)
    executePipeline(jobId, owner, repo)
      .then(() => {
        console.log(`[API] Pipeline completed for job ${jobId}`);
      })
      .catch((error) => {
        console.error(`[API] Pipeline failed for job ${jobId}:`, error);
      });

    // Return job ID immediately
    return res.json({
      evaluationId: jobId,
      jobId: jobId,
      cached: false,
      status: 'pending',
      redirectUrl: `/${owner}/${repo}`,
    });

  } catch (error: any) {
    console.error('[API] Error creating evaluation:', error);
    return res.status(500).json({ error: error.message || 'Failed to start evaluation' });
  }
});

// GET /api/evaluation/:id - Get evaluation status and results
app.get('/api/evaluation/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Evaluation ID is required' });
    }

    // Get job status
    const databaseService = getDatabaseService();
    const job = await databaseService.getJob(id);

    if (!job) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    // If job is completed, fetch the evaluation
    let evaluation: Evaluation | null = null;
    if (job.status === 'completed' && job.resultId) {
      evaluation = await databaseService.getEvaluation(job.resultId);
    }

    return res.json({
      id: job.id,
      status: job.status,
      progress: job.progress || 0,
      error: job.error || undefined,
      evaluation: evaluation || undefined,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt,
    });

  } catch (error: any) {
    console.error('[API] Error fetching evaluation:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch evaluation' });
  }
});

// GET /api/report/:owner/:repo - Get cached evaluation report
app.get('/api/report/:owner/:repo', async (req: express.Request, res: express.Response) => {
  try {
    const { owner, repo } = req.params;

    if (!owner || !repo) {
      return res.status(400).json({ error: 'Owner and repository name are required' });
    }

    // Get latest commit SHA
    let commitSha: string;
    try {
      const githubService = getGitHubService();
      commitSha = await githubService.getCommitSha(owner, repo);
    } catch (error: any) {
      return res.status(404).json({ error: `Failed to fetch repository: ${error.message}` });
    }

    // Get evaluation from database
    const databaseService = getDatabaseService();
    const evaluation = await databaseService.getEvaluationByRepo(owner, repo, commitSha);

    if (!evaluation) {
      return res.status(404).json({
        error: 'No evaluation found for this repository. Please run an evaluation first.',
      });
    }

    return res.json(evaluation);

  } catch (error: any) {
    console.error('[API] Error fetching report:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch report' });
  }
});

// POST /api/user-profile - Evaluate user profile (all repositories)
app.post('/api/user-profile', async (req: express.Request, res: express.Response) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Get user repositories from GitHub
    let repositories: Array<{ owner: string; repo: string }>;
    try {
      const githubService = getGitHubService();
      repositories = await githubService.getUserRepositories(username);
    } catch (error: any) {
      return res.status(404).json({ error: `Failed to fetch user repositories: ${error.message}` });
    }

    // Create job for user profile evaluation
    const databaseService = getDatabaseService();
    const jobId = await databaseService.createJob('user_profile', {
      username,
      repositories: repositories.map(r => `${r.owner}/${r.repo}`),
    });

    console.log(`[API] Created user profile job ${jobId} for ${username}`);

    // TODO: Implement user profile evaluation pipeline
    // For now, just return the job ID

    return res.json({
      profileId: jobId,
      jobId: jobId,
      repositoryCount: repositories.length,
      status: 'pending',
    });

  } catch (error: any) {
    console.error('[API] Error creating user profile evaluation:', error);
    return res.status(500).json({ error: error.message || 'Failed to start user profile evaluation' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});
