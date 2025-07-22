-- Sample data for Docker Workshop Platform
-- This file provides initial data for development and testing

-- Insert sample courses
INSERT INTO courses (slug, title, description, short_description, difficulty, estimated_duration_minutes, prerequisites, learning_objectives, is_published, created_by) VALUES
('docker-fundamentals', 
 'Docker Fundamentals', 
 'Master the basics of Docker containerization. Learn to build, run, and manage containers effectively. This comprehensive course covers Docker concepts, image creation, container orchestration basics, and best practices for development workflows.',
 'Learn Docker basics: containers, images, and essential commands',
 'beginner', 
 120, 
 ARRAY['Basic command line knowledge', 'Understanding of software development concepts'],
 ARRAY['Understand containerization concepts', 'Build and run Docker containers', 'Create custom Docker images', 'Manage container data and networking', 'Apply Docker best practices'],
 true,
 (SELECT id FROM users WHERE email = 'admin@docker.com')
),

('docker-compose-deep-dive',
 'Docker Compose Deep Dive',
 'Learn to orchestrate multi-container applications with Docker Compose. Explore service definitions, networking, volumes, and environment management. Perfect for developers building complex applications with multiple services.',
 'Master multi-container applications with Docker Compose',
 'intermediate',
 180,
 ARRAY['Docker fundamentals', 'YAML basics', 'Understanding of web application architecture'],
 ARRAY['Define multi-service applications', 'Configure service networking', 'Manage application data with volumes', 'Handle environment variables and secrets', 'Deploy applications with docker-compose'],
 true,
 (SELECT id FROM users WHERE email = 'admin@docker.com')
),

('kubernetes-introduction',
 'Introduction to Kubernetes',
 'Transition from Docker containers to Kubernetes orchestration. Learn cluster architecture, pod management, services, and deployments. Build production-ready containerized applications at scale.',
 'Scale your containers with Kubernetes orchestration',
 'advanced',
 240,
 ARRAY['Docker expertise', 'Basic networking knowledge', 'YAML proficiency', 'Linux command line'],
 ARRAY['Understand Kubernetes architecture', 'Deploy applications to clusters', 'Configure services and ingress', 'Manage application scaling', 'Implement health checks and rolling updates'],
 true,
 (SELECT id FROM users WHERE email = 'admin@docker.com')
),

('docker-security-best-practices',
 'Docker Security Best Practices',
 'Secure your Docker environment from development to production. Learn about image scanning, secrets management, network security, and compliance. Essential for production deployments.',
 'Implement security best practices for Docker containers',
 'intermediate',
 150,
 ARRAY['Docker fundamentals', 'Basic security concepts', 'Understanding of development workflows'],
 ARRAY['Implement container security scanning', 'Manage secrets and sensitive data', 'Configure secure networking', 'Apply least privilege principles', 'Set up compliance monitoring'],
 true,
 (SELECT id FROM users WHERE email = 'admin@docker.com')
);

-- Get course IDs for lab insertion
DO $$
DECLARE
    docker_fundamentals_id UUID;
    docker_compose_id UUID;
    kubernetes_id UUID;
    docker_security_id UUID;
BEGIN
    SELECT id INTO docker_fundamentals_id FROM courses WHERE slug = 'docker-fundamentals';
    SELECT id INTO docker_compose_id FROM courses WHERE slug = 'docker-compose-deep-dive';
    SELECT id INTO kubernetes_id FROM courses WHERE slug = 'kubernetes-introduction';
    SELECT id INTO docker_security_id FROM courses WHERE slug = 'docker-security-best-practices';

    -- Insert labs for Docker Fundamentals
    INSERT INTO labs (course_id, order_number, slug, title, description, estimated_duration_minutes, content_repo_url, is_published) VALUES
    (docker_fundamentals_id, 1, 'what-is-docker', 'What is Docker?', 'Introduction to containerization concepts and Docker overview. Learn why containers matter and how Docker solves development challenges.', 15, 'https://github.com/dockersamples/workshop-fundamentals-01', true),
    (docker_fundamentals_id, 2, 'first-container', 'Your First Container', 'Run your first Docker container and explore basic commands. Understand the difference between images and containers.', 20, 'https://github.com/dockersamples/workshop-fundamentals-02', true),
    (docker_fundamentals_id, 3, 'docker-images', 'Working with Images', 'Learn to pull, list, and manage Docker images. Understand image layers and the Docker Hub registry.', 25, 'https://github.com/dockersamples/workshop-fundamentals-03', true),
    (docker_fundamentals_id, 4, 'building-images', 'Building Custom Images', 'Create your first Dockerfile and build custom images. Learn Dockerfile best practices and layer optimization.', 30, 'https://github.com/dockersamples/workshop-fundamentals-04', true),
    (docker_fundamentals_id, 5, 'container-data', 'Managing Container Data', 'Work with volumes and bind mounts to persist data. Understand container filesystem and data management strategies.', 30, 'https://github.com/dockersamples/workshop-fundamentals-05', true);

    -- Insert labs for Docker Compose
    INSERT INTO labs (course_id, order_number, slug, title, description, estimated_duration_minutes, content_repo_url, is_published) VALUES
    (docker_compose_id, 1, 'compose-basics', 'Docker Compose Basics', 'Introduction to Docker Compose and YAML syntax. Create your first multi-container application.', 30, 'https://github.com/dockersamples/workshop-compose-01', true),
    (docker_compose_id, 2, 'service-networking', 'Service Networking', 'Configure networking between services. Learn about service discovery and internal communication.', 35, 'https://github.com/dockersamples/workshop-compose-02', true),
    (docker_compose_id, 3, 'volumes-and-data', 'Volumes and Data Management', 'Manage persistent data in multi-container applications. Configure volumes and handle database containers.', 40, 'https://github.com/dockersamples/workshop-compose-03', true),
    (docker_compose_id, 4, 'environment-config', 'Environment Configuration', 'Handle environment variables, secrets, and configuration files. Learn about different deployment environments.', 35, 'https://github.com/dockersamples/workshop-compose-04', true),
    (docker_compose_id, 5, 'production-deployment', 'Production Deployment', 'Deploy Docker Compose applications to production. Learn about scaling, monitoring, and maintenance.', 40, 'https://github.com/dockersamples/workshop-compose-05', true);

    -- Insert labs for Kubernetes Introduction
    INSERT INTO labs (course_id, order_number, slug, title, description, estimated_duration_minutes, content_repo_url, is_published) VALUES
    (kubernetes_id, 1, 'k8s-architecture', 'Kubernetes Architecture', 'Understand Kubernetes cluster components and architecture. Learn about master nodes, worker nodes, and core services.', 30, 'https://github.com/dockersamples/workshop-k8s-01', true),
    (kubernetes_id, 2, 'pods-and-containers', 'Pods and Containers', 'Deploy your first pods and understand the relationship between containers and pods. Learn pod lifecycle management.', 35, 'https://github.com/dockersamples/workshop-k8s-02', true),
    (kubernetes_id, 3, 'deployments-services', 'Deployments and Services', 'Create deployments for application management and services for network access. Understand replica sets and scaling.', 45, 'https://github.com/dockersamples/workshop-k8s-03', true),
    (kubernetes_id, 4, 'configmaps-secrets', 'ConfigMaps and Secrets', 'Manage application configuration and sensitive data. Learn to inject configuration into pods securely.', 40, 'https://github.com/dockersamples/workshop-k8s-04', true),
    (kubernetes_id, 5, 'ingress-networking', 'Ingress and Networking', 'Configure external access to services through ingress controllers. Understand Kubernetes networking concepts.', 50, 'https://github.com/dockersamples/workshop-k8s-05', true),
    (kubernetes_id, 6, 'monitoring-health', 'Health Checks and Monitoring', 'Implement liveness and readiness probes. Set up basic monitoring and logging for applications.', 40, 'https://github.com/dockersamples/workshop-k8s-06', true);

    -- Insert labs for Docker Security
    INSERT INTO labs (course_id, order_number, slug, title, description, estimated_duration_minutes, content_repo_url, is_published) VALUES
    (docker_security_id, 1, 'security-overview', 'Docker Security Overview', 'Understand the Docker security model and common vulnerabilities. Learn about the shared responsibility model.', 20, 'https://github.com/dockersamples/workshop-security-01', true),
    (docker_security_id, 2, 'image-security', 'Image Security Scanning', 'Scan Docker images for vulnerabilities and implement security best practices in your build pipeline.', 35, 'https://github.com/dockersamples/workshop-security-02', true),
    (docker_security_id, 3, 'secrets-management', 'Secrets Management', 'Securely manage sensitive data like passwords, API keys, and certificates in containerized applications.', 30, 'https://github.com/dockersamples/workshop-security-03', true),
    (docker_security_id, 4, 'runtime-security', 'Runtime Security', 'Implement runtime security controls including user namespaces, capabilities, and security profiles.', 35, 'https://github.com/dockersamples/workshop-security-04', true),
    (docker_security_id, 5, 'network-security', 'Network Security', 'Secure container networking with firewalls, network policies, and encrypted communication.', 30, 'https://github.com/dockersamples/workshop-security-05', true);

END $$;

-- Insert sample user for demo
INSERT INTO users (email, username, full_name, password_hash, role, email_verified)
VALUES 
('demo@docker.com', 'demo', 'Demo User', '$2b$12$9fUIaSkqyMGbxGvGLO26Yup0CcqpEyh8fkGKL4yKZFOWaRtZGJEVm', 'student', true)
ON CONFLICT (email) DO NOTHING;

-- Enroll demo user in some courses
INSERT INTO enrollments (user_id, course_id, enrolled_at)
SELECT 
    (SELECT id FROM users WHERE email = 'demo@docker.com'),
    c.id,
    CURRENT_TIMESTAMP - INTERVAL '5 days'
FROM courses c 
WHERE c.slug IN ('docker-fundamentals', 'docker-compose-deep-dive')
ON CONFLICT (user_id, course_id) DO NOTHING;

-- Add some sample progress for the demo user
INSERT INTO user_lab_progress (user_id, lab_id, status, started_at, completed_at, attempts)
SELECT 
    (SELECT id FROM users WHERE email = 'demo@docker.com'),
    l.id,
    CASE 
        WHEN l.order_number <= 3 THEN 'completed'::lab_status
        WHEN l.order_number = 4 THEN 'in_progress'::lab_status
        ELSE 'not_started'
    END as status,
    CASE 
        WHEN l.order_number <= 4 THEN CURRENT_TIMESTAMP - INTERVAL '2 days'
        ELSE NULL
    END as started_at,
    CASE 
        WHEN l.order_number <= 3 THEN CURRENT_TIMESTAMP - INTERVAL '1 day'
        ELSE NULL
    END as completed_at,
    CASE 
        WHEN l.order_number <= 4 THEN 1
        ELSE 0
    END as attempts
FROM labs l
JOIN courses c ON l.course_id = c.id
WHERE c.slug = 'docker-fundamentals'
ON CONFLICT (user_id, lab_id) DO NOTHING;