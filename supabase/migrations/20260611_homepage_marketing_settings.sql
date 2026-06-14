-- ============================================================
-- Marketing home content for the mobile app (and web), made
-- admin-editable via the existing site_settings KV table.
--
-- Keys added:
--   homepage_hero      object  -- hero badge/title/subtitle (EN + AR)
--   platform_features  array   -- the 6 platform capability cards
--   homepage_cta       object  -- closing call-to-action copy
--
-- These were previously hardcoded i18n strings. Seeding them here lets
-- a super_admin edit the app's home screen with no code release. The
-- Flutter app reads these keys and falls back to its bundled i18n copy
-- when a key is absent, so applying this migration is non-breaking.
-- ============================================================

INSERT INTO site_settings (key, value, description) VALUES
  (
    'homepage_hero',
    '{"badge": "Professional E-Learning Platform", "badgeAr": "منصة التعلم الإلكتروني الاحترافية", "title": "Advance Your Career with World-Class Professional E-Learning", "titleAr": "طوّر مسيرتك المهنية مع تدريب احترافي عالمي المستوى", "subtitle": "Expert-led courses in Finance, Data Analytics, Strategy, and Compliance — designed for professionals across the GCC region.", "subtitleAr": "دورات يقدمها خبراء في المالية، تحليل البيانات، الاستراتيجية، والامتثال — مصممة للمهنيين في منطقة الخليج."}'::jsonb,
    'Marketing hero on the app/web home — badge, title and subtitle (EN + AR).'
  ),
  (
    'platform_features',
    '[{"key": "bilingual", "icon": "translate", "title": "Bilingual Arabic & English", "titleAr": "ثنائي اللغة: عربي وإنجليزي", "description": "Full platform and content support in both Arabic and English, with seamless switching. Every course, interface element, and assessment adapts to your preferred language.", "descriptionAr": "دعم كامل للمنصة والمحتوى باللغتين العربية والإنجليزية، مع تبديل سلس. كل دورة وواجهة وتقييم يتكيف مع لغتك المفضلة."}, {"key": "video", "icon": "video", "title": "HD Video Learning", "titleAr": "تعلم بالفيديو عالي الجودة", "description": "Professional-quality video courses with adaptive streaming, built-in note-taking, and bookmarks. Learn from expert instructors with crystal-clear content delivery.", "descriptionAr": "دورات فيديو احترافية مع بث تكيّفي وتدوين ملاحظات وإشارات مرجعية مدمجة. تعلّم من مدربين خبراء بجودة عرض فائقة."}, {"key": "quiz", "icon": "quiz", "title": "Interactive Assessments", "titleAr": "تقييمات تفاعلية", "description": "Reinforce learning with quizzes, practice exams, and interactive exercises after each module. Get instant feedback and track your understanding in real-time.", "descriptionAr": "عزّز تعلمك من خلال اختبارات قصيرة وامتحانات تدريبية وتمارين تفاعلية بعد كل وحدة. احصل على تغذية راجعة فورية وتابع فهمك."}, {"key": "cpe", "icon": "cpe", "title": "CPE Credit Tracking", "titleAr": "تتبع ساعات التعليم المستمر", "description": "Automatic tracking of Continuing Professional Education credits for every course and designation. Generate CPE reports for your professional body on demand.", "descriptionAr": "تتبع تلقائي لساعات التعليم المهني المستمر لكل دورة وشهادة. أنشئ تقارير CPE لهيئتك المهنية عند الطلب."}, {"key": "certificate", "icon": "certificate", "title": "Digital Certificates", "titleAr": "شهادات رقمية", "description": "Earn verifiable digital certificates upon course or designation completion. Share on LinkedIn, download branded PDFs, and build your professional portfolio.", "descriptionAr": "احصل على شهادات رقمية قابلة للتحقق عند إكمال الدورة أو الشهادة المهنية. شاركها على LinkedIn أو حمّل نسخة PDF."}, {"key": "exam", "icon": "exam", "title": "Proctored Examinations", "titleAr": "اختبارات مراقبة", "description": "Secure, proctored final examinations for professional designations. Our assessment platform ensures credential integrity with fair, transparent testing.", "descriptionAr": "اختبارات نهائية آمنة ومراقبة للشهادات المهنية. تضمن منصة التقييم نزاهة الاعتمادات باختبارات عادلة وشفافة."}]'::jsonb,
    'The six platform capability cards shown on the home (EN + AR). icon = bilingual|video|quiz|cpe|certificate|exam.'
  ),
  (
    'homepage_cta',
    '{"title": "Ready to Start Your Learning Journey?", "titleAr": "مستعد لبدء رحلتك التعليمية؟", "subtitle": "Join thousands of professionals already learning with VIFM", "subtitleAr": "انضم إلى آلاف المهنيين الذين يتعلمون بالفعل مع VIFM"}'::jsonb,
    'Closing call-to-action copy on the home — title + subtitle (EN + AR).'
  )
ON CONFLICT (key) DO NOTHING;
