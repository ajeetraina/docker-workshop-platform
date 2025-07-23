-- Create logging table to track initialization
CREATE TABLE IF NOT EXISTS postgres_logs (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
