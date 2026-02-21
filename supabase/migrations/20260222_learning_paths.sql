-- ============================================================================
-- Learning Paths System
-- Enables admin-curated course sequences with progress tracking
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Ensure helper functions exist (defined in 001_initial_schema but may
-- not have been applied to the live database)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'super_admin' FROM profiles WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 1. Learning Paths table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_paths (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           TEXT NOT NULL,
    title_ar        TEXT,
    description     TEXT,
    description_ar  TEXT,
    slug            TEXT NOT NULL UNIQUE,
    thumbnail_url   TEXT,
    difficulty_level TEXT DEFAULT 'beginner'
                     CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    estimated_hours DECIMAL(6,1) DEFAULT 0,
    is_published    BOOLEAN DEFAULT FALSE,
    is_featured     BOOLEAN DEFAULT FALSE,
    sort_order      INTEGER DEFAULT 0,
    enrollment_count INTEGER DEFAULT 0,
    created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. Learning Path Courses (junction table with ordering)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_path_courses (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    course_id        UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    sort_order       INTEGER DEFAULT 0,
    is_required      BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(learning_path_id, course_id)
);

-- ---------------------------------------------------------------------------
-- 3. Learning Path Enrollments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_path_enrollments (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status           TEXT DEFAULT 'active'
                      CHECK (status IN ('active', 'completed', 'dropped')),
    progress         DECIMAL(5,2) DEFAULT 0,
    enrolled_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(learning_path_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 4. Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_learning_paths_slug
    ON learning_paths(slug);
CREATE INDEX IF NOT EXISTS idx_learning_paths_category
    ON learning_paths(category_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_published
    ON learning_paths(is_published);
CREATE INDEX IF NOT EXISTS idx_learning_paths_featured
    ON learning_paths(is_featured, is_published);
CREATE INDEX IF NOT EXISTS idx_learning_paths_sort
    ON learning_paths(sort_order);

CREATE INDEX IF NOT EXISTS idx_learning_path_courses_path
    ON learning_path_courses(learning_path_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_learning_path_courses_course
    ON learning_path_courses(course_id);

CREATE INDEX IF NOT EXISTS idx_learning_path_enrollments_user
    ON learning_path_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_enrollments_path
    ON learning_path_enrollments(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_enrollments_status
    ON learning_path_enrollments(status);

-- ---------------------------------------------------------------------------
-- 5. Triggers — reuse existing update_updated_at()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_learning_paths_updated_at
    BEFORE UPDATE ON learning_paths
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_learning_path_enrollments_updated_at
    BEFORE UPDATE ON learning_path_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 6. Enrollment count trigger function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_learning_path_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE learning_paths
        SET enrollment_count = enrollment_count + 1
        WHERE id = NEW.learning_path_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE learning_paths
        SET enrollment_count = GREATEST(enrollment_count - 1, 0)
        WHERE id = OLD.learning_path_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_learning_path_enrollment_count
    AFTER INSERT OR DELETE ON learning_path_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_learning_path_enrollment_count();

-- ---------------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_enrollments ENABLE ROW LEVEL SECURITY;

-- Learning Paths: admins manage all
CREATE POLICY "Admins can manage learning paths"
    ON learning_paths FOR ALL
    USING (is_admin());

-- Learning Paths: everyone can read published paths
CREATE POLICY "Anyone can read published learning paths"
    ON learning_paths FOR SELECT
    USING (is_published = true AND auth.uid() IS NOT NULL);

-- Learning Path Courses: admins manage all
CREATE POLICY "Admins can manage learning path courses"
    ON learning_path_courses FOR ALL
    USING (is_admin());

-- Learning Path Courses: authenticated users can read courses of published paths
CREATE POLICY "Authenticated users can read learning path courses"
    ON learning_path_courses FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM learning_paths lp
            WHERE lp.id = learning_path_courses.learning_path_id
              AND lp.is_published = true
        )
    );

-- Learning Path Enrollments: admins manage all
CREATE POLICY "Admins can manage learning path enrollments"
    ON learning_path_enrollments FOR ALL
    USING (is_admin());

-- Learning Path Enrollments: users can read own enrollments
CREATE POLICY "Users can read own learning path enrollments"
    ON learning_path_enrollments FOR SELECT
    USING (user_id = auth.uid());

-- Learning Path Enrollments: users can insert own enrollments
CREATE POLICY "Users can enroll in learning paths"
    ON learning_path_enrollments FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Learning Path Enrollments: users can update own enrollments
CREATE POLICY "Users can update own learning path enrollments"
    ON learning_path_enrollments FOR UPDATE
    USING (user_id = auth.uid());
