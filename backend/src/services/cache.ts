import { createClient, RedisClientType } from 'redis';
import type { Evaluation } from '../../../frontend/lib/types';
import { ErrorCode, EvaluationError } from '../../../frontend/lib/types';

export class CacheService {
  private client: RedisClientType;
  private connected: boolean = false;
  private ttl: number = 86400; // 24 hours in seconds

  constructor() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.warn('Warning: REDIS_URL not set. Caching will be disabled.');
      this.client = null as any;
      return;
    }

    this.client = createClient({
      url: redisUrl
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.connected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this.connected = true;
    });
  }

  async connect(): Promise<void> {
    if (!this.client || this.connected) return;

    try {
      await this.client.connect();
      this.connected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.connected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client || !this.connected) return;

    try {
      await this.client.disconnect();
      this.connected = false;
    } catch (error) {
      console.error('Failed to disconnect from Redis:', error);
    }
  }

  private getEvaluationKey(owner: string, repo: string, commitSha: string): string {
    return `eval:${owner}:${repo}:${commitSha}`;
  }

  private getJobKey(jobId: string): string {
    return `job:${jobId}`;
  }

  async getEvaluation(owner: string, repo: string, commitSha: string): Promise<Evaluation | null> {
    if (!this.connected) return null;

    const key = this.getEvaluationKey(owner, repo, commitSha);

    try {
      const data = await this.client.get(key);

      if (!data) return null;

      const evaluation = JSON.parse(data);

      // Parse date strings back to Date objects
      evaluation.evaluatedAt = new Date(evaluation.evaluatedAt);
      if (evaluation.metadata?.lastUpdated) {
        evaluation.metadata.lastUpdated = new Date(evaluation.metadata.lastUpdated);
      }

      return evaluation;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async setEvaluation(
    owner: string,
    repo: string,
    commitSha: string,
    evaluation: Evaluation
  ): Promise<void> {
    if (!this.connected) return;

    const key = this.getEvaluationKey(owner, repo, commitSha);

    try {
      await this.client.setEx(
        key,
        this.ttl,
        JSON.stringify(evaluation)
      );
    } catch (error) {
      console.error('Redis set error:', error);
      throw new EvaluationError(
        'Failed to cache evaluation',
        ErrorCode.CACHE_ERROR,
        true
      );
    }
  }

  async getJobProgress(jobId: string): Promise<number | null> {
    if (!this.connected) return null;

    const key = this.getJobKey(jobId);

    try {
      const progress = await this.client.get(key);
      return progress ? parseInt(progress, 10) : null;
    } catch (error) {
      console.error('Redis get job progress error:', error);
      return null;
    }
  }

  async setJobProgress(jobId: string, progress: number): Promise<void> {
    if (!this.connected) return;

    const key = this.getJobKey(jobId);

    try {
      // Jobs are temporary, expire after 1 hour
      await this.client.setEx(key, 3600, progress.toString());
    } catch (error) {
      console.error('Redis set job progress error:', error);
    }
  }

  async deleteEvaluation(owner: string, repo: string, commitSha: string): Promise<void> {
    if (!this.connected) return;

    const key = this.getEvaluationKey(owner, repo, commitSha);

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async deleteJob(jobId: string): Promise<void> {
    if (!this.connected) return;

    const key = this.getJobKey(jobId);

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis delete job error:', error);
    }
  }

  async clearAll(): Promise<void> {
    if (!this.connected) return;

    try {
      await this.client.flushDb();
    } catch (error) {
      console.error('Redis flush error:', error);
    }
  }

  async ping(): Promise<boolean> {
    if (!this.connected) return false;

    try {
      const response = await this.client.ping();
      return response === 'PONG';
    } catch (error) {
      console.error('Redis ping error:', error);
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
