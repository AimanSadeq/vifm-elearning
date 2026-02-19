-- ============================================================================
-- VIFM eLearning Portal - Initial Database Schema Migration
-- ============================================================================
-- This migration creates the complete schema for the VIFM eLearning Portal
-- including tables, enums, functions, triggers, RLS policies, and views.
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('super_admin', 'instructor', 'corporate_admin', 'learner');
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'expired', 'suspended');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('stripe', 'paytabs', 'bank_transfer', 'promo_code', 'corporate_license');
CREATE TYPE content_type AS ENUM ('video', 'document', 'quiz', 'assignment');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'multi_select');
CREATE TYPE notification_channel AS ENUM ('email', 'whatsapp', 'in_app');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE webinar_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
CREATE TYPE forum_post_type AS ENUM ('question', 'discussion', 'announcement');
CREATE TYPE subscription_plan AS ENUM ('monthly', 'quarterly', 'annual', 'lifetime');
CREATE TYPE certificate_status AS ENUM ('issued', 'revoked', 'expired');

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- organizations (created BEFORE profiles since profiles references it)
-- ----------------------------------------------------------------------------
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    domain TEXT,
    max_licenses INTEGER DEFAULT 0,
    used_licenses INTEGER DEFAULT 0,
    subscription_plan subscription_plan,
    subscription_expires_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- profiles (references auth.users and organizations)
-- ----------------------------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role DEFAULT 'learner',
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    phone TEXT,
    bio TEXT,
    job_title TEXT,
    linkedin_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- categories (with seed data)
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
    ('Finance & Banking', 'finance-banking', 'Courses on financial analysis, banking operations, and investment management', 1),
    ('Data Analytics & AI', 'data-analytics-ai', 'Courses on data science, machine learning, and artificial intelligence', 2),
    ('Strategy & Leadership', 'strategy-leadership', 'Courses on strategic management, leadership development, and organizational growth', 3),
    ('Compliance & Risk Management', 'compliance-risk-management', 'Courses on regulatory compliance, risk assessment, and governance frameworks', 4);

-- ----------------------------------------------------------------------------
-- courses
-- ----------------------------------------------------------------------------
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    thumbnail_url TEXT,
    preview_video_url TEXT,
    instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    status course_status DEFAULT 'draft',
    price DECIMAL(10, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    duration_hours DECIMAL(5, 2) DEFAULT 0,
    level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    language TEXT DEFAULT 'en',
    prerequisites TEXT[],
    learning_outcomes TEXT[],
    tags TEXT[],
    max_enrollments INTEGER,
    enrollment_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_free BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    certificate_enabled BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- modules
-- ----------------------------------------------------------------------------
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- lessons
-- ----------------------------------------------------------------------------
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content_type content_type DEFAULT 'video',
    content_url TEXT,
    content_body TEXT,
    duration_minutes INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_preview BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    resources JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- quizzes
-- ----------------------------------------------------------------------------
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    passing_score DECIMAL(5, 2) DEFAULT 70.00,
    max_attempts INTEGER DEFAULT 3,
    time_limit_minutes INTEGER,
    shuffle_questions BOOLEAN DEFAULT false,
    show_correct_answers BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- quiz_questions
-- ----------------------------------------------------------------------------
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type DEFAULT 'multiple_choice',
    points DECIMAL(5, 2) DEFAULT 1.00,
    explanation TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- quiz_options
-- ----------------------------------------------------------------------------
CREATE TABLE quiz_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- quiz_attempts
-- ----------------------------------------------------------------------------
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score DECIMAL(5, 2),
    max_score DECIMAL(5, 2),
    percentage DECIMAL(5, 2),
    passed BOOLEAN DEFAULT false,
    answers JSONB DEFAULT '[]',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    time_spent_seconds INTEGER DEFAULT 0,
    attempt_number INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- promo_codes (created BEFORE payments since payments references it)
-- ----------------------------------------------------------------------------
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    min_purchase_amount DECIMAL(10, 2) DEFAULT 0.00,
    applicable_courses UUID[],
    applicable_categories UUID[],
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- payments
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status payment_status DEFAULT 'pending',
    method payment_method,
    transaction_id TEXT,
    gateway_response JSONB DEFAULT '{}',
    promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    invoice_url TEXT,
    receipt_url TEXT,
    refund_reason TEXT,
    metadata JSONB DEFAULT '{}',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- enrollments
-- ----------------------------------------------------------------------------
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status enrollment_status DEFAULT 'active',
    progress DECIMAL(5, 2) DEFAULT 0.00,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- ----------------------------------------------------------------------------
-- lesson_progress
-- ----------------------------------------------------------------------------
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    progress_percentage DECIMAL(5, 2) DEFAULT 0.00,
    time_spent_seconds INTEGER DEFAULT 0,
    last_position INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- ----------------------------------------------------------------------------
-- subscriptions
-- ----------------------------------------------------------------------------
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan subscription_plan NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- certificates
-- ----------------------------------------------------------------------------
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
    certificate_number TEXT UNIQUE NOT NULL,
    status certificate_status DEFAULT 'issued',
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoke_reason TEXT,
    template_id TEXT,
    pdf_url TEXT,
    verification_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- webinars
-- ----------------------------------------------------------------------------
CREATE TABLE webinars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    status webinar_status DEFAULT 'scheduled',
    meeting_url TEXT,
    meeting_id TEXT,
    recording_url TEXT,
    thumbnail_url TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    max_attendees INTEGER,
    timezone TEXT DEFAULT 'UTC',
    is_free BOOLEAN DEFAULT true,
    price DECIMAL(10, 2) DEFAULT 0.00,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- webinar_registrations
-- ----------------------------------------------------------------------------
CREATE TABLE webinar_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    attended BOOLEAN DEFAULT false,
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(webinar_id, user_id)
);

-- ----------------------------------------------------------------------------
-- forum_posts
-- ----------------------------------------------------------------------------
CREATE TABLE forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    title TEXT,
    body TEXT NOT NULL,
    post_type forum_post_type DEFAULT 'discussion',
    is_pinned BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- forum_votes
-- ----------------------------------------------------------------------------
CREATE TABLE forum_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- ----------------------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    channel notification_channel DEFAULT 'in_app',
    status notification_status DEFAULT 'pending',
    read_at TIMESTAMPTZ,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- reviews
-- ----------------------------------------------------------------------------
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    body TEXT,
    is_visible BOOLEAN DEFAULT true,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- ----------------------------------------------------------------------------
-- badges
-- ----------------------------------------------------------------------------
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    criteria JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- user_badges
-- ----------------------------------------------------------------------------
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- ----------------------------------------------------------------------------
-- ai_recommendations
-- ----------------------------------------------------------------------------
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    score DECIMAL(5, 4) DEFAULT 0.0000,
    reason TEXT,
    algorithm_version TEXT DEFAULT 'v1',
    is_dismissed BOOLEAN DEFAULT false,
    clicked_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- audit_log
-- ----------------------------------------------------------------------------
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

-- profiles
CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);

-- categories
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- courses
CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX idx_courses_category_id ON courses(category_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_is_featured ON courses(is_featured);
CREATE INDEX idx_courses_published_at ON courses(published_at);
CREATE INDEX idx_courses_price ON courses(price);

-- modules
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_modules_sort_order ON modules(course_id, sort_order);

-- lessons
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lessons_sort_order ON lessons(module_id, sort_order);
CREATE INDEX idx_lessons_content_type ON lessons(content_type);

-- quizzes
CREATE INDEX idx_quizzes_lesson_id ON quizzes(lesson_id);
CREATE INDEX idx_quizzes_course_id ON quizzes(course_id);

-- quiz_questions
CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);

-- quiz_options
CREATE INDEX idx_quiz_options_question_id ON quiz_options(question_id);

-- quiz_attempts
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);

-- promo_codes
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_organization_id ON promo_codes(organization_id);
CREATE INDEX idx_promo_codes_is_active ON promo_codes(is_active);
CREATE INDEX idx_promo_codes_expires_at ON promo_codes(expires_at);

-- payments
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_course_id ON payments(course_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_method ON payments(method);
CREATE INDEX idx_payments_promo_code_id ON payments(promo_code_id);
CREATE INDEX idx_payments_organization_id ON payments(organization_id);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- enrollments
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_payment_id ON enrollments(payment_id);
CREATE INDEX idx_enrollments_organization_id ON enrollments(organization_id);
CREATE INDEX idx_enrollments_user_status ON enrollments(user_id, status);

-- lesson_progress
CREATE INDEX idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_enrollment_id ON lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_is_completed ON lesson_progress(is_completed);

-- subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- certificates
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_course_id ON certificates(course_id);
CREATE INDEX idx_certificates_enrollment_id ON certificates(enrollment_id);
CREATE INDEX idx_certificates_certificate_number ON certificates(certificate_number);
CREATE INDEX idx_certificates_status ON certificates(status);

-- webinars
CREATE INDEX idx_webinars_instructor_id ON webinars(instructor_id);
CREATE INDEX idx_webinars_course_id ON webinars(course_id);
CREATE INDEX idx_webinars_status ON webinars(status);
CREATE INDEX idx_webinars_scheduled_at ON webinars(scheduled_at);

-- webinar_registrations
CREATE INDEX idx_webinar_registrations_webinar_id ON webinar_registrations(webinar_id);
CREATE INDEX idx_webinar_registrations_user_id ON webinar_registrations(user_id);

-- forum_posts
CREATE INDEX idx_forum_posts_course_id ON forum_posts(course_id);
CREATE INDEX idx_forum_posts_author_id ON forum_posts(author_id);
CREATE INDEX idx_forum_posts_parent_id ON forum_posts(parent_id);
CREATE INDEX idx_forum_posts_post_type ON forum_posts(post_type);
CREATE INDEX idx_forum_posts_is_pinned ON forum_posts(is_pinned);

-- forum_votes
CREATE INDEX idx_forum_votes_post_id ON forum_votes(post_id);
CREATE INDEX idx_forum_votes_user_id ON forum_votes(user_id);

-- notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_channel ON notifications(channel);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- reviews
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_course_id ON reviews(course_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_is_visible ON reviews(is_visible);

-- badges
CREATE INDEX idx_badges_slug ON badges(slug);
CREATE INDEX idx_badges_is_active ON badges(is_active);

-- user_badges
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);

-- ai_recommendations
CREATE INDEX idx_ai_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX idx_ai_recommendations_course_id ON ai_recommendations(course_id);
CREATE INDEX idx_ai_recommendations_score ON ai_recommendations(score DESC);
CREATE INDEX idx_ai_recommendations_is_dismissed ON ai_recommendations(is_dismissed);

-- audit_log
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- update_updated_at() - Automatically update the updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- update_enrollment_count() - Keep enrollment_count on courses in sync
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE courses
        SET enrollment_count = (
            SELECT COUNT(*) FROM enrollments
            WHERE course_id = NEW.course_id AND status IN ('active', 'completed')
        )
        WHERE id = NEW.course_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE courses
        SET enrollment_count = (
            SELECT COUNT(*) FROM enrollments
            WHERE course_id = NEW.course_id AND status IN ('active', 'completed')
        )
        WHERE id = NEW.course_id;
        -- If course_id changed, also update the old course
        IF OLD.course_id IS DISTINCT FROM NEW.course_id THEN
            UPDATE courses
            SET enrollment_count = (
                SELECT COUNT(*) FROM enrollments
                WHERE course_id = OLD.course_id AND status IN ('active', 'completed')
            )
            WHERE id = OLD.course_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE courses
        SET enrollment_count = (
            SELECT COUNT(*) FROM enrollments
            WHERE course_id = OLD.course_id AND status IN ('active', 'completed')
        )
        WHERE id = OLD.course_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- generate_certificate_number() - Generate a unique certificate number
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_certificate_number(p_course_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_course_slug TEXT;
    v_sequence INTEGER;
    v_cert_number TEXT;
BEGIN
    -- Get course slug
    SELECT UPPER(LEFT(REPLACE(slug, '-', ''), 6))
    INTO v_course_slug
    FROM courses
    WHERE id = p_course_id;

    -- Get next sequence number for this course
    SELECT COALESCE(COUNT(*), 0) + 1
    INTO v_sequence
    FROM certificates
    WHERE course_id = p_course_id;

    -- Generate certificate number: VIFM-{COURSE}-{YEAR}-{SEQUENCE}
    v_cert_number := 'VIFM-' || COALESCE(v_course_slug, 'UNKN') || '-' ||
                     EXTRACT(YEAR FROM NOW())::TEXT || '-' ||
                     LPAD(v_sequence::TEXT, 5, '0');

    RETURN v_cert_number;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- calculate_course_progress() - Calculate overall course progress for a user
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_course_progress(p_user_id UUID, p_course_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_total_lessons INTEGER;
    v_completed_lessons INTEGER;
    v_progress DECIMAL(5, 2);
BEGIN
    -- Count total published lessons in the course
    SELECT COUNT(*)
    INTO v_total_lessons
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    WHERE m.course_id = p_course_id
      AND l.is_published = true
      AND m.is_published = true;

    IF v_total_lessons = 0 THEN
        RETURN 0.00;
    END IF;

    -- Count completed lessons for this user
    SELECT COUNT(*)
    INTO v_completed_lessons
    FROM lesson_progress lp
    JOIN lessons l ON lp.lesson_id = l.id
    JOIN modules m ON l.module_id = m.id
    WHERE lp.user_id = p_user_id
      AND m.course_id = p_course_id
      AND lp.is_completed = true;

    v_progress := (v_completed_lessons::DECIMAL / v_total_lessons::DECIMAL) * 100;

    -- Update the enrollment progress
    UPDATE enrollments
    SET progress = v_progress,
        last_accessed_at = NOW(),
        completed_at = CASE
            WHEN v_progress >= 100 THEN COALESCE(completed_at, NOW())
            ELSE NULL
        END,
        status = CASE
            WHEN v_progress >= 100 THEN 'completed'::enrollment_status
            ELSE status
        END
    WHERE user_id = p_user_id AND course_id = p_course_id;

    RETURN v_progress;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- update_course_rating() - Recalculate average rating when reviews change
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_course_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_course_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_course_id := OLD.course_id;
    ELSE
        v_course_id := NEW.course_id;
    END IF;

    UPDATE courses
    SET average_rating = COALESCE((
            SELECT AVG(rating)::DECIMAL(3, 2)
            FROM reviews
            WHERE course_id = v_course_id AND is_visible = true
        ), 0.00),
        total_reviews = (
            SELECT COUNT(*)
            FROM reviews
            WHERE course_id = v_course_id AND is_visible = true
        )
    WHERE id = v_course_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- get_user_role() - Get the role of the currently authenticated user
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM profiles WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- is_admin() - Check if the current user is a super_admin
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'super_admin' FROM profiles WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- is_instructor() - Check if the current user is an instructor
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_instructor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'instructor' FROM profiles WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- get_user_org_id() - Get the organization ID of the current user
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- updated_at triggers on all tables with updated_at column
CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_modules_updated_at
    BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_quiz_questions_updated_at
    BEFORE UPDATE ON quiz_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_promo_codes_updated_at
    BEFORE UPDATE ON promo_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_enrollments_updated_at
    BEFORE UPDATE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_lesson_progress_updated_at
    BEFORE UPDATE ON lesson_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_certificates_updated_at
    BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_webinars_updated_at
    BEFORE UPDATE ON webinars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_forum_posts_updated_at
    BEFORE UPDATE ON forum_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_badges_updated_at
    BEFORE UPDATE ON badges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_ai_recommendations_updated_at
    BEFORE UPDATE ON ai_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enrollment count trigger
CREATE TRIGGER trg_enrollments_count
    AFTER INSERT OR UPDATE OR DELETE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_enrollment_count();

-- Course rating trigger
CREATE TRIGGER trg_reviews_course_rating
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_course_rating();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on ALL tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY profiles_select_own ON profiles
    FOR SELECT USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY profiles_select_admin ON profiles
    FOR SELECT USING (is_admin());

-- Corporate admins can view profiles in their organization
CREATE POLICY profiles_select_corp_admin ON profiles
    FOR SELECT USING (
        get_user_role() = 'corporate_admin'
        AND organization_id = get_user_org_id()
    );

-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admins can manage all profiles
CREATE POLICY profiles_all_admin ON profiles
    FOR ALL USING (is_admin());

-- ============================================================================
-- COURSES POLICIES
-- ============================================================================

-- Anyone can view published courses
CREATE POLICY courses_select_published ON courses
    FOR SELECT USING (status = 'published');

-- Admins can manage all courses
CREATE POLICY courses_all_admin ON courses
    FOR ALL USING (is_admin());

-- Instructors can view courses assigned to them
CREATE POLICY courses_select_instructor ON courses
    FOR SELECT USING (instructor_id = auth.uid());

-- Instructors can update their own courses
CREATE POLICY courses_update_instructor ON courses
    FOR UPDATE USING (instructor_id = auth.uid())
    WITH CHECK (instructor_id = auth.uid());

-- ============================================================================
-- MODULES POLICIES (follow course access)
-- ============================================================================

-- Users can view modules of published courses
CREATE POLICY modules_select_published ON modules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = modules.course_id AND courses.status = 'published'
        )
    );

-- Admins can manage all modules
CREATE POLICY modules_all_admin ON modules
    FOR ALL USING (is_admin());

-- Instructors can manage modules for their courses
CREATE POLICY modules_all_instructor ON modules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = modules.course_id AND courses.instructor_id = auth.uid()
        )
    );

-- ============================================================================
-- LESSONS POLICIES
-- ============================================================================

-- Enrolled users can view published lessons or preview lessons
CREATE POLICY lessons_select_enrolled ON lessons
    FOR SELECT USING (
        is_preview = true
        OR EXISTS (
            SELECT 1 FROM enrollments e
            JOIN modules m ON m.course_id = e.course_id
            WHERE m.id = lessons.module_id
              AND e.user_id = auth.uid()
              AND e.status IN ('active', 'completed')
        )
    );

-- Admins can manage all lessons
CREATE POLICY lessons_all_admin ON lessons
    FOR ALL USING (is_admin());

-- Instructors can manage lessons for their courses
CREATE POLICY lessons_all_instructor ON lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM modules m
            JOIN courses c ON c.id = m.course_id
            WHERE m.id = lessons.module_id AND c.instructor_id = auth.uid()
        )
    );

-- ============================================================================
-- QUIZZES POLICIES (follow lesson/course access)
-- ============================================================================

CREATE POLICY quizzes_select_enrolled ON quizzes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments e
            WHERE e.course_id = quizzes.course_id
              AND e.user_id = auth.uid()
              AND e.status IN ('active', 'completed')
        )
    );

CREATE POLICY quizzes_all_admin ON quizzes
    FOR ALL USING (is_admin());

CREATE POLICY quizzes_all_instructor ON quizzes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = quizzes.course_id AND courses.instructor_id = auth.uid()
        )
    );

-- ============================================================================
-- QUIZ_QUESTIONS POLICIES
-- ============================================================================

CREATE POLICY quiz_questions_select_enrolled ON quiz_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quizzes q
            JOIN enrollments e ON e.course_id = q.course_id
            WHERE q.id = quiz_questions.quiz_id
              AND e.user_id = auth.uid()
              AND e.status IN ('active', 'completed')
        )
    );

CREATE POLICY quiz_questions_all_admin ON quiz_questions
    FOR ALL USING (is_admin());

-- ============================================================================
-- QUIZ_OPTIONS POLICIES
-- ============================================================================

CREATE POLICY quiz_options_select_enrolled ON quiz_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quiz_questions qq
            JOIN quizzes q ON q.id = qq.quiz_id
            JOIN enrollments e ON e.course_id = q.course_id
            WHERE qq.id = quiz_options.question_id
              AND e.user_id = auth.uid()
              AND e.status IN ('active', 'completed')
        )
    );

CREATE POLICY quiz_options_all_admin ON quiz_options
    FOR ALL USING (is_admin());

-- ============================================================================
-- QUIZ_ATTEMPTS POLICIES
-- ============================================================================

-- Users can view their own quiz attempts
CREATE POLICY quiz_attempts_select_own ON quiz_attempts
    FOR SELECT USING (user_id = auth.uid());

-- Users can submit quiz attempts (insert)
CREATE POLICY quiz_attempts_insert_own ON quiz_attempts
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can view all quiz attempts
CREATE POLICY quiz_attempts_select_admin ON quiz_attempts
    FOR SELECT USING (is_admin());

-- Instructors can view quiz attempts for their courses
CREATE POLICY quiz_attempts_select_instructor ON quiz_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quizzes q
            JOIN courses c ON c.id = q.course_id
            WHERE q.id = quiz_attempts.quiz_id AND c.instructor_id = auth.uid()
        )
    );

-- ============================================================================
-- ENROLLMENTS POLICIES
-- ============================================================================

-- Users can view their own enrollments
CREATE POLICY enrollments_select_own ON enrollments
    FOR SELECT USING (user_id = auth.uid());

-- Corporate admins can view enrollments in their organization
CREATE POLICY enrollments_select_corp_admin ON enrollments
    FOR SELECT USING (
        get_user_role() = 'corporate_admin'
        AND organization_id = get_user_org_id()
    );

-- Admins can manage all enrollments
CREATE POLICY enrollments_all_admin ON enrollments
    FOR ALL USING (is_admin());

-- ============================================================================
-- LESSON_PROGRESS POLICIES
-- ============================================================================

-- Users can manage their own lesson progress
CREATE POLICY lesson_progress_select_own ON lesson_progress
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY lesson_progress_insert_own ON lesson_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY lesson_progress_update_own ON lesson_progress
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can view all lesson progress
CREATE POLICY lesson_progress_select_admin ON lesson_progress
    FOR SELECT USING (is_admin());

-- ============================================================================
-- PAYMENTS POLICIES
-- ============================================================================

-- Users can view their own payments
CREATE POLICY payments_select_own ON payments
    FOR SELECT USING (user_id = auth.uid());

-- Admins can manage all payments
CREATE POLICY payments_all_admin ON payments
    FOR ALL USING (is_admin());

-- ============================================================================
-- CERTIFICATES POLICIES
-- ============================================================================

-- Users can view their own certificates
CREATE POLICY certificates_select_own ON certificates
    FOR SELECT USING (user_id = auth.uid());

-- Anyone can verify a certificate (read by certificate_number)
CREATE POLICY certificates_select_verify ON certificates
    FOR SELECT USING (status = 'issued');

-- Admins can manage all certificates
CREATE POLICY certificates_all_admin ON certificates
    FOR ALL USING (is_admin());

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY notifications_select_own ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY notifications_update_own ON notifications
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can manage all notifications
CREATE POLICY notifications_all_admin ON notifications
    FOR ALL USING (is_admin());

-- ============================================================================
-- FORUM_POSTS POLICIES
-- ============================================================================

-- Enrolled users can view forum posts for their courses
CREATE POLICY forum_posts_select_enrolled ON forum_posts
    FOR SELECT USING (
        is_visible = true
        AND EXISTS (
            SELECT 1 FROM enrollments e
            WHERE e.course_id = forum_posts.course_id
              AND e.user_id = auth.uid()
              AND e.status IN ('active', 'completed')
        )
    );

-- Enrolled users can create forum posts
CREATE POLICY forum_posts_insert_enrolled ON forum_posts
    FOR INSERT WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM enrollments e
            WHERE e.course_id = forum_posts.course_id
              AND e.user_id = auth.uid()
              AND e.status IN ('active', 'completed')
        )
    );

-- Users can edit their own posts
CREATE POLICY forum_posts_update_own ON forum_posts
    FOR UPDATE USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- Admins can manage all forum posts
CREATE POLICY forum_posts_all_admin ON forum_posts
    FOR ALL USING (is_admin());

-- Instructors can manage forum posts for their courses
CREATE POLICY forum_posts_all_instructor ON forum_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = forum_posts.course_id AND courses.instructor_id = auth.uid()
        )
    );

-- ============================================================================
-- FORUM_VOTES POLICIES
-- ============================================================================

CREATE POLICY forum_votes_select ON forum_votes
    FOR SELECT USING (true);

CREATE POLICY forum_votes_insert_own ON forum_votes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY forum_votes_delete_own ON forum_votes
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY forum_votes_all_admin ON forum_votes
    FOR ALL USING (is_admin());

-- ============================================================================
-- REVIEWS POLICIES
-- ============================================================================

-- Anyone can view visible reviews
CREATE POLICY reviews_select_visible ON reviews
    FOR SELECT USING (is_visible = true);

-- Enrolled users can create reviews
CREATE POLICY reviews_insert_enrolled ON reviews
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM enrollments e
            WHERE e.course_id = reviews.course_id
              AND e.user_id = auth.uid()
              AND e.status IN ('active', 'completed')
        )
    );

-- Users can edit their own reviews
CREATE POLICY reviews_update_own ON reviews
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can manage all reviews
CREATE POLICY reviews_all_admin ON reviews
    FOR ALL USING (is_admin());

-- ============================================================================
-- SUBSCRIPTIONS POLICIES
-- ============================================================================

CREATE POLICY subscriptions_select_own ON subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY subscriptions_all_admin ON subscriptions
    FOR ALL USING (is_admin());

-- ============================================================================
-- WEBINARS POLICIES
-- ============================================================================

-- Anyone can view webinars
CREATE POLICY webinars_select_all ON webinars
    FOR SELECT USING (true);

-- Admins can manage all webinars
CREATE POLICY webinars_all_admin ON webinars
    FOR ALL USING (is_admin());

-- Instructors can manage their webinars
CREATE POLICY webinars_all_instructor ON webinars
    FOR ALL USING (instructor_id = auth.uid());

-- ============================================================================
-- WEBINAR_REGISTRATIONS POLICIES
-- ============================================================================

-- Users can manage their own registrations
CREATE POLICY webinar_registrations_select_own ON webinar_registrations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY webinar_registrations_insert_own ON webinar_registrations
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY webinar_registrations_delete_own ON webinar_registrations
    FOR DELETE USING (user_id = auth.uid());

-- Admins can manage all registrations
CREATE POLICY webinar_registrations_all_admin ON webinar_registrations
    FOR ALL USING (is_admin());

-- ============================================================================
-- CATEGORIES POLICIES
-- ============================================================================

-- Anyone can view active categories
CREATE POLICY categories_select_all ON categories
    FOR SELECT USING (true);

-- Admins can manage all categories
CREATE POLICY categories_all_admin ON categories
    FOR ALL USING (is_admin());

-- ============================================================================
-- PROMO_CODES POLICIES
-- ============================================================================

-- Users can validate active promo codes (read-only)
CREATE POLICY promo_codes_select_active ON promo_codes
    FOR SELECT USING (
        is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR current_uses < max_uses)
    );

-- Admins can manage all promo codes
CREATE POLICY promo_codes_all_admin ON promo_codes
    FOR ALL USING (is_admin());

-- ============================================================================
-- ORGANIZATIONS POLICIES
-- ============================================================================

-- Corporate admins can view their own organization
CREATE POLICY organizations_select_corp_admin ON organizations
    FOR SELECT USING (
        id = get_user_org_id()
    );

-- Admins can manage all organizations
CREATE POLICY organizations_all_admin ON organizations
    FOR ALL USING (is_admin());

-- ============================================================================
-- BADGES POLICIES
-- ============================================================================

-- Anyone can view active badges
CREATE POLICY badges_select_all ON badges
    FOR SELECT USING (true);

-- Admins can manage all badges
CREATE POLICY badges_all_admin ON badges
    FOR ALL USING (is_admin());

-- ============================================================================
-- USER_BADGES POLICIES
-- ============================================================================

-- Users can view their own badges
CREATE POLICY user_badges_select_own ON user_badges
    FOR SELECT USING (user_id = auth.uid());

-- Admins can manage all user badges
CREATE POLICY user_badges_all_admin ON user_badges
    FOR ALL USING (is_admin());

-- ============================================================================
-- AI_RECOMMENDATIONS POLICIES
-- ============================================================================

CREATE POLICY ai_recommendations_select_own ON ai_recommendations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY ai_recommendations_update_own ON ai_recommendations
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY ai_recommendations_all_admin ON ai_recommendations
    FOR ALL USING (is_admin());

-- ============================================================================
-- AUDIT_LOG POLICIES
-- ============================================================================

-- Only admins can view audit logs
CREATE POLICY audit_log_select_admin ON audit_log
    FOR SELECT USING (is_admin());

-- System can insert audit logs (via service role or triggers)
CREATE POLICY audit_log_insert_system ON audit_log
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 8. ANALYTICS VIEWS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- v_monthly_revenue - Monthly revenue aggregation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
    DATE_TRUNC('month', p.paid_at) AS month,
    COUNT(*) AS total_transactions,
    SUM(p.amount) AS gross_revenue,
    SUM(p.discount_amount) AS total_discounts,
    SUM(p.amount - p.discount_amount) AS net_revenue,
    p.currency,
    p.method AS payment_method,
    COUNT(DISTINCT p.user_id) AS unique_customers,
    COUNT(DISTINCT p.course_id) AS courses_sold,
    SUM(CASE WHEN p.status = 'refunded' THEN p.amount ELSE 0 END) AS refunded_amount,
    COUNT(CASE WHEN p.status = 'refunded' THEN 1 END) AS refund_count
FROM payments p
WHERE p.status IN ('completed', 'refunded')
  AND p.paid_at IS NOT NULL
GROUP BY DATE_TRUNC('month', p.paid_at), p.currency, p.method
ORDER BY month DESC;

-- ----------------------------------------------------------------------------
-- v_course_analytics - Per-course analytics
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_course_analytics AS
SELECT
    c.id AS course_id,
    c.title,
    c.slug,
    c.status,
    c.price,
    c.currency,
    c.instructor_id,
    p.full_name AS instructor_name,
    cat.name AS category_name,
    c.enrollment_count,
    c.average_rating,
    c.total_reviews,
    c.published_at,
    COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active') AS active_enrollments,
    COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') AS completed_enrollments,
    CASE
        WHEN c.enrollment_count > 0 THEN
            ROUND(
                (COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed')::DECIMAL /
                 c.enrollment_count * 100), 2
            )
        ELSE 0
    END AS completion_rate,
    COALESCE(SUM(pay.amount) FILTER (WHERE pay.status = 'completed'), 0) AS total_revenue,
    COUNT(DISTINCT m.id) AS total_modules,
    COUNT(DISTINCT l.id) AS total_lessons,
    COALESCE(SUM(l.duration_minutes), 0) AS total_duration_minutes
FROM courses c
LEFT JOIN profiles p ON c.instructor_id = p.id
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN enrollments e ON c.id = e.course_id
LEFT JOIN payments pay ON c.id = pay.course_id
LEFT JOIN modules m ON c.id = m.course_id
LEFT JOIN lessons l ON m.id = l.module_id
GROUP BY c.id, c.title, c.slug, c.status, c.price, c.currency,
         c.instructor_id, p.full_name, cat.name, c.enrollment_count,
         c.average_rating, c.total_reviews, c.published_at;

-- ----------------------------------------------------------------------------
-- v_learner_analytics - Per-learner analytics
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_learner_analytics AS
SELECT
    pr.id AS user_id,
    pr.full_name,
    pr.email,
    pr.role,
    pr.organization_id,
    org.name AS organization_name,
    pr.created_at AS joined_at,
    pr.last_login_at,
    COUNT(DISTINCT e.id) AS total_enrollments,
    COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active') AS active_enrollments,
    COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') AS completed_courses,
    CASE
        WHEN COUNT(DISTINCT e.id) > 0 THEN
            ROUND(AVG(e.progress)::DECIMAL, 2)
        ELSE 0
    END AS average_progress,
    COUNT(DISTINCT cert.id) AS certificates_earned,
    COUNT(DISTINCT ub.id) AS badges_earned,
    COALESCE(SUM(lp.time_spent_seconds), 0) AS total_learning_seconds,
    ROUND(COALESCE(SUM(lp.time_spent_seconds), 0) / 3600.0, 2) AS total_learning_hours,
    COUNT(DISTINCT qa.id) AS quiz_attempts,
    CASE
        WHEN COUNT(DISTINCT qa.id) > 0 THEN
            ROUND(AVG(qa.percentage)::DECIMAL, 2)
        ELSE 0
    END AS average_quiz_score,
    COUNT(DISTINCT fp.id) AS forum_posts,
    COUNT(DISTINCT r.id) AS reviews_given,
    COALESCE(SUM(pay.amount) FILTER (WHERE pay.status = 'completed'), 0) AS total_spent
FROM profiles pr
LEFT JOIN organizations org ON pr.organization_id = org.id
LEFT JOIN enrollments e ON pr.id = e.user_id
LEFT JOIN certificates cert ON pr.id = cert.user_id AND cert.status = 'issued'
LEFT JOIN user_badges ub ON pr.id = ub.user_id
LEFT JOIN lesson_progress lp ON pr.id = lp.user_id
LEFT JOIN quiz_attempts qa ON pr.id = qa.user_id
LEFT JOIN forum_posts fp ON pr.id = fp.author_id
LEFT JOIN reviews r ON pr.id = r.user_id
LEFT JOIN payments pay ON pr.id = pay.user_id
WHERE pr.role = 'learner'
GROUP BY pr.id, pr.full_name, pr.email, pr.role, pr.organization_id,
         org.name, pr.created_at, pr.last_login_at;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
