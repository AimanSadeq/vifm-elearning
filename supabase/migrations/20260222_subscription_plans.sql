-- ============================================================================
-- Subscription Plans Catalog
-- Admin-managed plan definitions for the pricing page.
-- Also ensures the `subscriptions` table exists (from initial schema).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0a. Ensure the subscription_plan enum type exists
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
        CREATE TYPE subscription_plan AS ENUM ('monthly', 'quarterly', 'annual', 'lifetime');
    END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 0b. Ensure helper functions exist (defined in 001_initial_schema but may
--     not have been applied to the live database)
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
-- 1. Ensure the subscriptions table exists (defined in initial schema but
--    may not have been created if that migration was partial)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan                   subscription_plan NOT NULL,
    status                 TEXT DEFAULT 'active'
                            CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    price                  DECIMAL(10, 2) NOT NULL,
    currency               TEXT DEFAULT 'USD',
    stripe_subscription_id TEXT,
    stripe_customer_id     TEXT,
    current_period_start   TIMESTAMPTZ,
    current_period_end     TIMESTAMPTZ,
    cancel_at_period_end   BOOLEAN DEFAULT false,
    cancelled_at           TIMESTAMPTZ,
    metadata               JSONB DEFAULT '{}',
    created_at             TIMESTAMPTZ DEFAULT NOW(),
    updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for subscriptions (IF NOT EXISTS for idempotency)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
    ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status
    ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan
    ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id
    ON subscriptions(stripe_subscription_id);

-- Trigger
CREATE OR REPLACE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies (use CREATE OR REPLACE equivalent via DO block for idempotency)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_select_own'
    ) THEN
        CREATE POLICY subscriptions_select_own ON subscriptions
            FOR SELECT USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_all_admin'
    ) THEN
        CREATE POLICY subscriptions_all_admin ON subscriptions
            FOR ALL USING (is_admin());
    END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 2. Subscription Plans table (the new catalog)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              TEXT NOT NULL,
    name_ar           TEXT,
    description       TEXT,
    description_ar    TEXT,
    plan_type         subscription_plan NOT NULL,
    price             DECIMAL(10,2) NOT NULL,
    currency          TEXT DEFAULT 'USD',
    features          JSONB DEFAULT '[]',
    features_ar       JSONB DEFAULT '[]',
    stripe_product_id TEXT,
    stripe_price_id   TEXT,
    is_active         BOOLEAN DEFAULT TRUE,
    sort_order        INTEGER DEFAULT 0,
    created_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata          JSONB DEFAULT '{}',
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 3. Add plan_id FK to subscriptions table
-- ---------------------------------------------------------------------------
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 4. Indexes for subscription_plans
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_subscription_plans_plan_type
    ON subscription_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active
    ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort
    ON subscription_plans(sort_order);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id
    ON subscriptions(plan_id);

-- ---------------------------------------------------------------------------
-- 5. Trigger for subscription_plans
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 6. Row Level Security for subscription_plans
-- ---------------------------------------------------------------------------
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'subscription_plans' AND policyname = 'Admins can manage subscription plans'
    ) THEN
        CREATE POLICY "Admins can manage subscription plans"
            ON subscription_plans FOR ALL
            USING (is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'subscription_plans' AND policyname = 'Anyone can read active subscription plans'
    ) THEN
        CREATE POLICY "Anyone can read active subscription plans"
            ON subscription_plans FOR SELECT
            USING (is_active = true);
    END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 7. Seed default plans
-- ---------------------------------------------------------------------------
INSERT INTO subscription_plans (name, name_ar, plan_type, price, currency, description, description_ar, features, features_ar, is_active, sort_order)
VALUES
    ('Monthly', 'شهري', 'monthly', 49.00, 'USD',
     'Perfect for getting started', 'مثالي للبدء',
     '["Access to all courses", "Course certificates", "Discussion forums", "Mobile access"]'::jsonb,
     '["الوصول إلى جميع الدورات", "شهادات الدورات", "منتديات النقاش", "الوصول عبر الجوال"]'::jsonb,
     true, 1),
    ('Quarterly', 'ربع سنوي', 'quarterly', 129.00, 'USD',
     'Most flexible option', 'الخيار الأكثر مرونة',
     '["Access to all courses", "Course certificates", "Discussion forums", "Mobile access", "Webinar access"]'::jsonb,
     '["الوصول إلى جميع الدورات", "شهادات الدورات", "منتديات النقاش", "الوصول عبر الجوال", "الوصول إلى الندوات"]'::jsonb,
     true, 2),
    ('Annual', 'سنوي', 'annual', 399.00, 'USD',
     'Best value for committed learners', 'أفضل قيمة للمتعلمين الملتزمين',
     '["Access to all courses", "Course certificates", "Discussion forums", "Mobile access", "Webinar access", "Priority support"]'::jsonb,
     '["الوصول إلى جميع الدورات", "شهادات الدورات", "منتديات النقاش", "الوصول عبر الجوال", "الوصول إلى الندوات", "دعم ذو أولوية"]'::jsonb,
     true, 3),
    ('Lifetime', 'مدى الحياة', 'lifetime', 999.00, 'USD',
     'Unlimited access forever', 'وصول غير محدود للأبد',
     '["Access to all courses", "Course certificates", "Discussion forums", "Mobile access", "Webinar access", "Priority support"]'::jsonb,
     '["الوصول إلى جميع الدورات", "شهادات الدورات", "منتديات النقاش", "الوصول عبر الجوال", "الوصول إلى الندوات", "دعم ذو أولوية"]'::jsonb,
     true, 4)
ON CONFLICT DO NOTHING;
