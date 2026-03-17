/**
 * Transfer from Thinkific staging tables → VIFM eLearning Supabase
 *
 * Reads from thinkific_* staging tables (populated by migrate.js)
 * and writes into the production Supabase schema.
 *
 * Prerequisites:
 *   npm install @supabase/supabase-js pg
 *
 * Usage:
 *   node transfer-to-supabase.mjs --all             Full transfer (default)
 *   node transfer-to-supabase.mjs --categories       Transfer categories only
 *   node transfer-to-supabase.mjs --instructors       Transfer instructors only
 *   node transfer-to-supabase.mjs --users             Transfer users only
 *   node transfer-to-supabase.mjs --courses           Transfer courses + modules + lessons
 *   node transfer-to-supabase.mjs --enrollments       Transfer enrollments only
 *   node transfer-to-supabase.mjs --reviews           Transfer reviews only
 *   node transfer-to-supabase.mjs --orders            Transfer orders as payment records
 *   node transfer-to-supabase.mjs --dry-run           Show what would be transferred
 *   node transfer-to-supabase.mjs --mapping           Show ID mapping tables
 */

import { createClient } from "@supabase/supabase-js";
import pg from "pg";

// ============================================
// CONFIGURATION
// ============================================

// Supabase (production target)
const SUPABASE_URL = "https://guvjbtepgeivfrjdhldx.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1dmpidGVwZ2VpdmZyamRobGR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTU4MzM4OSwiZXhwIjoyMDg3MTU5Mzg5fQ.p19c72FwP4C5NFUhe9G3r4Mdr2X24X_3zMW4ifE8flI";

// PostgreSQL staging database (source — where migrate.js stored the Thinkific data)
const STAGING_DB = {
    host: "db.guvjbtepgeivfrjdhldx.supabase.co",
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: "3nSgkRrSJ9lTdakg",
    ssl: { rejectUnauthorized: false },
};

// Default password for migrated users (they must reset)
const DEFAULT_PASSWORD = "ThinkificMigrated2026!";

// Default category for courses that don't match any collection
const DEFAULT_CATEGORY_NAME = "General";
const DEFAULT_CATEGORY_SLUG = "general";

// ============================================
// CLIENTS
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const stagingPool = new pg.Pool(STAGING_DB);

// ID mapping: thinkific_id → supabase UUID
const idMap = {
    users: {},         // thinkific_user_id → supabase profile UUID
    instructors: {},   // thinkific_instructor_id → supabase profile UUID
    categories: {},    // thinkific_collection_id → supabase category UUID
    courses: {},       // thinkific_course_id → supabase course UUID
    modules: {},       // thinkific_chapter_id → supabase module UUID
    lessons: {},       // thinkific_content_id → supabase lesson UUID
};

// ============================================
// HELPERS
// ============================================

function slugify(str) {
    return (str || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .substring(0, 200);
}

function mapContentType(thinkificType) {
    const map = {
        Lesson: "video",
        Video: "video",
        Quiz: "quiz",
        Survey: "quiz",
        Assignment: "assignment",
        PDF: "document",
        Download: "document",
        Audio: "video",
        Presentation: "document",
        HtmlItem: "document",
        Text: "document",
        Multimedia: "video",
        BrilliumExam: "quiz",
        ExamPdf: "document",
    };
    return map[thinkificType] || "video";
}

function log(step, msg) {
    console.log(`  [${step}] ${msg}`);
}

function logCount(step, count, label) {
    console.log(`  [${step}] ${count} ${label} transferred.`);
}

// ============================================
// STEP 1: CATEGORIES (from thinkific_collections)
// ============================================

async function transferCategories() {
    console.log("\n========================================");
    console.log("  STEP 1: TRANSFERRING CATEGORIES");
    console.log("========================================\n");

    const { rows: collections } = await stagingPool.query(
        "SELECT * FROM thinkific_collections ORDER BY thinkific_id"
    );

    if (collections.length === 0) {
        log("categories", "No collections found in staging. Creating default category.");
    }

    // Ensure default category exists
    const { data: existingDefault } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", DEFAULT_CATEGORY_SLUG)
        .single();

    let defaultCategoryId;
    if (existingDefault) {
        defaultCategoryId = existingDefault.id;
    } else {
        const { data: newCat, error } = await supabase
            .from("categories")
            .insert({
                name: DEFAULT_CATEGORY_NAME,
                slug: DEFAULT_CATEGORY_SLUG,
                description: "General courses migrated from Thinkific",
                sort_order: 100,
                is_active: true,
            })
            .select("id")
            .single();
        if (error) {
            console.error("  Failed to create default category:", error.message);
            return;
        }
        defaultCategoryId = newCat.id;
        log("categories", `Created default category: ${DEFAULT_CATEGORY_NAME}`);
    }
    idMap.categories["default"] = defaultCategoryId;

    let count = 0;
    for (const col of collections) {
        const slug = slugify(col.name) || `collection-${col.thinkific_id}`;

        // Check if already exists
        const { data: existing } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", slug)
            .single();

        if (existing) {
            idMap.categories[col.thinkific_id] = existing.id;
            log("categories", `Exists: ${col.name} -> ${existing.id}`);
            count++;
            continue;
        }

        const { data: newCat, error } = await supabase
            .from("categories")
            .insert({
                name: col.name,
                slug,
                description: col.description || null,
                sort_order: count,
                is_active: true,
            })
            .select("id")
            .single();

        if (error) {
            console.error(`  Failed: ${col.name}: ${error.message}`);
            continue;
        }

        idMap.categories[col.thinkific_id] = newCat.id;
        log("categories", `Created: ${col.name}`);
        count++;
    }

    logCount("categories", count, "categories");
}

// ============================================
// STEP 2: INSTRUCTORS (from thinkific_instructors)
// ============================================

async function transferInstructors() {
    console.log("\n========================================");
    console.log("  STEP 2: TRANSFERRING INSTRUCTORS");
    console.log("========================================\n");

    const { rows: instructors } = await stagingPool.query(
        "SELECT * FROM thinkific_instructors ORDER BY thinkific_id"
    );

    let count = 0;
    for (const inst of instructors) {
        const email = inst.email || `instructor-${inst.thinkific_id}@thinkific-migrated.local`;
        const fullName = `${inst.first_name || ""} ${inst.last_name || ""}`.trim() || `Instructor ${inst.thinkific_id}`;

        // Check if user already exists by email
        const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single();

        if (existingProfile) {
            idMap.instructors[inst.thinkific_id] = existingProfile.id;
            // Update role to instructor if needed
            await supabase.from("profiles").update({ role: "instructor" }).eq("id", existingProfile.id);
            log("instructors", `Exists: ${fullName} (${email})`);
            count++;
            continue;
        }

        // Create Supabase auth user
        const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
            email,
            password: DEFAULT_PASSWORD,
            email_confirm: true,
            app_metadata: { role: "instructor" },
            user_metadata: { full_name: fullName, role: "instructor" },
        });

        if (authErr) {
            console.error(`  Failed to create auth: ${email}: ${authErr.message}`);
            continue;
        }

        const uid = authUser.user.id;

        // Update profile
        await supabase.from("profiles").update({
            full_name: fullName,
            role: "instructor",
            avatar_url: inst.profile_image_url || null,
            is_active: true,
        }).eq("id", uid);

        idMap.instructors[inst.thinkific_id] = uid;
        log("instructors", `Created: ${fullName} (${email})`);
        count++;
    }

    logCount("instructors", count, "instructors");
}

// ============================================
// STEP 3: USERS (from thinkific_users)
// ============================================

async function transferUsers() {
    console.log("\n========================================");
    console.log("  STEP 3: TRANSFERRING USERS");
    console.log("========================================\n");

    const { rows: users } = await stagingPool.query(
        "SELECT * FROM thinkific_users ORDER BY thinkific_id"
    );

    let created = 0;
    let existing = 0;
    let failed = 0;

    for (const user of users) {
        if (!user.email) {
            log("users", `Skipped user ${user.thinkific_id}: no email`);
            continue;
        }

        // Check if already exists
        const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", user.email)
            .single();

        if (existingProfile) {
            idMap.users[user.thinkific_id] = existingProfile.id;
            existing++;
            continue;
        }

        // Determine role
        const roles = user.roles || [];
        let role = "learner";
        if (roles.includes("site_admin") || roles.includes("owner")) {
            role = "super_admin";
        } else if (roles.includes("course_admin") || roles.includes("group_analyst")) {
            role = "instructor";
        }

        // Create Supabase auth user
        const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
            email: user.email,
            password: DEFAULT_PASSWORD,
            email_confirm: true,
            app_metadata: { role },
            user_metadata: {
                full_name: user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim(),
                role,
            },
        });

        if (authErr) {
            // Could be duplicate from instructor step
            const { data: retryProfile } = await supabase
                .from("profiles")
                .select("id")
                .eq("email", user.email)
                .single();
            if (retryProfile) {
                idMap.users[user.thinkific_id] = retryProfile.id;
                existing++;
                continue;
            }
            console.error(`  Failed: ${user.email}: ${authErr.message}`);
            failed++;
            continue;
        }

        const uid = authUser.user.id;

        // Update profile with additional info
        await supabase.from("profiles").update({
            full_name: user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "",
            role,
            avatar_url: user.avatar_url || null,
            phone: null,
            is_active: true,
        }).eq("id", uid);

        idMap.users[user.thinkific_id] = uid;
        created++;

        if (created % 50 === 0) {
            log("users", `Progress: ${created} created, ${existing} existing...`);
        }
    }

    log("users", `Done: ${created} created, ${existing} already existed, ${failed} failed`);
}

// ============================================
// STEP 4: COURSES + MODULES + LESSONS
// ============================================

async function transferCourses() {
    console.log("\n========================================");
    console.log("  STEP 4: TRANSFERRING COURSES");
    console.log("========================================\n");

    const { rows: courses } = await stagingPool.query(
        "SELECT * FROM thinkific_courses ORDER BY thinkific_id"
    );

    let courseCount = 0;
    let moduleCount = 0;
    let lessonCount = 0;

    for (const course of courses) {
        const slug = slugify(course.name) || `course-${course.thinkific_id}`;

        // Check if course already exists
        const { data: existingCourse } = await supabase
            .from("courses")
            .select("id")
            .eq("slug", slug)
            .single();

        if (existingCourse) {
            idMap.courses[course.thinkific_id] = existingCourse.id;
            log("courses", `Exists: ${course.name}`);
            courseCount++;
            // Still need to map modules/lessons
            await transferModulesForCourse(course.thinkific_id, existingCourse.id);
            continue;
        }

        // Find category - try to match via collections that contain this course's product_id
        let categoryId = idMap.categories["default"];
        if (course.product_id) {
            const { rows: matchingCollections } = await stagingPool.query(
                "SELECT thinkific_id FROM thinkific_collections WHERE $1 = ANY(product_ids) LIMIT 1",
                [course.product_id]
            );
            if (matchingCollections.length > 0 && idMap.categories[matchingCollections[0].thinkific_id]) {
                categoryId = idMap.categories[matchingCollections[0].thinkific_id];
            }
        }

        // Find instructor
        let instructorId = null;
        if (course.instructor_id && idMap.instructors[course.instructor_id]) {
            instructorId = idMap.instructors[course.instructor_id];
        }

        // Parse tags from keywords
        const tags = course.keywords
            ? course.keywords.split(",").map(k => k.trim()).filter(Boolean)
            : [];

        const { data: newCourse, error: courseErr } = await supabase
            .from("courses")
            .insert({
                title: course.name,
                slug,
                description: course.description || null,
                short_description: course.subtitle || null,
                thumbnail_url: course.course_card_image_url || null,
                preview_video_url: course.intro_video_youtube || null,
                category_id: categoryId,
                instructor_id: instructorId,
                status: "draft",  // Start as draft, publish after review
                level: "beginner",
                price: 0,
                currency: "USD",
                is_free: true,     // Set pricing manually later
                is_featured: false,
                tags,
                certificate_enabled: true,
                metadata: {
                    thinkific_id: course.thinkific_id,
                    thinkific_slug: course.slug,
                    migrated_at: new Date().toISOString(),
                },
            })
            .select("id")
            .single();

        if (courseErr) {
            console.error(`  Failed course: ${course.name}: ${courseErr.message}`);
            continue;
        }

        idMap.courses[course.thinkific_id] = newCourse.id;
        log("courses", `Created: ${course.name}`);
        courseCount++;

        // Transfer modules & lessons for this course
        const counts = await transferModulesForCourse(course.thinkific_id, newCourse.id);
        moduleCount += counts.modules;
        lessonCount += counts.lessons;
    }

    log("courses", `Done: ${courseCount} courses, ${moduleCount} modules, ${lessonCount} lessons`);
}

async function transferModulesForCourse(thinkificCourseId, supabaseCourseId) {
    const { rows: chapters } = await stagingPool.query(
        "SELECT * FROM thinkific_chapters WHERE course_thinkific_id = $1 ORDER BY position",
        [thinkificCourseId]
    );

    let moduleCount = 0;
    let lessonCount = 0;

    for (const chapter of chapters) {
        // Check if module already exists (via metadata or title match)
        const { data: existingModule } = await supabase
            .from("modules")
            .select("id")
            .eq("course_id", supabaseCourseId)
            .eq("title", chapter.name)
            .single();

        let moduleId;
        if (existingModule) {
            moduleId = existingModule.id;
            idMap.modules[chapter.thinkific_id] = moduleId;
        } else {
            const { data: newModule, error: modErr } = await supabase
                .from("modules")
                .insert({
                    course_id: supabaseCourseId,
                    title: chapter.name,
                    description: chapter.description || null,
                    sort_order: chapter.position || 0,
                })
                .select("id")
                .single();

            if (modErr) {
                console.error(`    Failed module: ${chapter.name}: ${modErr.message}`);
                continue;
            }

            moduleId = newModule.id;
            idMap.modules[chapter.thinkific_id] = moduleId;
        }
        moduleCount++;

        // Transfer lessons for this module
        const { rows: contents } = await stagingPool.query(
            "SELECT * FROM thinkific_contents WHERE chapter_thinkific_id = $1 ORDER BY position",
            [chapter.thinkific_id]
        );

        for (const content of contents) {
            // Check if lesson already exists
            const { data: existingLesson } = await supabase
                .from("lessons")
                .select("id")
                .eq("module_id", moduleId)
                .eq("title", content.name || `Lesson ${content.thinkific_id}`)
                .single();

            if (existingLesson) {
                idMap.lessons[content.thinkific_id] = existingLesson.id;
                lessonCount++;
                continue;
            }

            const contentType = mapContentType(content.contentable_type);

            const { data: newLesson, error: lessonErr } = await supabase
                .from("lessons")
                .insert({
                    module_id: moduleId,
                    title: content.name || `Lesson ${content.thinkific_id}`,
                    content_type: contentType,
                    sort_order: content.position || 0,
                    duration_minutes: 0,
                    is_preview: content.is_free || false,
                    content_url: content.video_url || null,
                    metadata: {
                        thinkific_id: content.thinkific_id,
                        thinkific_type: content.contentable_type,
                        thinkific_take_url: content.take_url,
                        migrated_at: new Date().toISOString(),
                    },
                })
                .select("id")
                .single();

            if (lessonErr) {
                console.error(`    Failed lesson: ${content.name}: ${lessonErr.message}`);
                continue;
            }

            idMap.lessons[content.thinkific_id] = newLesson.id;
            lessonCount++;
        }
    }

    return { modules: moduleCount, lessons: lessonCount };
}

// ============================================
// STEP 5: ENROLLMENTS
// ============================================

async function transferEnrollments() {
    console.log("\n========================================");
    console.log("  STEP 5: TRANSFERRING ENROLLMENTS");
    console.log("========================================\n");

    const { rows: enrollments } = await stagingPool.query(
        "SELECT * FROM thinkific_enrollments ORDER BY thinkific_id"
    );

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const enr of enrollments) {
        // Look up user ID
        let userId = idMap.users[enr.user_thinkific_id];

        // If not in map, try to find by email
        if (!userId && enr.user_email) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("id")
                .eq("email", enr.user_email)
                .single();
            if (profile) {
                userId = profile.id;
                idMap.users[enr.user_thinkific_id] = userId;
            }
        }

        if (!userId) {
            skipped++;
            continue;
        }

        // Look up course ID
        const courseId = idMap.courses[enr.course_thinkific_id];
        if (!courseId) {
            skipped++;
            continue;
        }

        // Map status
        let status = "active";
        if (enr.completed_at) {
            status = "completed";
        } else if (enr.expired) {
            status = "expired";
        }

        // Check if enrollment already exists
        const { data: existing } = await supabase
            .from("enrollments")
            .select("id")
            .eq("user_id", userId)
            .eq("course_id", courseId)
            .single();

        if (existing) {
            skipped++;
            continue;
        }

        const { error } = await supabase.from("enrollments").insert({
            user_id: userId,
            course_id: courseId,
            status,
            enrolled_at: enr.thinkific_created_at || new Date().toISOString(),
            completed_at: enr.completed_at || null,
            expires_at: enr.expiry_date || null,
            progress: enr.percentage_completed || 0,
        });

        if (error) {
            if (error.code === "23505") {
                // Unique constraint - already exists
                skipped++;
            } else {
                console.error(`  Failed enrollment ${enr.thinkific_id}: ${error.message}`);
                failed++;
            }
            continue;
        }

        created++;
        if (created % 100 === 0) {
            log("enrollments", `Progress: ${created} created...`);
        }
    }

    log("enrollments", `Done: ${created} created, ${skipped} skipped, ${failed} failed`);
}

// ============================================
// STEP 6: ORDERS → PAYMENTS
// ============================================

async function transferOrders() {
    console.log("\n========================================");
    console.log("  STEP 6: TRANSFERRING ORDERS → PAYMENTS");
    console.log("========================================\n");

    const { rows: orders } = await stagingPool.query(
        "SELECT * FROM thinkific_orders ORDER BY thinkific_id"
    );

    let created = 0;
    let skipped = 0;

    for (const order of orders) {
        // Look up user
        let userId = idMap.users[order.user_thinkific_id];
        if (!userId && order.user_email) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("id")
                .eq("email", order.user_email)
                .single();
            if (profile) {
                userId = profile.id;
            }
        }
        if (!userId) {
            skipped++;
            continue;
        }

        // Try to find course from product_id
        let courseId = null;
        if (order.product_id) {
            const { rows: matchCourse } = await stagingPool.query(
                "SELECT thinkific_id FROM thinkific_courses WHERE product_id = $1 LIMIT 1",
                [order.product_id]
            );
            if (matchCourse.length > 0) {
                courseId = idMap.courses[matchCourse[0].thinkific_id] || null;
            }
        }

        // Map status
        let paymentStatus = "pending";
        if (order.status === "paid") paymentStatus = "completed";
        else if (order.status === "refunded") paymentStatus = "refunded";
        else if (order.status === "failed" || order.status === "declined") paymentStatus = "failed";

        const amount = order.amount_dollars || (order.amount_cents ? order.amount_cents / 100 : 0);

        const { error } = await supabase.from("payments").insert({
            user_id: userId,
            course_id: courseId,
            amount,
            currency: "USD",
            status: paymentStatus,
            method: "stripe",  // Thinkific uses Stripe
            discount_amount: 0,
            paid_at: paymentStatus === "completed" ? (order.thinkific_created_at || new Date().toISOString()) : null,
            metadata: {
                thinkific_order_id: order.thinkific_id,
                thinkific_status: order.status,
                thinkific_coupon_code: order.coupon_code,
                order_items: order.order_items,
                migrated_at: new Date().toISOString(),
            },
        });

        if (error) {
            console.error(`  Failed order ${order.thinkific_id}: ${error.message}`);
            continue;
        }

        created++;
    }

    log("orders", `Done: ${created} created, ${skipped} skipped`);
}

// ============================================
// STEP 7: REVIEWS
// ============================================

async function transferReviews() {
    console.log("\n========================================");
    console.log("  STEP 7: TRANSFERRING REVIEWS");
    console.log("========================================\n");

    const { rows: reviews } = await stagingPool.query(
        "SELECT * FROM thinkific_reviews ORDER BY thinkific_id"
    );

    let created = 0;
    let skipped = 0;

    for (const review of reviews) {
        const userId = idMap.users[review.user_thinkific_id];
        const courseId = idMap.courses[review.course_thinkific_id];

        if (!userId || !courseId) {
            skipped++;
            continue;
        }

        // Check if review already exists
        const { data: existing } = await supabase
            .from("reviews")
            .select("id")
            .eq("user_id", userId)
            .eq("course_id", courseId)
            .single();

        if (existing) {
            skipped++;
            continue;
        }

        const { error } = await supabase.from("reviews").insert({
            user_id: userId,
            course_id: courseId,
            rating: Math.min(5, Math.max(1, review.rating || 3)),
            body: review.review_text || review.title || null,
            is_visible: review.approved || false,
        });

        if (error) {
            if (error.code === "23505") {
                skipped++;
            } else {
                console.error(`  Failed review ${review.thinkific_id}: ${error.message}`);
            }
            continue;
        }

        created++;
    }

    log("reviews", `Done: ${created} created, ${skipped} skipped`);
}

// ============================================
// DRY RUN - Preview what will be transferred
// ============================================

async function dryRun() {
    console.log("\n========================================");
    console.log("  DRY RUN - PREVIEW");
    console.log("========================================\n");

    const tables = [
        { name: "thinkific_collections", label: "Categories" },
        { name: "thinkific_instructors", label: "Instructors" },
        { name: "thinkific_users", label: "Users" },
        { name: "thinkific_courses", label: "Courses" },
        { name: "thinkific_chapters", label: "Modules (chapters)" },
        { name: "thinkific_contents", label: "Lessons (contents)" },
        { name: "thinkific_enrollments", label: "Enrollments" },
        { name: "thinkific_orders", label: "Orders → Payments" },
        { name: "thinkific_reviews", label: "Reviews" },
    ];

    for (const t of tables) {
        try {
            const { rows } = await stagingPool.query(`SELECT COUNT(*) as cnt FROM ${t.name}`);
            console.log(`  ${t.label.padEnd(30)} ${rows[0].cnt} records`);
        } catch (e) {
            console.log(`  ${t.label.padEnd(30)} table not found`);
        }
    }

    // Show sample data
    console.log("\n  Sample courses:");
    const { rows: sampleCourses } = await stagingPool.query(
        "SELECT thinkific_id, name FROM thinkific_courses ORDER BY thinkific_id LIMIT 10"
    );
    sampleCourses.forEach(c => console.log(`    [${c.thinkific_id}] ${c.name}`));

    console.log("\n  Sample users:");
    const { rows: sampleUsers } = await stagingPool.query(
        "SELECT thinkific_id, email, full_name FROM thinkific_users ORDER BY thinkific_id LIMIT 10"
    );
    sampleUsers.forEach(u => console.log(`    [${u.thinkific_id}] ${u.email} (${u.full_name})`));

    // Check existing Supabase data
    console.log("\n  Existing Supabase data:");
    const { count: catCount } = await supabase.from("categories").select("*", { count: "exact", head: true });
    const { count: profileCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    const { count: courseCount } = await supabase.from("courses").select("*", { count: "exact", head: true });
    const { count: enrollCount } = await supabase.from("enrollments").select("*", { count: "exact", head: true });

    console.log(`    Categories:   ${catCount || 0}`);
    console.log(`    Profiles:     ${profileCount || 0}`);
    console.log(`    Courses:      ${courseCount || 0}`);
    console.log(`    Enrollments:  ${enrollCount || 0}`);

    console.log("\n  No changes made (dry run).\n");
}

// ============================================
// SHOW ID MAPPING
// ============================================

async function showMapping() {
    console.log("\n========================================");
    console.log("  ID MAPPING TABLES");
    console.log("========================================\n");

    for (const [key, map] of Object.entries(idMap)) {
        const entries = Object.entries(map);
        if (entries.length === 0) {
            console.log(`  ${key}: (empty - run transfer first)`);
            continue;
        }
        console.log(`  ${key} (${entries.length} entries):`);
        entries.slice(0, 5).forEach(([tId, sId]) => {
            console.log(`    Thinkific ${tId} -> Supabase ${sId}`);
        });
        if (entries.length > 5) {
            console.log(`    ... and ${entries.length - 5} more`);
        }
    }
}

// ============================================
// FULL TRANSFER
// ============================================

async function fullTransfer() {
    console.log("\n╔══════════════════════════════════════════╗");
    console.log("║  THINKIFIC → SUPABASE FULL TRANSFER     ║");
    console.log("╚══════════════════════════════════════════╝\n");

    const startTime = Date.now();

    await transferCategories();
    await transferInstructors();
    await transferUsers();
    await transferCourses();
    await transferEnrollments();
    await transferOrders();
    await transferReviews();

    const elapsed = Math.round((Date.now() - startTime) / 1000);

    console.log("\n========================================");
    console.log("  TRANSFER COMPLETE");
    console.log("========================================\n");

    console.log(`  Time elapsed: ${elapsed}s\n`);
    console.log("  ID Mappings:");
    for (const [key, map] of Object.entries(idMap)) {
        console.log(`    ${key.padEnd(20)} ${Object.keys(map).length} entries`);
    }

    console.log("\n  NEXT STEPS:");
    console.log("  1. Review courses in admin panel (they are in 'draft' status)");
    console.log("  2. Upload videos for each course/lesson");
    console.log("  3. Set course pricing (all imported as free)");
    console.log("  4. Publish courses when ready");
    console.log("  5. Send password reset emails to migrated users");
    console.log(`  6. Default password for all migrated users: ${DEFAULT_PASSWORD}`);
    console.log("  7. Review and clean up any duplicate categories\n");
}

// ============================================
// MAIN
// ============================================

async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || "--all";

    try {
        await stagingPool.query("SELECT NOW()");
        console.log("  Connected to staging PostgreSQL.");
    } catch (err) {
        console.error("Failed to connect to staging DB:", err.message);
        console.error("Update STAGING_DB config in the script.");
        process.exit(1);
    }

    try {
        const { data, error } = await supabase.from("categories").select("id").limit(1);
        if (error) throw error;
        console.log("  Connected to Supabase.\n");
    } catch (err) {
        console.error("Failed to connect to Supabase:", err.message);
        process.exit(1);
    }

    try {
        switch (command) {
            case "--all":
                await fullTransfer();
                break;
            case "--categories":
                await transferCategories();
                break;
            case "--instructors":
                await transferInstructors();
                break;
            case "--users":
                await transferUsers();
                break;
            case "--courses":
                await transferCourses();
                break;
            case "--enrollments":
                // Need to build ID maps first
                await buildIdMaps();
                await transferEnrollments();
                break;
            case "--reviews":
                await buildIdMaps();
                await transferReviews();
                break;
            case "--orders":
                await buildIdMaps();
                await transferOrders();
                break;
            case "--dry-run":
                await dryRun();
                break;
            case "--mapping":
                await buildIdMaps();
                await showMapping();
                break;
            default:
                console.log("Usage:");
                console.log("  node transfer-to-supabase.mjs --all           Full transfer (default)");
                console.log("  node transfer-to-supabase.mjs --categories    Categories only");
                console.log("  node transfer-to-supabase.mjs --instructors   Instructors only");
                console.log("  node transfer-to-supabase.mjs --users         Users only");
                console.log("  node transfer-to-supabase.mjs --courses       Courses + modules + lessons");
                console.log("  node transfer-to-supabase.mjs --enrollments   Enrollments only");
                console.log("  node transfer-to-supabase.mjs --reviews       Reviews only");
                console.log("  node transfer-to-supabase.mjs --orders        Orders -> payments");
                console.log("  node transfer-to-supabase.mjs --dry-run       Preview without changes");
                console.log("  node transfer-to-supabase.mjs --mapping       Show ID mapping tables");
                break;
        }
    } catch (err) {
        console.error("\nFatal error:", err.message);
        console.error(err.stack);
    } finally {
        await stagingPool.end();
    }
}

/**
 * Build ID maps from existing data (for partial transfers)
 */
async function buildIdMaps() {
    console.log("  Building ID maps from existing data...\n");

    // Map users: match by email
    const { rows: stagingUsers } = await stagingPool.query(
        "SELECT thinkific_id, email FROM thinkific_users WHERE email IS NOT NULL"
    );
    for (const u of stagingUsers) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", u.email)
            .single();
        if (profile) {
            idMap.users[u.thinkific_id] = profile.id;
        }
    }
    console.log(`  Users mapped: ${Object.keys(idMap.users).length}`);

    // Map courses: match by slug
    const { rows: stagingCourses } = await stagingPool.query(
        "SELECT thinkific_id, name, slug FROM thinkific_courses"
    );
    for (const c of stagingCourses) {
        const slug = slugify(c.name) || `course-${c.thinkific_id}`;
        const { data: course } = await supabase
            .from("courses")
            .select("id")
            .eq("slug", slug)
            .single();
        if (course) {
            idMap.courses[c.thinkific_id] = course.id;
        }
    }
    console.log(`  Courses mapped: ${Object.keys(idMap.courses).length}`);

    // Map categories
    const { rows: stagingCollections } = await stagingPool.query(
        "SELECT thinkific_id, name FROM thinkific_collections"
    );
    for (const col of stagingCollections) {
        const slug = slugify(col.name);
        const { data: cat } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", slug)
            .single();
        if (cat) {
            idMap.categories[col.thinkific_id] = cat.id;
        }
    }
    console.log(`  Categories mapped: ${Object.keys(idMap.categories).length}`);

    console.log();
}

main().catch(console.error);
