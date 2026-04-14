// VIFM eLearning - Demo Mode Mock Data
(function() {
    'use strict';

    window.ELEARN_DEMO_DATA = {
        currentUser: {
            id: 'demo-learner-001',
            email: 'demo@vifm.org',
            full_name: 'Demo Learner',
            role: 'learner',
            avatar_url: null,
            created_at: '2025-01-01T00:00:00Z'
        },
        adminUser: {
            id: 'demo-admin-001',
            email: 'admin@vifm.org',
            full_name: 'Demo Admin',
            role: 'super_admin',
            avatar_url: null,
            created_at: '2025-01-01T00:00:00Z'
        },

        categories: [
            { id: 'cat-1', name: 'Finance', slug: 'finance', course_count: 3 },
            { id: 'cat-2', name: 'Data Analytics', slug: 'data-analytics', course_count: 2 },
            { id: 'cat-3', name: 'Compliance', slug: 'compliance', course_count: 2 },
            { id: 'cat-4', name: 'Leadership', slug: 'leadership', course_count: 1 }
        ],

        courses: [
            { id: 'course-1', title: 'Financial Analysis Masterclass', slug: 'financial-analysis-masterclass', description: 'Comprehensive course covering DCF valuation, ratio analysis, and financial modeling for GCC markets.', thumbnail_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80', category_id: 'cat-1', category: { name: 'Finance' }, instructor_id: 'demo-admin-001', instructor: { full_name: 'Demo Instructor' }, difficulty: 'intermediate', duration_hours: 12, price: 299, currency: 'USD', is_free: false, status: 'published', enrollment_count: 156, average_rating: 4.7, completion_rate: 78, modules_count: 4, lessons_count: 16, created_at: '2025-06-01T00:00:00Z' },
            { id: 'course-2', title: 'Risk Management & Basel III', slug: 'risk-management-basel-iii', description: 'Master risk management frameworks and Basel III compliance requirements for banking professionals.', thumbnail_url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80', category_id: 'cat-1', category: { name: 'Finance' }, instructor_id: 'demo-admin-001', instructor: { full_name: 'Demo Instructor' }, difficulty: 'advanced', duration_hours: 16, price: 399, currency: 'USD', is_free: false, status: 'published', enrollment_count: 89, average_rating: 4.8, completion_rate: 65, modules_count: 5, lessons_count: 20, created_at: '2025-07-15T00:00:00Z' },
            { id: 'course-3', title: 'Excel for Finance Professionals', slug: 'excel-for-finance', description: 'Advanced Excel techniques for financial modeling, data analysis, and reporting.', thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', category_id: 'cat-2', category: { name: 'Data Analytics' }, instructor_id: 'demo-admin-001', instructor: { full_name: 'Demo Instructor' }, difficulty: 'beginner', duration_hours: 8, price: 0, currency: 'USD', is_free: true, status: 'published', enrollment_count: 324, average_rating: 4.5, completion_rate: 82, modules_count: 3, lessons_count: 12, created_at: '2025-05-01T00:00:00Z' },
            { id: 'course-4', title: 'Anti-Money Laundering (AML)', slug: 'anti-money-laundering', description: 'Comprehensive AML training covering KYC, transaction monitoring, and regulatory compliance.', thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80', category_id: 'cat-3', category: { name: 'Compliance' }, instructor_id: 'demo-admin-001', instructor: { full_name: 'Demo Instructor' }, difficulty: 'intermediate', duration_hours: 10, price: 249, currency: 'USD', is_free: false, status: 'published', enrollment_count: 201, average_rating: 4.6, completion_rate: 71, modules_count: 4, lessons_count: 15, created_at: '2025-08-01T00:00:00Z' },
            { id: 'course-5', title: 'Leadership in Banking', slug: 'leadership-in-banking', description: 'Develop executive leadership skills for senior banking professionals in the GCC region.', thumbnail_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80', category_id: 'cat-4', category: { name: 'Leadership' }, instructor_id: 'demo-admin-001', instructor: { full_name: 'Demo Instructor' }, difficulty: 'advanced', duration_hours: 14, price: 449, currency: 'USD', is_free: false, status: 'published', enrollment_count: 67, average_rating: 4.9, completion_rate: 58, modules_count: 5, lessons_count: 18, created_at: '2025-09-01T00:00:00Z' }
        ],

        enrollments: [
            { id: 'enr-1', user_id: 'demo-learner-001', course_id: 'course-1', status: 'active', progress: 65, enrolled_at: '2025-10-01T00:00:00Z' },
            { id: 'enr-2', user_id: 'demo-learner-001', course_id: 'course-3', status: 'completed', progress: 100, enrolled_at: '2025-09-15T00:00:00Z', completed_at: '2025-11-01T00:00:00Z' },
            { id: 'enr-3', user_id: 'demo-learner-001', course_id: 'course-4', status: 'active', progress: 30, enrolled_at: '2025-11-01T00:00:00Z' }
        ],

        certificates: [
            { id: 'cert-1', user_id: 'demo-learner-001', course_id: 'course-3', course_title: 'Excel for Finance Professionals', verification_code: 'DEMO-CERT-001', issued_at: '2025-11-01T00:00:00Z', template: 'modern' }
        ],

        notifications: [
            { id: 'notif-1', user_id: 'demo-learner-001', title: 'Course Updated', message: 'Financial Analysis Masterclass has new content!', is_read: false, created_at: new Date().toISOString() },
            { id: 'notif-2', user_id: 'demo-learner-001', title: 'Certificate Ready', message: 'Your certificate for Excel for Finance is ready to download.', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() }
        ],

        dashboardStats: {
            enrolled_courses: 3,
            completed_courses: 1,
            certificates_earned: 1,
            total_watch_time_hours: 24,
            average_progress: 65,
            streak_days: 5
        }
    };
})();
