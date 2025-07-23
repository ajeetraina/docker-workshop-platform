-- Create demo user for development and testing
-- Email: demo@docker.com
-- Password: password123

INSERT INTO users (
    id,
    email,
    username,
    full_name,
    password_hash,
    role,
    email_verified,
    is_active
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'demo@docker.com',
    'demo',
    'Demo User',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewBhBr1pJcEVAhyG',
    'student',
    true,
    true
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    is_active = true,
    email_verified = true,
    updated_at = NOW();

SELECT 'Demo user created: demo@docker.com / password123' as status;
