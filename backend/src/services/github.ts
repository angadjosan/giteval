import type { RepositoryMetadata, Contributor } from '../../../frontend/lib/types';
import { ErrorCode, EvaluationError } from '../../../frontend/lib/types';

interface GitHubRepo {
  name: string;
  owner: { login: string };
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  updated_at: string;
  license: { spdx_id: string } | null;
  topics: string[];
  language: string | null;
  languages_url: string;
  contributors_url: string;
  default_branch: string;
}

interface GitHubContributor {
  login: string;
  contributions: number;
  avatar_url: string;
}

interface GitHubLanguages {
  [language: string]: number;
}

export class GitHubService {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.GITHUB_API_URL || 'https://api.github.com';
    this.token = process.env.GITHUB_TOKEN || '';

    if (!this.token) {
      console.warn('Warning: GITHUB_TOKEN not set. API rate limits will be strict.');
    }
  }

  private async fetch<T>(url: string): Promise<T> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitEval'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        throw new EvaluationError(
          'Repository not found',
          ErrorCode.REPOSITORY_NOT_FOUND,
          false
        );
      }

      if (response.status === 403) {
        throw new EvaluationError(
          'GitHub API rate limit exceeded or private repository',
          ErrorCode.GITHUB_API_ERROR,
          true
        );
      }

      throw new EvaluationError(
        `GitHub API error: ${response.statusText}`,
        ErrorCode.GITHUB_API_ERROR,
        true
      );
    }

    return response.json();
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepo> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}`;
    return this.fetch<GitHubRepo>(url);
  }

  async getCommitSha(owner: string, repo: string, branch?: string): Promise<string> {
    const repoData = await this.getRepository(owner, repo);
    const branchName = branch || repoData.default_branch;

    const url = `${this.baseUrl}/repos/${owner}/${repo}/commits/${branchName}`;
    const commit = await this.fetch<{ sha: string }>(url);

    return commit.sha;
  }

  async getUserRepositories(username: string): Promise<Array<{ owner: string; repo: string }>> {
    const url = `${this.baseUrl}/users/${username}/repos?type=public&per_page=100&sort=updated`;
    const repos = await this.fetch<Array<{ name: string; owner: { login: string } }>>(url);

    return repos.map(r => ({
      owner: r.owner.login,
      repo: r.name
    }));
  }

  async getRepositoryMetadata(owner: string, repo: string): Promise<RepositoryMetadata> {
    const repoData = await this.getRepository(owner, repo);

    // Fetch languages
    const languages = await this.fetch<GitHubLanguages>(repoData.languages_url);
    const languageNames = Object.keys(languages);

    // Fetch contributors (top 10)
    const contributorsUrl = `${this.baseUrl}/repos/${owner}/${repo}/contributors?per_page=10`;
    const contributors = await this.fetch<GitHubContributor[]>(contributorsUrl);

    const contributorData: Contributor[] = contributors.map(c => ({
      username: c.login,
      contributions: c.contributions,
      avatarUrl: c.avatar_url
    }));

    return {
      languages: languageNames,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      watchers: repoData.watchers_count,
      openIssues: repoData.open_issues_count,
      lastUpdated: new Date(repoData.updated_at),
      license: repoData.license?.spdx_id,
      contributors: contributorData,
      topics: repoData.topics || [],
      description: repoData.description || undefined,
      defaultBranch: repoData.default_branch
    };
  }

  async getLanguageDistribution(owner: string, repo: string): Promise<Record<string, number>> {
    const repoData = await this.getRepository(owner, repo);
    return this.fetch<GitHubLanguages>(repoData.languages_url);
  }

  async getRepoSize(owner: string, repo: string): Promise<number> {
    const repoData = await this.getRepository(owner, repo);
    return (repoData as any).size; // Size in KB
  }

  parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    // Support formats:
    // - https://github.com/owner/repo
    // - github.com/owner/repo
    // - owner/repo

    const patterns = [
      /^https?:\/\/github\.com\/([^\/]+)\/([^\/\#\?]+)/,
      /^github\.com\/([^\/]+)\/([^\/\#\?]+)/,
      /^([^\/]+)\/([^\/\#\?]+)$/
    ];

    for (const pattern of patterns) {
      const match = url.trim().match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, '')
        };
      }
    }

    return null;
  }

  async checkRepoAccessibility(owner: string, repo: string): Promise<boolean> {
    try {
      await this.getRepository(owner, repo);
      return true;
    } catch (error) {
      if (error instanceof EvaluationError && error.code === ErrorCode.REPOSITORY_NOT_FOUND) {
        return false;
      }
      throw error;
    }
  }
}
