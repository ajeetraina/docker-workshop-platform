-- Docker Workshop Platform Database Schema
-- Version: 1.0.0
-- Author: Ajeet Singh Raina
-- Description: Complete database schema for the workshop platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE course_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE lab_status AS ENUM ('not_started', 'in_progress', 'completed', 'failed');
CREATE TYPE session_status AS ENUM ('pending', 'active', 'completed', 'expired', 'failed');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'student',
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    difficulty course_difficulty NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL,
    prerequisites TEXT[],
    learning_objectives TEXT[],
    image_url VARCHAR(500),
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Labs table (individual labs within courses)
CREATE TABLE labs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    order_number INTEGER NOT NULL,
    slug VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL,
    content_repo_url VARCHAR(500) NOT NULL,
    validation_script TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, order_number),
    UNIQUE(course_id, slug)
);

-- User course enrollments
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed_at TIMESTAMP,
    UNIQUE(user_id, course_id)
);

-- User progress on individual labs
CREATE TABLE user_lab_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    status lab_status DEFAULT 'not_started',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    workspace_data JSONB,
    validation_results JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lab_id)
);

-- Active workshop sessions
CREATE TABLE workshop_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    instance_id VARCHAR(100) UNIQUE NOT NULL,
    workspace_url VARCHAR(500) NOT NULL,
    status session_status DEFAULT 'pending',
    container_ids JSONB,
    allocated_ports JSONB,
    kubernetes_namespace VARCHAR(100),
    expires_at TIMESTAMP NOT NULL,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User achievements/badges
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon_url VARCHAR(500),
    criteria JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User earned achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- System settings
CREATE TABLE settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for important events
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_difficulty ON courses(difficulty);
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_labs_course_id ON labs(course_id);
CREATE INDEX idx_labs_order ON labs(course_id, order_number);
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_user_lab_progress_user_id ON user_lab_progress(user_id);
CREATE INDEX idx_user_lab_progress_lab_id ON user_lab_progress(lab_id);
CREATE INDEX idx_user_lab_progress_status ON user_lab_progress(status);
CREATE INDEX idx_workshop_sessions_user_id ON workshop_sessions(user_id);
CREATE INDEX idx_workshop_sessions_status ON workshop_sessions(status);
CREATE INDEX idx_workshop_sessions_expires_at ON workshop_sessions(expires_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_labs_updated_at BEFORE UPDATE ON labs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_lab_progress_updated_at BEFORE UPDATE ON user_lab_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workshop_sessions_updated_at BEFORE UPDATE ON workshop_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO settings (key, value, description) VALUES 
    ('max_concurrent_sessions_per_user', '3', 'Maximum number of concurrent workshop sessions per user'),
    ('session_timeout_minutes', '120', 'Default session timeout in minutes'),
    ('max_session_extension_minutes', '60', 'Maximum time a session can be extended'),
    ('cleanup_expired_sessions_interval', '300', 'Interval in seconds to cleanup expired sessions'),
    ('max_workshop_instances', '500', 'Maximum total workshop instances allowed'),
    ('registration_enabled', 'true', 'Whether new user registration is enabled'),
    ('email_verification_required', 'false', 'Whether email verification is required for new accounts');

-- Insert default achievements
INSERT INTO achievements (slug, title, description, icon_url, criteria) VALUES 
    ('first-container', 'Container Rookie', 'Successfully ran your first container', '/icons/first-container.svg', '{"type": "lab_completion", "lab_slug": "first-container"}'),
    ('docker-fundamentals', 'Docker Fundamentals Graduate', 'Completed the Docker Fundamentals course', '/icons/docker-fundamentals.svg', '{"type": "course_completion", "course_slug": "docker-fundamentals"}'),
    ('speed-learner', 'Speed Learner', 'Completed 5 labs in one day', '/icons/speed-learner.svg', '{"type": "daily_labs", "count": 5}'),
    ('persistence-champion', 'Persistence Champion', 'Logged in for 7 consecutive days', '/icons/persistence.svg', '{"type": "consecutive_logins", "days": 7}');

-- Create a view for course progress summary
CREATE VIEW course_progress_summary AS
SELECT 
    e.user_id,
    e.course_id,
    c.title as course_title,
    c.slug as course_slug,
    COUNT(l.id) as total_labs,
    COUNT(CASE WHEN ulp.status = 'completed' THEN 1 END) as completed_labs,
    ROUND(
        (COUNT(CASE WHEN ulp.status = 'completed' THEN 1 END)::FLOAT / COUNT(l.id)) * 100, 
        2
    ) as completion_percentage,
    e.enrolled_at,
    e.last_accessed_at,
    MAX(ulp.updated_at) as last_lab_activity
FROM enrollments e
JOIN courses c ON e.course_id = c.id
JOIN labs l ON c.id = l.course_id
LEFT JOIN user_lab_progress ulp ON l.id = ulp.lab_id AND e.user_id = ulp.user_id
GROUP BY e.user_id, e.course_id, c.title, c.slug, e.enrolled_at, e.last_accessed_at;

-- Create a view for user dashboard statistics
CREATE VIEW user_dashboard_stats AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT e.course_id) as enrolled_courses,
    COUNT(DISTINCT CASE WHEN cps.completion_percentage = 100 THEN e.course_id END) as completed_courses,
    COUNT(DISTINCT ulp.lab_id) filter (WHERE ulp.status = 'completed') as completed_labs,
    COUNT(DISTINCT ws.id) filter (WHERE ws.status = 'active') as active_sessions,
    COUNT(DISTINCT ua.achievement_id) as earned_achievements
FROM users u
LEFT JOIN enrollments e ON u.id = e.user_id
LEFT JOIN course_progress_summary cps ON u.id = cps.user_id AND e.course_id = cps.course_id
LEFT JOIN user_lab_progress ulp ON u.id = ulp.user_id
LEFT JOIN workshop_sessions ws ON u.id = ws.user_id
LEFT JOIN user_achievements ua ON u.id = ua.user_id
GROUP BY u.id;

-- Create RLS (Row Level Security) policies for multi-tenancy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lab_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own data
CREATE POLICY user_own_data ON users FOR ALL USING (id = current_setting('app.current_user_id')::UUID);
CREATE POLICY user_own_progress ON user_lab_progress FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY user_own_sessions ON workshop_sessions FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY user_own_enrollments ON enrollments FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY user_own_achievements ON user_achievements FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

-- Comment on important tables
COMMENT ON TABLE users IS 'Platform users including students, instructors, and admins';
COMMENT ON TABLE courses IS 'Available courses with metadata and configuration';
COMMENT ON TABLE labs IS 'Individual lab exercises within courses';
COMMENT ON TABLE workshop_sessions IS 'Active workshop instances with resource allocation';
COMMENT ON TABLE user_lab_progress IS 'User progress tracking for individual labs';
COMMENT ON TABLE audit_logs IS 'System audit trail for security and debugging';

-- Add sample data for development
INSERT INTO users (email, username, full_name, password_hash, role) VALUES 
    ('admin@docker.com', 'admin', 'Admin User', '$2b$10$9fUIaSkqyMGbxGvGLO26Yup0CcqpEyh8fkGKL4yKZFOWaRtZGJEVm', 'admin'),
    ('instructor@docker.com', 'instructor', 'Instructor User', '$2b$10$9fUIaSkqyMGbxGvGLO26Yup0CcqpEyh8fkGKL4yKZFOWaRtZGJEVm', 'instructor');

-- Sample course data will be added via seeds/migrations
