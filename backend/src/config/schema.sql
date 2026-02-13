-- ============================================================
-- MIM System Database Schema
-- Multiple Intelligence Mapping + RIASEC Assessment System
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  gender VARCHAR(20),
  birthdate DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. ASSESSMENT VERSIONS (supports versioning of question sets)
-- ============================================================
CREATE TABLE IF NOT EXISTS assessment_versions (
  id SERIAL PRIMARY KEY,
  version_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 3. DOMAINS (MI + RIASEC)
-- ============================================================
CREATE TABLE IF NOT EXISTS domains (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('MI', 'RIASEC')),
  description TEXT
);

-- ============================================================
-- 4. QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  version_id INTEGER NOT NULL REFERENCES assessment_versions(id) ON DELETE CASCADE,
  domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 5. ASSESSMENTS (one per student attempt)
-- ============================================================
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version_id INTEGER NOT NULL REFERENCES assessment_versions(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- ============================================================
-- 6. RESPONSES
-- ============================================================
CREATE TABLE IF NOT EXISTS responses (
  id SERIAL PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value BETWEEN 1 AND 5),
  UNIQUE(assessment_id, question_id)
);

-- ============================================================
-- 7. COMPUTED SCORES (cached per assessment per domain)
-- ============================================================
CREATE TABLE IF NOT EXISTS computed_scores (
  id SERIAL PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  raw_score NUMERIC NOT NULL,
  normalized_score NUMERIC NOT NULL,
  UNIQUE(assessment_id, domain_id)
);

-- ============================================================
-- 8. STRANDS (SHS strands)
-- ============================================================
CREATE TABLE IF NOT EXISTS strands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

-- ============================================================
-- 9. STRAND WEIGHTS (maps domains → strands with weights)
-- ============================================================
CREATE TABLE IF NOT EXISTS strand_weights (
  id SERIAL PRIMARY KEY,
  strand_id INTEGER NOT NULL REFERENCES strands(id) ON DELETE CASCADE,
  domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  weight FLOAT NOT NULL,
  UNIQUE(strand_id, domain_id)
);

-- ============================================================
-- 10. CAREERS
-- ============================================================
CREATE TABLE IF NOT EXISTS careers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT
);

-- ============================================================
-- 11. CAREER WEIGHTS (maps domains → careers with weights)
-- ============================================================
CREATE TABLE IF NOT EXISTS career_weights (
  id SERIAL PRIMARY KEY,
  career_id INTEGER NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  weight FLOAT NOT NULL,
  UNIQUE(career_id, domain_id)
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_assessment_id ON responses(assessment_id);
CREATE INDEX IF NOT EXISTS idx_computed_scores_assessment_id ON computed_scores(assessment_id);
CREATE INDEX IF NOT EXISTS idx_questions_version_id ON questions(version_id);
CREATE INDEX IF NOT EXISTS idx_questions_domain_id ON questions(domain_id);
CREATE INDEX IF NOT EXISTS idx_strand_weights_strand_id ON strand_weights(strand_id);
CREATE INDEX IF NOT EXISTS idx_strand_weights_domain_id ON strand_weights(domain_id);
CREATE INDEX IF NOT EXISTS idx_career_weights_career_id ON career_weights(career_id);
CREATE INDEX IF NOT EXISTS idx_career_weights_domain_id ON career_weights(domain_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
