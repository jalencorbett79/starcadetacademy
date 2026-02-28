-- Star Cadet Academy - PostgreSQL Database Schema
-- Run this file to initialize the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (Parents)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'parent' NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- CHILD PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS child_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  age SMALLINT NOT NULL CHECK (age BETWEEN 3 AND 5),
  avatar_color VARCHAR(7) DEFAULT '#00d4ff',
  language VARCHAR(2) DEFAULT 'en' CHECK (language IN ('en', 'es')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_child_profiles_parent ON child_profiles(parent_id);

-- ============================================
-- XP PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS xp_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID UNIQUE NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  rank VARCHAR(50) DEFAULT 'beginnerExplorer',
  missions_completed INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active_date DATE,
  -- Skills (0-100 percentage)
  skill_letter_recognition SMALLINT DEFAULT 0 CHECK (skill_letter_recognition BETWEEN 0 AND 100),
  skill_phonics SMALLINT DEFAULT 0 CHECK (skill_phonics BETWEEN 0 AND 100),
  skill_sight_words SMALLINT DEFAULT 0 CHECK (skill_sight_words BETWEEN 0 AND 100),
  skill_counting SMALLINT DEFAULT 0 CHECK (skill_counting BETWEEN 0 AND 100),
  skill_addition SMALLINT DEFAULT 0 CHECK (skill_addition BETWEEN 0 AND 100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_xp_progress_child ON xp_progress(child_id);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  achievement_type VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_achievements_child ON achievements(child_id);

-- ============================================
-- ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('reading', 'counting')),
  module VARCHAR(100) NOT NULL,
  score INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  language VARCHAR(2) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_child ON activity_logs(child_id);
CREATE INDEX idx_activity_logs_date ON activity_logs(created_at);

-- ============================================
-- LANGUAGE PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS language_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID UNIQUE NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  preferred_language VARCHAR(2) DEFAULT 'en' CHECK (preferred_language IN ('en', 'es')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- HELPER FUNCTION: Update timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER child_profiles_updated_at BEFORE UPDATE ON child_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER xp_progress_updated_at BEFORE UPDATE ON xp_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER language_preferences_updated_at BEFORE UPDATE ON language_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
