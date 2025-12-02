-- Enhance access_logs table to support home operations and make device_id optional
-- Add home_id column for direct home operations (when device_id might be null)
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS home_id VARCHAR(36);

-- Add foreign key constraint for home_id
ALTER TABLE access_logs ADD CONSTRAINT fk_access_logs_home 
    FOREIGN KEY (home_id) REFERENCES homes(id) ON DELETE CASCADE;

-- Make device_id nullable for home CRUD operations
ALTER TABLE access_logs ALTER COLUMN device_id DROP NOT NULL;

-- Create index for home_id queries
CREATE INDEX IF NOT EXISTS idx_access_logs_home_id ON access_logs(home_id);

-- Create composite index for home operations
CREATE INDEX IF NOT EXISTS idx_access_logs_home_created ON access_logs(home_id, created_at DESC);

-- Add comments
COMMENT ON COLUMN access_logs.home_id IS 'Direct reference to home for home CRUD operations (can be null if accessed via device)';

