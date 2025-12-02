-- Add automatic access rules to home_persons table
ALTER TABLE home_persons ADD COLUMN IF NOT EXISTS automatic_access_enabled BOOLEAN DEFAULT false;
ALTER TABLE home_persons ADD COLUMN IF NOT EXISTS automatic_access_count INTEGER DEFAULT 0;
ALTER TABLE home_persons ADD COLUMN IF NOT EXISTS automatic_access_limit INTEGER DEFAULT NULL;
ALTER TABLE home_persons ADD COLUMN IF NOT EXISTS automatic_access_reset_period VARCHAR(50) DEFAULT 'MONTHLY'; -- DAILY, WEEKLY, MONTHLY, YEARLY, NEVER
ALTER TABLE home_persons ADD COLUMN IF NOT EXISTS automatic_access_last_reset TIMESTAMPTZ;

-- Create face_recognition_settings table for home-level face recognition configuration
CREATE TABLE IF NOT EXISTS face_recognition_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    home_id VARCHAR(36) NOT NULL UNIQUE,
    ai_detection_enabled BOOLEAN NOT NULL DEFAULT true,
    confidence_threshold INTEGER NOT NULL DEFAULT 80 CHECK (confidence_threshold >= 0 AND confidence_threshold <= 100),
    face_tolerance DOUBLE PRECISION DEFAULT 0.6 CHECK (face_tolerance >= 0 AND face_tolerance <= 1),
    max_recognition_attempts INTEGER DEFAULT 3,
    recognition_cooldown_seconds INTEGER DEFAULT 5,
    require_multiple_angles BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (home_id) REFERENCES homes(id) ON DELETE CASCADE
);

CREATE INDEX idx_face_recognition_settings_home_id ON face_recognition_settings(home_id);

COMMENT ON TABLE face_recognition_settings IS 'Home-level configuration for face recognition and AI detection';
COMMENT ON COLUMN face_recognition_settings.ai_detection_enabled IS 'Whether AI face detection is enabled for this home';
COMMENT ON COLUMN face_recognition_settings.confidence_threshold IS 'Confidence threshold (0-100) for face recognition matches';
COMMENT ON COLUMN face_recognition_settings.face_tolerance IS 'Face matching tolerance (0-1), lower is stricter';
COMMENT ON COLUMN home_persons.automatic_access_enabled IS 'Whether this person has automatic access enabled';
COMMENT ON COLUMN home_persons.automatic_access_count IS 'Current count of automatic access uses';
COMMENT ON COLUMN home_persons.automatic_access_limit IS 'Maximum number of automatic accesses allowed (NULL = unlimited)';
COMMENT ON COLUMN home_persons.automatic_access_reset_period IS 'Period for resetting automatic access count';

