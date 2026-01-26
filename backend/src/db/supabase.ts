import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  DbEvaluation,
  DbJob,
  DbUserProfile,
  Evaluation,
  Job,
  UserProfile,
  CategoryScore
} from '../../../shared/types';

export class DatabaseService {
  private client: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.client = createClient(supabaseUrl, supabaseKey);
  }

  // Evaluation methods

  async saveEvaluation(
    evaluation: Omit<Evaluation, 'id' | 'evaluatedAt' | 'cached'>,
    categoryScores: CategoryScore[]
  ): Promise<string> {
    const dbEvaluation = this.toDbEvaluation(evaluation);

    const { data, error } = await this.client
      .from('evaluations')
      .insert(dbEvaluation)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save evaluation: ${error.message}`);
    }

    // Save category scores
    if (categoryScores.length > 0) {
      const dbCategoryScores = categoryScores.map(cs => ({
        evaluation_id: data.id,
        category: cs.category,
        score: cs.score,
        max_points: cs.maxPoints,
        criteria: cs.criteria
      }));

      const { error: scoresError } = await this.client
        .from('category_scores')
        .insert(dbCategoryScores);

      if (scoresError) {
        console.error('Failed to save category scores:', scoresError);
      }
    }

    return data.id;
  }

  async getEvaluation(id: string): Promise<Evaluation | null> {
    const { data, error } = await this.client
      .from('evaluations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    // Fetch category scores
    const categoryScores = await this.getCategoryScores(id);

    return this.fromDbEvaluation(data, categoryScores);
  }

  async getEvaluationByRepo(
    owner: string,
    repo: string,
    commitSha?: string
  ): Promise<Evaluation | null> {
    let query = this.client
      .from('evaluations')
      .select('*')
      .eq('owner', owner)
      .eq('repo', repo);

    if (commitSha) {
      query = query.eq('commit_sha', commitSha);
    }

    query = query.order('evaluated_at', { ascending: false }).limit(1);

    const { data, error } = await query.single();

    if (error || !data) {
      return null;
    }

    // Fetch category scores
    const categoryScores = await this.getCategoryScores(data.id);

    return this.fromDbEvaluation(data, categoryScores);
  }

  async getCategoryScores(evaluationId: string): Promise<CategoryScore[]> {
    const { data, error } = await this.client
      .from('category_scores')
      .select('*')
      .eq('evaluation_id', evaluationId);

    if (error || !data) {
      return [];
    }

    return data.map(cs => ({
      category: cs.category,
      score: cs.score,
      maxPoints: cs.max_points,
      criteria: cs.criteria
    }));
  }

  // User profile methods

  async saveUserProfile(profile: Omit<UserProfile, 'id' | 'evaluatedAt'>): Promise<string> {
    const dbProfile = {
      username: profile.username,
      overall_score: profile.overallScore,
      repository_count: profile.repositoryCount,
      analysis: profile.analysis
    };

    const { data, error } = await this.client
      .from('user_profiles')
      .upsert(dbProfile, { onConflict: 'username' })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save user profile: ${error.message}`);
    }

    return data.id;
  }

  async getUserProfile(username: string): Promise<UserProfile | null> {
    const { data, error } = await this.client
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) {
      return null;
    }

    return this.fromDbUserProfile(data);
  }

  // Job queue methods

  async createJob(type: 'repository' | 'user_profile', payload: any): Promise<string> {
    const { data, error } = await this.client
      .from('jobs')
      .insert({
        type,
        payload,
        status: 'pending',
        progress: 0
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }

    return data.id;
  }

  async updateJob(
    id: string,
    updates: {
      status?: Job['status'];
      progress?: number;
      error?: string;
      resultId?: string;
    }
  ): Promise<void> {
    // Extract resultId before spreading to avoid camelCase in database
    const { resultId, ...restUpdates } = updates;
    
    const updateData: any = { 
      ...restUpdates,
      updated_at: new Date().toISOString()
    };

    if (updates.status === 'processing' && !updates.progress) {
      updateData.started_at = new Date().toISOString();
    }

    if (updates.status === 'completed' || updates.status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (resultId) {
      updateData.result_id = resultId;
    }

    const { error } = await this.client
      .from('jobs')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update job: ${error.message}`);
    }
  }

  async getJob(id: string): Promise<Job | null> {
    const { data, error } = await this.client
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return this.fromDbJob(data);
  }

  async getPendingJobs(limit: number = 10): Promise<Job[]> {
    const { data, error } = await this.client
      .from('jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map(this.fromDbJob);
  }

  // Conversion helpers

  private toDbEvaluation(evaluation: Omit<Evaluation, 'id' | 'evaluatedAt' | 'cached'>): Omit<DbEvaluation, 'id' | 'evaluated_at' | 'cached'> {
    return {
      repository_url: evaluation.repositoryUrl,
      owner: evaluation.owner,
      repo: evaluation.repo,
      commit_sha: evaluation.commitSha,
      overall_score: evaluation.overallScore,
      grade: evaluation.grade,
      code_quality_score: evaluation.codeQualityScore,
      product_quality_score: evaluation.productQualityScore,
      summary: evaluation.summary,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      suggestions: evaluation.suggestions,
      architecture_diagram: evaluation.architectureDiagram,
      metrics: evaluation.metrics,
      metadata: evaluation.metadata
    };
  }

  private fromDbEvaluation(dbEval: DbEvaluation, categoryScores: CategoryScore[] = []): Evaluation {
    return {
      id: dbEval.id,
      repositoryUrl: dbEval.repository_url,
      owner: dbEval.owner,
      repo: dbEval.repo,
      commitSha: dbEval.commit_sha,
      overallScore: parseFloat(dbEval.overall_score.toString()),
      grade: dbEval.grade,
      codeQualityScore: parseFloat(dbEval.code_quality_score.toString()),
      productQualityScore: parseFloat(dbEval.product_quality_score.toString()),
      summary: dbEval.summary,
      strengths: dbEval.strengths || [],
      improvements: dbEval.improvements || [],
      suggestions: dbEval.suggestions || [],
      categoryScores: categoryScores,
      architectureDiagram: dbEval.architecture_diagram,
      metrics: dbEval.metrics || {},
      metadata: dbEval.metadata || {},
      evaluatedAt: new Date(dbEval.evaluated_at),
      cached: dbEval.cached
    };
  }

  private fromDbJob(dbJob: DbJob): Job {
    return {
      id: dbJob.id,
      type: dbJob.type as 'repository' | 'user_profile',
      payload: dbJob.payload,
      status: dbJob.status as Job['status'],
      progress: dbJob.progress,
      error: dbJob.error,
      resultId: dbJob.result_id,
      createdAt: new Date(dbJob.created_at),
      updatedAt: new Date(dbJob.updated_at),
      startedAt: dbJob.started_at ? new Date(dbJob.started_at) : undefined,
      completedAt: dbJob.completed_at ? new Date(dbJob.completed_at) : undefined
    };
  }

  private fromDbUserProfile(dbProfile: DbUserProfile): UserProfile {
    return {
      id: dbProfile.id,
      username: dbProfile.username,
      overallScore: parseFloat(dbProfile.overall_score.toString()),
      repositoryCount: dbProfile.repository_count,
      analysis: dbProfile.analysis || {},
      evaluatedAt: new Date(dbProfile.evaluated_at)
    };
  }
}
