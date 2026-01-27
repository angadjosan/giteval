export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
export interface Evaluation {
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
    categoryScores: CategoryScore[];
    architectureDiagram: string;
    metrics: Metrics;
    metadata: RepositoryMetadata;
    evaluatedAt: Date;
    cached: boolean;
}
export interface CategoryScore {
    category: string;
    score: number;
    maxPoints: number;
    criteria: CriterionScore[];
}
export interface CriterionScore {
    name: string;
    score: number;
    maxPoints: number;
    reasoning: string;
    evidence: string[];
}
export interface Suggestion {
    category: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    expectedImpact: number;
    specificExamples: string[];
}
export interface Metrics {
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
export interface Dependency {
    name: string;
    version: string;
    type: 'production' | 'development';
    vulnerabilities?: Vulnerability[];
}
export interface Vulnerability {
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    fixAvailable: boolean;
}
export interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: number;
    children?: FileNode[];
}
export interface RepositoryMetadata {
    languages: string[];
    stars: number;
    forks: number;
    watchers: number;
    openIssues: number;
    lastUpdated: Date;
    license?: string;
    contributors: Contributor[];
    topics: string[];
    description?: string;
    defaultBranch: string;
}
export interface Contributor {
    username: string;
    contributions: number;
    avatarUrl: string;
}
export interface UserProfile {
    id: string;
    username: string;
    overallScore: number;
    repositoryCount: number;
    analysis: UserProfileAnalysis;
    evaluatedAt: Date;
}
export interface UserProfileAnalysis {
    topRepositories: RepositorySummary[];
    skillSpecializations: SkillSpecialization[];
    consistencyMetrics: ConsistencyMetrics;
    growthTrajectory?: GrowthTrajectory;
}
export interface RepositorySummary {
    owner: string;
    repo: string;
    score: number;
    grade: Grade;
    languages: string[];
    stars: number;
}
export interface SkillSpecialization {
    category: string;
    score: number;
    repositoryCount: number;
    topLanguages: string[];
}
export interface ConsistencyMetrics {
    averageScore: number;
    scoreVariance: number;
    qualityTrend: 'improving' | 'stable' | 'declining';
}
export interface GrowthTrajectory {
    previousScore: number;
    currentScore: number;
    improvement: number;
    timeframe: string;
}
export interface Job {
    id: string;
    type: 'repository' | 'user_profile';
    payload: any;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    error?: string;
    resultId?: string;
    createdAt: Date;
    updatedAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}
export interface EvaluateRequest {
    url: string;
    force?: boolean;
}
export interface EvaluateResponse {
    evaluationId: string;
    jobId: string;
    cached: boolean;
    status: Job['status'];
    redirectUrl: string;
}
export interface JobStatusResponse {
    id: string;
    status: Job['status'];
    progress: number;
    evaluation?: Evaluation;
    error?: string;
}
export interface UserProfileRequest {
    username: string;
}
export interface UserProfileResponse {
    profileId: string;
    jobId: string;
    repositoryCount: number;
    status: Job['status'];
}
export declare enum ErrorCode {
    INVALID_URL = "invalid_url",
    REPOSITORY_NOT_FOUND = "repository_not_found",
    REPOSITORY_TOO_LARGE = "repository_too_large",
    PRIVATE_REPOSITORY = "private_repository",
    GITHUB_API_ERROR = "github_api_error",
    CLAUDE_API_ERROR = "claude_api_error",
    DATABASE_ERROR = "database_error",
    CACHE_ERROR = "cache_error",
    CLONE_FAILED = "clone_failed",
    ANALYSIS_TIMEOUT = "analysis_timeout",
    PARSING_ERROR = "parsing_error",
    UNKNOWN_ERROR = "unknown_error"
}
export declare class EvaluationError extends Error {
    code: ErrorCode;
    recoverable: boolean;
    constructor(message: string, code: ErrorCode, recoverable?: boolean);
}
export interface DbEvaluation {
    id: string;
    repository_url: string;
    owner: string;
    repo: string;
    commit_sha: string;
    overall_score: number;
    grade: Grade;
    code_quality_score: number;
    product_quality_score: number;
    summary: string;
    strengths: any;
    improvements: any;
    suggestions: any;
    architecture_diagram: string;
    metrics: any;
    metadata: any;
    evaluated_at: string;
    cached: boolean;
}
export interface DbJob {
    id: string;
    type: string;
    payload: any;
    status: string;
    progress: number;
    error?: string;
    result_id?: string;
    created_at: string;
    updated_at: string;
    started_at?: string;
    completed_at?: string;
}
export interface DbUserProfile {
    id: string;
    username: string;
    overall_score: number;
    repository_count: number;
    analysis: any;
    evaluated_at: string;
    created_at: string;
}
//# sourceMappingURL=types.d.ts.map