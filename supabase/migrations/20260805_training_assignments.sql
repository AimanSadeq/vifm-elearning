-- ============================================================================
-- Training Assignments System
-- Admin-assigned mandatory training (course or learning path) with due dates,
-- reminder tracking, and completion sync. Also adds profiles.department for
-- department-level compliance reporting.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Department dimension on profiles
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_department
    ON profiles(department)
    WHERE department IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Training Assignments table
--    Exactly one of course_id / learning_path_id is set per row.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS training_assignments (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id        UUID REFERENCES courses(id) ON DELETE CASCADE,
    learning_path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    assigned_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    due_date         DATE,
    is_mandatory     BOOLEAN DEFAULT TRUE,
    status           TEXT DEFAULT 'assigned'
                     CHECK (status IN ('assigned', 'completed', 'cancelled')),
    completed_at     TIMESTAMPTZ,
    note             TEXT,
    last_reminder_at TIMESTAMPTZ,
    reminders_sent   INTEGER DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),

    CHECK ((course_id IS NOT NULL) <> (learning_path_id IS NOT NULL))
);

-- One live assignment per user per target; cancelled rows don't block re-assign.
CREATE UNIQUE INDEX IF NOT EXISTS uq_training_assignments_user_course
    ON training_assignments(user_id, course_id)
    WHERE course_id IS NOT NULL AND status <> 'cancelled';

CREATE UNIQUE INDEX IF NOT EXISTS uq_training_assignments_user_path
    ON training_assignments(user_id, learning_path_id)
    WHERE learning_path_id IS NOT NULL AND status <> 'cancelled';

CREATE INDEX IF NOT EXISTS idx_training_assignments_user
    ON training_assignments(user_id, status);

CREATE INDEX IF NOT EXISTS idx_training_assignments_due
    ON training_assignments(status, due_date)
    WHERE status = 'assigned';

CREATE INDEX IF NOT EXISTS idx_training_assignments_course
    ON training_assignments(course_id);

CREATE INDEX IF NOT EXISTS idx_training_assignments_path
    ON training_assignments(learning_path_id);

-- ---------------------------------------------------------------------------
-- 3. Triggers — reuse existing update_updated_at()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_training_assignments_updated_at
    BEFORE UPDATE ON training_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE training_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage training assignments"
    ON training_assignments FOR ALL
    USING (is_admin());

CREATE POLICY "Users can read own training assignments"
    ON training_assignments FOR SELECT
    USING (user_id = auth.uid());

-- Corporate admins can see assignments for members of their organization
-- (read-only; management stays with super_admin and server-side routes).
CREATE POLICY "Corporate admins can read org training assignments"
    ON training_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM profiles me
            JOIN profiles target ON target.id = training_assignments.user_id
            WHERE me.id = auth.uid()
              AND me.role = 'corporate_admin'
              AND me.organization_id IS NOT NULL
              AND me.organization_id = target.organization_id
        )
    );
