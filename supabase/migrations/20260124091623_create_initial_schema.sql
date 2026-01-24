-- GitEval Initial Database Schema

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Evaluations table
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_url TEXT NOT NULL,
  owner TEXT NOT NULL,
  repo TEXT NOT NULL,
  commit_sha TEXT NOT NULL,

  -- Scores
  overall_score DECIMAL(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  grade VARCHAR(3) NOT NULL,
  code_quality_score DECIMAL(5,2) NOT NULL CHECK (code_quality_score >= 0 AND code_quality_score <= 60),
  product_quality_score DECIMAL(5,2) NOT NULL CHECK (product_quality_score >= 0 AND product_quality_score <= 40),

  -- Analysis results
  summary TEXT,
  strengths JSONB DEFAULT '[]'::jsonb,
  improvements JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,

  -- Visualizations
  architecture_diagram TEXT,
  metrics JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Caching
  cached BOOLEAN DEFAULT FALSE,

  -- Composite unique constraint for cache lookup
  UNIQUE(owner, repo, commit_sha)
);

-- Create indexes for evaluations
CREATE INDEX idx_evaluations_owner_repo ON evaluations(owner, repo);
CREATE INDEX idx_evaluations_commit_sha ON evaluations(commit_sha);
CREATE INDEX idx_evaluations_evaluated_at ON evaluations(evaluated_at DESC);
CREATE INDEX idx_evaluations_created_at ON evaluations(created_at DESC);

-- Category scores table
CREATE TABLE category_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  max_points INTEGER NOT NULL,
  criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_category_scores_evaluation ON category_scores(evaluation_id);

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  overall_score DECIMAL(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
  repository_count INTEGER DEFAULT 0,
  analysis JSONB DEFAULT '{}'::jsonb,
  evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_evaluated_at ON user_profiles(evaluated_at DESC);

-- Job queue table (for async processing)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('repository', 'user_profile')),
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error TEXT,
  result_id UUID, -- References evaluation_id or user_profile_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_type ON jobs(type);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Public read access for evaluations (anyone can view reports)
CREATE POLICY "Evaluations are publicly readable"
  ON evaluations FOR SELECT
  USING (true);

-- Public read access for category scores
CREATE POLICY "Category scores are publicly readable"
  ON category_scores FOR SELECT
  USING (true);

-- Public read access for user profiles
CREATE POLICY "User profiles are publicly readable"
  ON user_profiles FOR SELECT
  USING (true);

-- Jobs are only accessible via service role (backend only)
CREATE POLICY "Jobs are only accessible via service role"
  ON jobs FOR ALL
  USING (false);

-- Service role can bypass RLS
-- This is configured in Supabase dashboard or via service role key
