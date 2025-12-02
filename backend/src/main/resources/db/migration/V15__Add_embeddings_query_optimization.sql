-- Optimize queries for retrieving person embeddings by home
-- This migration adds indexes to improve performance when fetching embeddings

-- Add index on face_vector to speed up filtering for persons with embeddings
-- Using a partial index that only indexes rows where face_vector is not null
CREATE INDEX idx_persons_face_vector_not_null 
ON persons(face_vector) 
WHERE face_vector IS NOT NULL AND face_vector != '';

-- Add composite index on home_persons for faster joins when filtering by home and active status
-- This helps with the getPersonEmbeddingsByHomeId query
CREATE INDEX idx_home_persons_home_active_person 
ON home_persons(home_id, is_active, person_id) 
WHERE is_active = true;

-- Add comment documenting the optimization
COMMENT ON INDEX idx_persons_face_vector_not_null IS 'Index to optimize queries filtering persons with face embeddings';
COMMENT ON INDEX idx_home_persons_home_active_person IS 'Composite index to optimize queries for active persons by home';

