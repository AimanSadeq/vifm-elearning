/**
 * Thinkific → PostgreSQL Full Migration Script
 *
 * Exports: Courses, Chapters, Contents, Users, Enrollments,
 *          Instructors, Orders, Collections, Course Reviews
 *
 * Prerequisites:
 *   npm install pg node-fetch@2
 *
 * Usage:
 *   1. Update DB_CONFIG with your PostgreSQL credentials
 *   2. Run: node migrate.js --check-schema    (to check/create tables)
 *   3. Run: node migrate.js --migrate         (to pull from API and insert)
 *   4. Run: node migrate.js --all             (check schema + migrate)
 *   5. Run: node migrate.js --users-only      (fetch only users & enrollments)
 *   6. Run: node migrate.js --stats           (show row counts only)
 */

const { Pool } = require('pg');
const fetch = require('node-fetch');

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

const DB_CONFIG = {
    host: 'db.guvjbtepgeivfrjdhldx.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '3nSgkRrSJ9lTdakg',
    ssl: { rejectUnauthorized: false },
};

const THINKIFIC_API = {
    baseUrl: 'https://api.thinkific.com/api/public/v1',
    apiKey: '80b38f5690243040c0881f029afabbaf',
    subdomain: 'guerillaexcel',
};

// ============================================
// DATABASE SCHEMA
// ============================================

const SCHEMA_SQL = `
-- Instructors table (full data)
CREATE TABLE IF NOT EXISTS thinkific_instructors (
    id SERIAL PRIMARY KEY,
    thinkific_id INTEGER UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email TEXT,
    bio TEXT,
    title VARCHAR(500),
    slug VARCHAR(500),
    profile_image_url TEXT,
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS thinkific_users (
    id SERIAL PRIMARY KEY,
    thinkific_id INTEGER UNIQUE NOT NULL,
    email TEXT NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    full_name VARCHAR(500),
    roles TEXT[],
    avatar_url TEXT,
    bio TEXT,
    headline VARCHAR(500),
    company VARCHAR(500),
    external_id TEXT,
    affiliate_code TEXT,
    custom_profile_fields JSONB DEFAULT '[]',
    thinkific_created_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Collections / Categories table
CREATE TABLE IF NOT EXISTS thinkific_collections (
    id SERIAL PRIMARY KEY,
    thinkific_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    slug VARCHAR(500),
    product_ids INTEGER[],
    is_default BOOLEAN DEFAULT false,
    thinkific_created_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Courses table
CREATE TABLE IF NOT EXISTS thinkific_courses (
    id SERIAL PRIMARY KEY,
    thinkific_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500),
    subtitle TEXT,
    description TEXT,
    keywords TEXT,
    duration VARCHAR(100),
    product_id INTEGER,
    course_card_image_url TEXT,
    banner_image_url TEXT,
    instructor_id INTEGER,
    reviews_enabled BOOLEAN DEFAULT true,
    contact_information TEXT,
    intro_video_youtube TEXT,
    intro_video_wistia_identifier TEXT,
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chapters table
CREATE TABLE IF NOT EXISTS thinkific_chapters (
    id SERIAL PRIMARY KEY,
    thinkific_id INTEGER UNIQUE NOT NULL,
    course_thinkific_id INTEGER NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    position INTEGER DEFAULT 0,
    duration_in_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_chapter_course
        FOREIGN KEY (course_thinkific_id)
        REFERENCES thinkific_courses(thinkific_id)
        ON DELETE CASCADE
);

-- Contents / Lessons table
CREATE TABLE IF NOT EXISTS thinkific_contents (
    id SERIAL PRIMARY KEY,
    thinkific_id INTEGER UNIQUE NOT NULL,
    chapter_thinkific_id INTEGER NOT NULL,
    name VARCHAR(500),
    contentable_type VARCHAR(100),
    position INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT false,
    take_url TEXT,
    video_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_content_chapter
        FOREIGN KEY (chapter_thinkific_id)
        REFERENCES thinkific_chapters(thinkific_id)
        ON DELETE CASCADE
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS thinkific_enrollments (
    id SERIAL PRIMARY KEY,
    thinkific_id INTEGER UNIQUE NOT NULL,
    user_thinkific_id INTEGER NOT NULL,
    course_thinkific_id INTEGER NOT NULL,
    course_name VARCHAR(500),
    percentage_completed NUMERIC(5,2) DEFAULT 0,
    started_at TIMESTAMP,
    activated_at TIMESTAMP,
    completed_at TIMESTAMP,
    expiry_date TIMESTAMP,
    expired BOOLEAN DEFAULT false,
    is_free_trial BOOLEAN DEFAULT false,
    user_email TEXT,
    user_first_name VARCHAR(255),
    user_last_name VARCHAR(255),
    thinkific_created_at TIMESTAMP,
    thinkific_updated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS thinkific_orders (
    id SERIAL PRIMARY KEY,
    thinkific_id INTEGER UNIQUE NOT NULL,
    user_thinkific_id INTEGER,
    status VARCHAR(100),
    amount_cents INTEGER,
    amount_dollars NUMERIC(10,2),
    coupon_code VARCHAR(255),
    coupon_id INTEGER,
    product_id INTEGER,
    user_email TEXT,
    user_name VARCHAR(500),
    order_items JSONB DEFAULT '[]',
    thinkific_created_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Course Reviews table
CREATE TABLE IF NOT EXISTS thinkific_reviews (
    id SERIAL PRIMARY KEY,
    thinkific_id INTEGER UNIQUE NOT NULL,
    course_thinkific_id INTEGER NOT NULL,
    user_thinkific_id INTEGER,
    rating INTEGER,
    title VARCHAR(500),
    review_text TEXT,
    approved BOOLEAN DEFAULT false,
    thinkific_created_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_chapters_course ON thinkific_chapters(course_thinkific_id);
CREATE INDEX IF NOT EXISTS idx_contents_chapter ON thinkific_contents(chapter_thinkific_id);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON thinkific_courses(slug);
CREATE INDEX IF NOT EXISTS idx_contents_type ON thinkific_contents(contentable_type);
CREATE INDEX IF NOT EXISTS idx_users_email ON thinkific_users(email);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON thinkific_enrollments(user_thinkific_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON thinkific_enrollments(course_thinkific_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON thinkific_orders(user_thinkific_id);
CREATE INDEX IF NOT EXISTS idx_reviews_course ON thinkific_reviews(course_thinkific_id);
`;

// Check which tables exist
const CHECK_TABLES_SQL = `
SELECT table_name,
       (SELECT count(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'thinkific_%'
ORDER BY table_name;
`;

// Check columns for each table
const CHECK_COLUMNS_SQL = `
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name LIKE 'thinkific_%'
ORDER BY table_name, ordinal_position;
`;

// Count rows in each table
const COUNT_ROWS_SQL = `
SELECT 'thinkific_courses' as table_name, count(*) as row_count FROM thinkific_courses
UNION ALL SELECT 'thinkific_chapters', count(*) FROM thinkific_chapters
UNION ALL SELECT 'thinkific_contents', count(*) FROM thinkific_contents
UNION ALL SELECT 'thinkific_instructors', count(*) FROM thinkific_instructors
UNION ALL SELECT 'thinkific_users', count(*) FROM thinkific_users
UNION ALL SELECT 'thinkific_enrollments', count(*) FROM thinkific_enrollments
UNION ALL SELECT 'thinkific_orders', count(*) FROM thinkific_orders
UNION ALL SELECT 'thinkific_collections', count(*) FROM thinkific_collections
UNION ALL SELECT 'thinkific_reviews', count(*) FROM thinkific_reviews;
`;

// ============================================
// API FUNCTIONS
// ============================================

const apiHeaders = {
    'Content-Type': 'application/json',
    'X-Auth-API-Key': THINKIFIC_API.apiKey,
    'X-Auth-Subdomain': THINKIFIC_API.subdomain,
};

async function apiFetch(endpoint) {
    const url = `${THINKIFIC_API.baseUrl}${endpoint}`;
    const res = await fetch(url, { headers: apiHeaders });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`API error ${res.status}: ${url} - ${body}`);
    }
    return res.json();
}

/**
 * Generic paginated fetch - works for any list endpoint
 */
async function fetchAllPaginated(endpoint, label) {
    let allItems = [];
    let page = 1;
    let totalPages = 1;

    do {
        const separator = endpoint.includes('?') ? '&' : '?';
        console.log(`    Fetching ${label} page ${page}/${totalPages}...`);
        const data = await apiFetch(`${endpoint}${separator}page=${page}&limit=25`);
        allItems.push(...(data.items || []));
        totalPages = data.meta?.pagination?.total_pages || 1;
        page++;
        await sleep(200);
    } while (page <= totalPages);

    return allItems;
}

async function fetchAllCourses() {
    return fetchAllPaginated('/courses', 'courses');
}

async function fetchAllUsers() {
    return fetchAllPaginated('/users', 'users');
}

async function fetchAllEnrollments() {
    return fetchAllPaginated('/enrollments', 'enrollments');
}

async function fetchAllOrders() {
    return fetchAllPaginated('/orders', 'orders');
}

async function fetchAllInstructors() {
    return fetchAllPaginated('/instructors', 'instructors');
}

async function fetchAllCollections() {
    return fetchAllPaginated('/collections', 'collections');
}

async function fetchCourseReviews(courseId) {
    try {
        return await fetchAllPaginated(`/course_reviews?query[course_id]=${courseId}`, `reviews for course ${courseId}`);
    } catch (err) {
        // Some courses may not have reviews enabled
        return [];
    }
}

async function fetchChapters(courseId) {
    const data = await apiFetch(`/courses/${courseId}/chapters`);
    return data.items || [];
}

async function fetchContent(contentId) {
    const data = await apiFetch(`/contents/${contentId}`);
    return data;
}

// ============================================
// DATABASE INSERT FUNCTIONS
// ============================================

async function insertInstructor(pool, instructor) {
    const sql = `
        INSERT INTO thinkific_instructors
            (thinkific_id, first_name, last_name, email, bio, title, slug, profile_image_url, user_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (thinkific_id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            bio = EXCLUDED.bio,
            title = EXCLUDED.title,
            slug = EXCLUDED.slug,
            profile_image_url = EXCLUDED.profile_image_url,
            user_id = EXCLUDED.user_id,
            updated_at = NOW();
    `;
    await pool.query(sql, [
        instructor.id,
        instructor.first_name,
        instructor.last_name,
        instructor.email,
        instructor.bio,
        instructor.title,
        instructor.slug,
        instructor.profile_image_url,
        instructor.user_id,
    ]);
}

async function insertUser(pool, user) {
    const sql = `
        INSERT INTO thinkific_users
            (thinkific_id, email, first_name, last_name, full_name, roles, avatar_url,
             bio, headline, company, external_id, affiliate_code, custom_profile_fields, thinkific_created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT (thinkific_id) DO UPDATE SET
            email = EXCLUDED.email,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            full_name = EXCLUDED.full_name,
            roles = EXCLUDED.roles,
            avatar_url = EXCLUDED.avatar_url,
            bio = EXCLUDED.bio,
            headline = EXCLUDED.headline,
            company = EXCLUDED.company,
            external_id = EXCLUDED.external_id,
            affiliate_code = EXCLUDED.affiliate_code,
            custom_profile_fields = EXCLUDED.custom_profile_fields,
            thinkific_created_at = EXCLUDED.thinkific_created_at,
            updated_at = NOW();
    `;
    await pool.query(sql, [
        user.id,
        user.email,
        user.first_name,
        user.last_name,
        user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        user.roles || [],
        user.avatar_url,
        user.bio,
        user.headline,
        user.company,
        user.external_id,
        user.affiliate_code,
        JSON.stringify(user.custom_profile_fields || []),
        user.created_at ? new Date(user.created_at) : null,
    ]);
}

async function insertCollection(pool, collection) {
    const sql = `
        INSERT INTO thinkific_collections
            (thinkific_id, name, description, slug, product_ids, is_default, thinkific_created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (thinkific_id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            slug = EXCLUDED.slug,
            product_ids = EXCLUDED.product_ids,
            is_default = EXCLUDED.is_default,
            thinkific_created_at = EXCLUDED.thinkific_created_at,
            updated_at = NOW();
    `;
    await pool.query(sql, [
        collection.id,
        collection.name,
        collection.description,
        collection.slug,
        collection.product_ids || [],
        collection.default || false,
        collection.created_at ? new Date(collection.created_at) : null,
    ]);
}

async function insertCourse(pool, course) {
    const sql = `
        INSERT INTO thinkific_courses
            (thinkific_id, name, slug, subtitle, description, keywords, product_id,
             course_card_image_url, banner_image_url, instructor_id, reviews_enabled,
             contact_information, intro_video_youtube, intro_video_wistia_identifier, user_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT (thinkific_id) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            subtitle = EXCLUDED.subtitle,
            description = EXCLUDED.description,
            keywords = EXCLUDED.keywords,
            product_id = EXCLUDED.product_id,
            course_card_image_url = EXCLUDED.course_card_image_url,
            banner_image_url = EXCLUDED.banner_image_url,
            instructor_id = EXCLUDED.instructor_id,
            reviews_enabled = EXCLUDED.reviews_enabled,
            contact_information = EXCLUDED.contact_information,
            intro_video_youtube = EXCLUDED.intro_video_youtube,
            intro_video_wistia_identifier = EXCLUDED.intro_video_wistia_identifier,
            user_id = EXCLUDED.user_id,
            updated_at = NOW();
    `;

    await pool.query(sql, [
        course.id,
        course.name,
        course.slug,
        course.subtitle,
        course.description,
        course.keywords,
        course.product_id,
        course.course_card_image_url,
        course.banner_image_url,
        course.instructor_id,
        course.reviews_enabled,
        course.contact_information,
        course.intro_video_youtube,
        course.intro_video_wistia_identifier,
        course.user_id,
    ]);
}

async function insertChapter(pool, chapter, courseThinkificId) {
    const sql = `
        INSERT INTO thinkific_chapters
            (thinkific_id, course_thinkific_id, name, description, position, duration_in_seconds)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (thinkific_id) DO UPDATE SET
            course_thinkific_id = EXCLUDED.course_thinkific_id,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            position = EXCLUDED.position,
            duration_in_seconds = EXCLUDED.duration_in_seconds,
            updated_at = NOW();
    `;

    await pool.query(sql, [
        chapter.id,
        courseThinkificId,
        chapter.name,
        chapter.description,
        chapter.position,
        chapter.duration_in_seconds,
    ]);
}

async function insertContent(pool, content, chapterThinkificId) {
    const sql = `
        INSERT INTO thinkific_contents
            (thinkific_id, chapter_thinkific_id, name, contentable_type, position, is_free, take_url)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (thinkific_id) DO UPDATE SET
            chapter_thinkific_id = EXCLUDED.chapter_thinkific_id,
            name = EXCLUDED.name,
            contentable_type = EXCLUDED.contentable_type,
            position = EXCLUDED.position,
            is_free = EXCLUDED.is_free,
            take_url = EXCLUDED.take_url,
            updated_at = NOW();
    `;

    await pool.query(sql, [
        content.id,
        chapterThinkificId,
        content.name,
        content.contentable_type,
        content.position,
        content.free || false,
        content.take_url,
    ]);
}

async function insertEnrollment(pool, enrollment) {
    const sql = `
        INSERT INTO thinkific_enrollments
            (thinkific_id, user_thinkific_id, course_thinkific_id, course_name,
             percentage_completed, started_at, activated_at, completed_at,
             expiry_date, expired, is_free_trial, user_email, user_first_name,
             user_last_name, thinkific_created_at, thinkific_updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        ON CONFLICT (thinkific_id) DO UPDATE SET
            user_thinkific_id = EXCLUDED.user_thinkific_id,
            course_thinkific_id = EXCLUDED.course_thinkific_id,
            course_name = EXCLUDED.course_name,
            percentage_completed = EXCLUDED.percentage_completed,
            started_at = EXCLUDED.started_at,
            activated_at = EXCLUDED.activated_at,
            completed_at = EXCLUDED.completed_at,
            expiry_date = EXCLUDED.expiry_date,
            expired = EXCLUDED.expired,
            is_free_trial = EXCLUDED.is_free_trial,
            user_email = EXCLUDED.user_email,
            user_first_name = EXCLUDED.user_first_name,
            user_last_name = EXCLUDED.user_last_name,
            thinkific_created_at = EXCLUDED.thinkific_created_at,
            thinkific_updated_at = EXCLUDED.thinkific_updated_at,
            updated_at = NOW();
    `;

    const user = enrollment.user || {};
    await pool.query(sql, [
        enrollment.id,
        enrollment.user_id,
        enrollment.course_id,
        enrollment.course_name,
        enrollment.percentage_completed || 0,
        enrollment.started_at ? new Date(enrollment.started_at) : null,
        enrollment.activated_at ? new Date(enrollment.activated_at) : null,
        enrollment.completed_at ? new Date(enrollment.completed_at) : null,
        enrollment.expiry_date ? new Date(enrollment.expiry_date) : null,
        enrollment.expired || false,
        enrollment.is_free_trial || false,
        user.email || null,
        user.first_name || null,
        user.last_name || null,
        enrollment.created_at ? new Date(enrollment.created_at) : null,
        enrollment.updated_at ? new Date(enrollment.updated_at) : null,
    ]);
}

async function insertOrder(pool, order) {
    const sql = `
        INSERT INTO thinkific_orders
            (thinkific_id, user_thinkific_id, status, amount_cents, amount_dollars,
             coupon_code, coupon_id, product_id, user_email, user_name,
             order_items, thinkific_created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (thinkific_id) DO UPDATE SET
            user_thinkific_id = EXCLUDED.user_thinkific_id,
            status = EXCLUDED.status,
            amount_cents = EXCLUDED.amount_cents,
            amount_dollars = EXCLUDED.amount_dollars,
            coupon_code = EXCLUDED.coupon_code,
            coupon_id = EXCLUDED.coupon_id,
            product_id = EXCLUDED.product_id,
            user_email = EXCLUDED.user_email,
            user_name = EXCLUDED.user_name,
            order_items = EXCLUDED.order_items,
            thinkific_created_at = EXCLUDED.thinkific_created_at,
            updated_at = NOW();
    `;

    const user = order.user || {};
    await pool.query(sql, [
        order.id,
        order.user_id || user.id,
        order.status,
        order.amount_cents,
        order.amount_dollars,
        order.coupon_code,
        order.coupon_id,
        order.product_id,
        user.email || null,
        user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || null,
        JSON.stringify(order.order_items || []),
        order.created_at ? new Date(order.created_at) : null,
    ]);
}

async function insertReview(pool, review) {
    const sql = `
        INSERT INTO thinkific_reviews
            (thinkific_id, course_thinkific_id, user_thinkific_id, rating,
             title, review_text, approved, thinkific_created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (thinkific_id) DO UPDATE SET
            course_thinkific_id = EXCLUDED.course_thinkific_id,
            user_thinkific_id = EXCLUDED.user_thinkific_id,
            rating = EXCLUDED.rating,
            title = EXCLUDED.title,
            review_text = EXCLUDED.review_text,
            approved = EXCLUDED.approved,
            thinkific_created_at = EXCLUDED.thinkific_created_at,
            updated_at = NOW();
    `;

    await pool.query(sql, [
        review.id,
        review.course_id,
        review.user_id,
        review.rating,
        review.title,
        review.review_text,
        review.approved || false,
        review.created_at ? new Date(review.created_at) : null,
    ]);
}

// ============================================
// SCHEMA CHECK
// ============================================

async function checkSchema(pool) {
    console.log('\n========================================');
    console.log('  DATABASE SCHEMA CHECK');
    console.log('========================================\n');

    // Check if tables exist
    console.log('Checking existing tables...\n');
    try {
        const tables = await pool.query(CHECK_TABLES_SQL);
        if (tables.rows.length === 0) {
            console.log('  No thinkific tables found. Tables need to be created.\n');
        } else {
            console.log('  Existing tables:');
            tables.rows.forEach(r => {
                console.log(`    - ${r.table_name} (${r.column_count} columns)`);
            });
            console.log();
        }
    } catch (e) {
        console.log('  No thinkific tables found. Tables need to be created.\n');
    }

    // Check columns
    try {
        const cols = await pool.query(CHECK_COLUMNS_SQL);
        if (cols.rows.length > 0) {
            console.log('  Column details:');
            let currentTable = '';
            cols.rows.forEach(r => {
                if (r.table_name !== currentTable) {
                    currentTable = r.table_name;
                    console.log(`\n    [${currentTable}]`);
                }
                console.log(`      ${r.column_name.padEnd(30)} ${r.data_type.padEnd(20)} ${r.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
            console.log();
        }
    } catch (e) {
        // Tables don't exist yet
    }

    // Try to count rows
    try {
        const counts = await pool.query(COUNT_ROWS_SQL);
        console.log('  Row counts:');
        counts.rows.forEach(r => {
            console.log(`    - ${r.table_name}: ${r.row_count} rows`);
        });
        console.log();
    } catch (e) {
        // Tables don't exist yet
    }

    // Create/update schema
    console.log('Creating/updating schema...\n');
    await pool.query(SCHEMA_SQL);
    console.log('  Schema is ready!\n');

    // Verify after creation
    const tablesAfter = await pool.query(CHECK_TABLES_SQL);
    console.log('  Tables after setup:');
    tablesAfter.rows.forEach(r => {
        console.log(`    - ${r.table_name} (${r.column_count} columns)`);
    });
    console.log('\n========================================\n');
}

// ============================================
// MIGRATION STEPS
// ============================================

async function migrateInstructors(pool) {
    console.log('\n[STEP 1/7] Fetching instructors from Thinkific API...\n');
    try {
        const instructors = await fetchAllInstructors();
        console.log(`  Found ${instructors.length} instructors. Inserting...\n`);
        for (const instructor of instructors) {
            await insertInstructor(pool, instructor);
        }
        console.log(`  ✓ ${instructors.length} instructors saved.\n`);
        return instructors.length;
    } catch (err) {
        console.log(`  Warning: Could not fetch instructors: ${err.message}\n`);
        return 0;
    }
}

async function migrateCollections(pool) {
    console.log('[STEP 2/7] Fetching collections/categories from Thinkific API...\n');
    try {
        const collections = await fetchAllCollections();
        console.log(`  Found ${collections.length} collections. Inserting...\n`);
        for (const collection of collections) {
            await insertCollection(pool, collection);
        }
        console.log(`  ✓ ${collections.length} collections saved.\n`);
        return collections.length;
    } catch (err) {
        console.log(`  Warning: Could not fetch collections: ${err.message}\n`);
        return 0;
    }
}

async function migrateUsers(pool) {
    console.log('[STEP 3/7] Fetching all users from Thinkific API...\n');
    const users = await fetchAllUsers();
    console.log(`  Found ${users.length} users. Inserting...\n`);
    let count = 0;
    for (const user of users) {
        try {
            await insertUser(pool, user);
            count++;
        } catch (err) {
            console.log(`    Warning: Could not insert user ${user.email}: ${err.message}`);
        }
    }
    console.log(`  ✓ ${count} users saved.\n`);
    return count;
}

async function migrateCourses(pool) {
    console.log('[STEP 4/7] Fetching courses, chapters & contents...\n');
    const courses = await fetchAllCourses();
    console.log(`\n  Found ${courses.length} courses.\n`);

    let totalChapters = 0;
    let totalContents = 0;

    for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        console.log(`  (${i + 1}/${courses.length}) ${course.name}`);

        await insertCourse(pool, course);

        try {
            const chapters = await fetchChapters(course.id);
            for (const chapter of chapters) {
                await insertChapter(pool, chapter, course.id);
                totalChapters++;

                for (const contentId of chapter.content_ids) {
                    try {
                        const content = await fetchContent(contentId);
                        await insertContent(pool, content, chapter.id);
                        totalContents++;
                    } catch (err) {
                        console.log(`    Warning: Could not fetch content ${contentId}: ${err.message}`);
                    }
                    await sleep(50);
                }
            }
        } catch (err) {
            console.log(`    Warning: Could not fetch chapters: ${err.message}`);
        }
        await sleep(100);
    }

    console.log(`\n  ✓ ${courses.length} courses, ${totalChapters} chapters, ${totalContents} contents saved.\n`);
    return { courses: courses.length, chapters: totalChapters, contents: totalContents, courseList: courses };
}

async function migrateEnrollments(pool) {
    console.log('[STEP 5/7] Fetching all enrollments from Thinkific API...\n');
    const enrollments = await fetchAllEnrollments();
    console.log(`  Found ${enrollments.length} enrollments. Inserting...\n`);
    let count = 0;
    for (const enrollment of enrollments) {
        try {
            await insertEnrollment(pool, enrollment);
            count++;
        } catch (err) {
            console.log(`    Warning: Could not insert enrollment ${enrollment.id}: ${err.message}`);
        }
    }
    console.log(`  ✓ ${count} enrollments saved.\n`);
    return count;
}

async function migrateOrders(pool) {
    console.log('[STEP 6/7] Fetching all orders from Thinkific API...\n');
    try {
        const orders = await fetchAllOrders();
        console.log(`  Found ${orders.length} orders. Inserting...\n`);
        let count = 0;
        for (const order of orders) {
            try {
                await insertOrder(pool, order);
                count++;
            } catch (err) {
                console.log(`    Warning: Could not insert order ${order.id}: ${err.message}`);
            }
        }
        console.log(`  ✓ ${count} orders saved.\n`);
        return count;
    } catch (err) {
        console.log(`  Warning: Could not fetch orders: ${err.message}\n`);
        return 0;
    }
}

async function migrateReviews(pool, courseList) {
    console.log('[STEP 7/7] Fetching course reviews from Thinkific API...\n');
    let totalReviews = 0;

    // If we have a course list, use it. Otherwise fetch courses first.
    let courses = courseList;
    if (!courses || courses.length === 0) {
        try {
            const result = await pool.query('SELECT thinkific_id, name FROM thinkific_courses ORDER BY thinkific_id');
            courses = result.rows.map(r => ({ id: r.thinkific_id, name: r.name }));
        } catch (e) {
            console.log('  No courses found to fetch reviews for.\n');
            return 0;
        }
    }

    for (const course of courses) {
        try {
            const reviews = await fetchCourseReviews(course.id);
            for (const review of reviews) {
                await insertReview(pool, review);
                totalReviews++;
            }
            if (reviews.length > 0) {
                console.log(`    ${course.name}: ${reviews.length} reviews`);
            }
        } catch (err) {
            // Skip silently - many courses have no reviews
        }
        await sleep(100);
    }

    console.log(`\n  ✓ ${totalReviews} reviews saved.\n`);
    return totalReviews;
}

// ============================================
// MAIN MIGRATION ORCHESTRATOR
// ============================================

async function migrate(pool) {
    console.log('\n========================================');
    console.log('  STARTING FULL MIGRATION');
    console.log('========================================\n');

    const stats = {};

    // Step 1: Instructors
    stats.instructors = await migrateInstructors(pool);

    // Step 2: Collections/Categories
    stats.collections = await migrateCollections(pool);

    // Step 3: Users
    stats.users = await migrateUsers(pool);

    // Step 4: Courses + Chapters + Contents
    const courseResult = await migrateCourses(pool);
    stats.courses = courseResult.courses;
    stats.chapters = courseResult.chapters;
    stats.contents = courseResult.contents;

    // Step 5: Enrollments
    stats.enrollments = await migrateEnrollments(pool);

    // Step 6: Orders
    stats.orders = await migrateOrders(pool);

    // Step 7: Reviews
    stats.reviews = await migrateReviews(pool, courseResult.courseList);

    // Summary
    printSummary(pool, stats);
}

async function migrateUsersOnly(pool) {
    console.log('\n========================================');
    console.log('  MIGRATING USERS & ENROLLMENTS ONLY');
    console.log('========================================\n');

    const stats = {};
    stats.users = await migrateUsers(pool);
    stats.enrollments = await migrateEnrollments(pool);
    stats.orders = await migrateOrders(pool);

    printSummary(pool, stats);
}

async function printSummary(pool, stats) {
    console.log('\n========================================');
    console.log('  MIGRATION COMPLETE - SUMMARY');
    console.log('========================================\n');

    // DB row counts
    try {
        const counts = await pool.query(COUNT_ROWS_SQL);
        console.log('  Database totals:');
        counts.rows.forEach(r => {
            console.log(`    ${r.table_name.padEnd(30)} ${r.row_count} rows`);
        });
    } catch (e) {
        // ignore
    }

    console.log('\n  This run:');
    Object.entries(stats).forEach(([key, val]) => {
        console.log(`    ${key.padEnd(20)} ${val}`);
    });

    console.log('\n========================================\n');
}

async function showStats(pool) {
    console.log('\n========================================');
    console.log('  DATABASE STATISTICS');
    console.log('========================================\n');

    try {
        const counts = await pool.query(COUNT_ROWS_SQL);
        counts.rows.forEach(r => {
            console.log(`  ${r.table_name.padEnd(30)} ${r.row_count} rows`);
        });
    } catch (e) {
        console.log('  Error: Tables may not exist. Run --check-schema first.');
    }

    // Show some useful cross-references
    try {
        const uniqueUsers = await pool.query('SELECT COUNT(DISTINCT user_thinkific_id) as cnt FROM thinkific_enrollments');
        const completedEnrollments = await pool.query("SELECT COUNT(*) as cnt FROM thinkific_enrollments WHERE completed_at IS NOT NULL");
        const avgCompletion = await pool.query("SELECT ROUND(AVG(percentage_completed), 1) as avg FROM thinkific_enrollments");
        const paidOrders = await pool.query("SELECT COUNT(*) as cnt FROM thinkific_orders WHERE status = 'paid'");

        console.log('\n  Quick insights:');
        console.log(`    Users with enrollments:      ${uniqueUsers.rows[0]?.cnt || 0}`);
        console.log(`    Completed enrollments:       ${completedEnrollments.rows[0]?.cnt || 0}`);
        console.log(`    Average completion %:        ${avgCompletion.rows[0]?.avg || 0}%`);
        console.log(`    Paid orders:                 ${paidOrders.rows[0]?.cnt || 0}`);
    } catch (e) {
        // Tables may not have data yet
    }

    console.log('\n========================================\n');
}

// ============================================
// MAIN
// ============================================

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || '--all';

    const pool = new Pool(DB_CONFIG);

    try {
        await pool.query('SELECT NOW()');
        console.log('\n  Connected to PostgreSQL successfully.\n');

        switch (command) {
            case '--check-schema':
                await checkSchema(pool);
                break;
            case '--migrate':
                await migrate(pool);
                break;
            case '--all':
                await checkSchema(pool);
                await migrate(pool);
                break;
            case '--users-only':
                await migrateUsersOnly(pool);
                break;
            case '--stats':
                await showStats(pool);
                break;
            default:
                console.log('Usage:');
                console.log('  node migrate.js --check-schema   Check and create DB tables');
                console.log('  node migrate.js --migrate        Full migration (all data)');
                console.log('  node migrate.js --all            Check schema + full migrate (default)');
                console.log('  node migrate.js --users-only     Fetch only users, enrollments & orders');
                console.log('  node migrate.js --stats          Show row counts and insights');
                break;
        }
    } catch (err) {
        console.error('\nError:', err.message);
    } finally {
        await pool.end();
    }
}

main();
