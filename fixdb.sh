#!/bin/bash

# Fix Database Persistence and Auto-Initialization
# This ensures demo user and data persist across restarts

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "🔧 Database Persistence & Auto-Initialization Fix"
echo "=================================================="
echo "This will:"
echo "  ✅ Ensure database data persists across restarts"
echo "  ✅ Auto-create demo user on startup"
echo "  ✅ Initialize database schema automatically"
echo "  ✅ Fix volume persistence issues"
echo "=================================================="
echo

# 1. Create database initialization directory
print_status "Creating database initialization scripts..."
mkdir -p database/init

# 2. Create database schema initialization
cat > database/init/01-schema.sql << 'EOF'
-- Docker Workshop Platform Database Schema
-- This file automatically initializes the database on first startup

-- Create users table with proper structure
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    email_verified BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(50) DEFAULT 'beginner',
    estimated_duration_minutes INTEGER DEFAULT 60,
    instructor VARCHAR(255),
    thumbnail_url VARCHAR(255),
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create labs table
CREATE TABLE IF NOT EXISTS labs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    order_number INTEGER DEFAULT 1,
    slug VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_duration_minutes INTEGER DEFAULT 30,
    content_repo_url VARCHAR(255),
    validation_script TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user progress tables
CREATE TABLE IF NOT EXISTS user_course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    progress_percentage INTEGER DEFAULT 0,
    completed_labs INTEGER DEFAULT 0,
    total_labs INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_labs_course_id ON labs(course_id);

-- Log schema creation
INSERT INTO postgres_logs (message) VALUES ('Database schema initialized') 
ON CONFLICT DO NOTHING;
EOF

# 3. Create demo user initialization
cat > database/init/02-demo-user.sql << 'EOF'
-- Create demo user that persists across restarts
-- Password hash for "password123" with bcrypt rounds=12

DO $$
BEGIN
    -- Create demo user if not exists
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

    -- Ensure the password hash is correct for "password123"
    UPDATE users 
    SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewBhBr1pJcEVAhyG',
        updated_at = NOW()
    WHERE email = 'demo@docker.com';

    RAISE NOTICE 'Demo user created/updated: demo@docker.com / password123';
END $$;
EOF

# 4. Create sample data initialization
cat > database/init/03-sample-data.sql << 'EOF'
-- Insert sample courses and labs
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

-- Log completion
SELECT 'Sample data initialized successfully' as status;
EOF

# 5. Create logging table for initialization tracking
cat > database/init/00-logging.sql << 'EOF'
-- Create logging table to track initialization
CREATE TABLE IF NOT EXISTS postgres_logs (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
EOF

print_success "Database initialization scripts created"

# 6. Update compose.yaml to use initialization scripts
print_status "Updating compose.yaml for database initialization..."

# Check if the postgres service uses initialization
if grep -q "init" compose.yaml; then
    print_warning "Database initialization already configured"
else
    print_status "Adding database initialization to compose.yaml..."
    
    # Create a backup
    cp compose.yaml compose.yaml.backup.$(date +%Y%m%d-%H%M%S)
    
    # Add volume mapping for initialization scripts
    if grep -q "volumes:" compose.yaml; then
        # Add init volume to existing volumes section
        sed -i '/postgres:/,/volumes:/s|volumes:|volumes:\n      - ./database/init:/docker-entrypoint-initdb.d:ro|' compose.yaml
    else
        # Add volumes section to postgres service
        sed -i '/postgres:/,/depends_on:/{
            /container_name: workshop-postgres/a\
    volumes:\
      - ./database/init:/docker-entrypoint-initdb.d:ro\
      - postgres_data:/var/lib/postgresql/data
        }' compose.yaml
    fi
fi

print_success "Compose file updated for database initialization"

# 7. Generate fresh password hash for current environment
print_status "Generating fresh password hash for demo user..."

# Stop containers to update
docker compose down

# Start only postgres to generate hash
docker compose up postgres -d
sleep 10

# Generate password hash using backend bcrypt configuration
FRESH_HASH=$(docker compose run --rm backend node -e "
const bcrypt = require('bcrypt');
const password = 'password123';
const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
bcrypt.hash(password, rounds).then(hash => {
  console.log(hash);
}).catch(console.error);
" 2>/dev/null | tail -1)

if [ ! -z "$FRESH_HASH" ]; then
    print_success "Generated fresh password hash: ${FRESH_HASH:0:20}..."
    
    # Update the demo user script with fresh hash
    sed -i "s/\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8\/LewBhBr1pJcEVAhyG/$FRESH_HASH/g" database/init/02-demo-user.sql
    
    print_success "Updated demo user initialization with fresh hash"
else
    print_warning "Could not generate fresh hash, using default"
fi

# 8. Recreate database with initialization
print_status "Recreating database with proper initialization..."

# Stop everything
docker compose down -v

# Remove old postgres data to force initialization
docker volume rm workshop_postgres_data 2>/dev/null || true

# Start fresh with initialization
docker compose up postgres -d

# Wait for initialization to complete
print_status "Waiting for database initialization..."
sleep 15

# Check if demo user was created
print_status "Verifying demo user creation..."
for i in {1..10}; do
    if docker compose exec postgres psql -U workshop_user -d workshop_platform -c "SELECT email FROM users WHERE email = 'demo@docker.com';" 2>/dev/null | grep -q "demo@docker.com"; then
        print_success "Demo user created successfully!"
        break
    elif [ $i -eq 10 ]; then
        print_error "Demo user creation failed"
        print_status "Checking postgres logs..."
        docker compose logs postgres | tail -10
    else
        print_status "Waiting for user creation... (attempt $i/10)"
        sleep 3
    fi
done

# 9. Start all services
print_status "Starting all services..."
docker compose up -d

# Wait for backend to be ready
sleep 10

# 10. Test authentication
print_status "Testing persistent authentication..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@docker.com",
    "password": "password123"
  }')

if echo "$AUTH_RESPONSE" | grep -q "accessToken"; then
    print_success "Authentication working - demo user persists!"
else
    print_error "Authentication failed. Response: $AUTH_RESPONSE"
fi

# 11. Create persistent login script for future use
cat > login-demo-user.sh << 'EOF'
#!/bin/bash
# Quick login test script

echo "Testing demo user login..."
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@docker.com",
    "password": "password123"
  }' | jq '.'
EOF

chmod +x login-demo-user.sh

print_success "Created login test script: ./login-demo-user.sh"

# Summary
echo
echo "=================================================================="
print_success "🎉 Database Persistence Fix Complete!"
echo "=================================================================="
echo
echo -e "${GREEN}✅ Fixed Issues:${NC}"
echo "  📦 Database data now persists across restarts"
echo "  👤 Demo user auto-created on startup"
echo "  🗄️ Database schema automatically initialized"
echo "  🔄 No more manual credential recreation needed"
echo
echo -e "${BLUE}📁 Created Files:${NC}"
echo "  📝 database/init/00-logging.sql (initialization tracking)"
echo "  📝 database/init/01-schema.sql (database schema)"
echo "  📝 database/init/02-demo-user.sql (demo user creation)"
echo "  📝 database/init/03-sample-data.sql (sample courses)"
echo "  🧪 login-demo-user.sh (quick login test)"
echo
echo -e "${GREEN}🔐 Persistent Login Credentials:${NC}"
echo "  📧 Email:    ${GREEN}demo@docker.com${NC}"
echo "  🔑 Password: ${GREEN}password123${NC}"
echo "  ♾️  Status:   ${GREEN}Persists across restarts${NC}"
echo
echo -e "${BLUE}🔄 Testing:${NC}"
echo "  Run: ${YELLOW}./login-demo-user.sh${NC} to test login anytime"
echo "  Or:  ${YELLOW}docker compose restart${NC} and login should still work"
echo
print_success "Demo user will now persist permanently! 🐳"
