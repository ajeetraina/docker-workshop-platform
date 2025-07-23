-- Sample courses and labs for development

-- Insert sample courses
INSERT INTO courses (id, title, description, difficulty, estimated_duration_minutes, instructor) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Docker Fundamentals',
    'Learn Docker basics: containers, images, and essential commands',
    'beginner',
    120,
    'Docker Team'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Docker Compose Deep Dive',
    'Master multi-container applications with Docker Compose',
    'intermediate',
    180,
    'Docker Team'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Introduction to Kubernetes',
    'Scale your containers with Kubernetes orchestration',
    'advanced',
    240,
    'Docker Team'
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    'Docker Security Best Practices',
    'Secure your Docker containers and infrastructure',
    'intermediate',
    150,
    'Docker Team'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Insert sample labs for Docker Fundamentals
INSERT INTO labs (id, course_id, order_number, slug, title, description, estimated_duration_minutes) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440001',
    1,
    'getting-started',
    'Getting Started with Docker',
    'Your first Docker container - run hello-world',
    30
),
(
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440001',
    2,
    'working-with-images',
    'Working with Docker Images',
    'Learn to pull, build, and manage Docker images',
    45
),
(
    '550e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440001',
    3,
    'dockerfile-basics',
    'Dockerfile Basics',
    'Create your first Dockerfile and build custom images',
    45
),
(
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440001',
    4,
    'container-networking',
    'Container Networking',
    'Connect containers and manage networks',
    60
),
(
    '550e8400-e29b-41d4-a716-446655440014',
    '550e8400-e29b-41d4-a716-446655440001',
    5,
    'docker-volumes',
    'Docker Volumes',
    'Persist data with Docker volumes',
    45
)
ON CONFLICT (id) DO NOTHING;

-- Insert labs for Docker Compose course
INSERT INTO labs (id, course_id, order_number, slug, title, description, estimated_duration_minutes) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440020',
    '550e8400-e29b-41d4-a716-446655440002',
    1,
    'compose-basics',
    'Docker Compose Basics',
    'Your first multi-container application',
    45
),
(
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440002',
    2,
    'compose-services',
    'Defining Services',
    'Create and configure multiple services',
    60
),
(
    '550e8400-e29b-41d4-a716-446655440022',
    '550e8400-e29b-41d4-a716-446655440002',
    3,
    'compose-networking',
    'Compose Networking',
    'Connect services with custom networks',
    45
),
(
    '550e8400-e29b-41d4-a716-446655440023',
    '550e8400-e29b-41d4-a716-446655440002',
    4,
    'compose-volumes',
    'Compose Volumes',
    'Manage data persistence in compose',
    30
),
(
    '550e8400-e29b-41d4-a716-446655440024',
    '550e8400-e29b-41d4-a716-446655440002',
    5,
    'compose-production',
    'Production Deployment',
    'Deploy compose apps to production',
    60
)
ON CONFLICT (id) DO NOTHING;

SELECT 'Sample data initialized successfully' as status;
