-- =============================================================================
-- VOUCHER SYSTEM
-- Creates vouchers and voucher_redemptions tables for course access management
-- =============================================================================

-- Voucher type enum
DO $$ BEGIN
    CREATE TYPE voucher_type AS ENUM ('full_access', 'percentage', 'fixed_amount');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- VOUCHERS TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    voucher_type voucher_type NOT NULL DEFAULT 'full_access',
    discount_value DECIMAL(10, 2),
    currency TEXT DEFAULT 'USD',
    max_uses INTEGER,  -- NULL = unlimited
    current_uses INTEGER DEFAULT 0,
    applicable_courses UUID[] DEFAULT '{}',  -- empty = any course
    is_single_use BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- discount_value is required for percentage and fixed_amount types
    CONSTRAINT voucher_discount_check CHECK (
        (voucher_type = 'full_access' AND discount_value IS NULL)
        OR (voucher_type IN ('percentage', 'fixed_amount') AND discount_value IS NOT NULL AND discount_value > 0)
    ),
    -- percentage must be between 1 and 100
    CONSTRAINT voucher_percentage_range CHECK (
        voucher_type != 'percentage' OR (discount_value >= 1 AND discount_value <= 100)
    ),
    -- single-use vouchers always have max_uses = 1
    CONSTRAINT voucher_single_use_check CHECK (
        is_single_use = false OR max_uses IS NULL OR max_uses = 1
    )
);

-- ---------------------------------------------------------------------------
-- VOUCHER REDEMPTIONS TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS voucher_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    -- prevent same user from redeeming same voucher for same course
    UNIQUE(voucher_id, user_id, course_id)
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_is_active ON vouchers(is_active);
CREATE INDEX IF NOT EXISTS idx_vouchers_created_by ON vouchers(created_by);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_voucher_id ON voucher_redemptions(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_user_id ON voucher_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_course_id ON voucher_redemptions(course_id);

-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_vouchers_updated_at
    BEFORE UPDATE ON vouchers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_redemptions ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with vouchers
CREATE POLICY "Admins can manage vouchers"
    ON vouchers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Anyone authenticated can read active vouchers (for validation)
CREATE POLICY "Authenticated users can read active vouchers"
    ON vouchers FOR SELECT
    USING (
        is_active = true
        AND auth.uid() IS NOT NULL
    );

-- Admins can manage all redemptions
CREATE POLICY "Admins can manage voucher redemptions"
    ON voucher_redemptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Users can view their own redemptions
CREATE POLICY "Users can view own redemptions"
    ON voucher_redemptions FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own redemptions
CREATE POLICY "Users can create own redemptions"
    ON voucher_redemptions FOR INSERT
    WITH CHECK (user_id = auth.uid());
