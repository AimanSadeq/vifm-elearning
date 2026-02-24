-- ============================================================================
-- VIFM Designations — Complete Seed Data
-- Updates CDIP & CHRS pricing, inserts 12 new designations
-- Run in: Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. UPDATE EXISTING DESIGNATIONS (CDIP & CHRS)
-- ============================================================================

-- CDIP → Tier 1 Gateway pricing
UPDATE designations SET
  founding_fee = 0,
  renewal_fee = 110,
  annual_cpe_required = 20,
  metadata = jsonb_build_object(
    'tier_level', 'gateway',
    'exam_type', 'multiple_choice',
    'pass_rate', 65,
    'free_attempts', 2,
    'cpe_cycle_years', 2,
    'cpe_cycle_hours', 40,
    'prerequisites', '[]'::jsonb
  ),
  updated_at = NOW()
WHERE abbreviation = 'CDIP';

-- CHRS → Tier 2 Professional pricing
UPDATE designations SET
  founding_fee = 50,
  renewal_fee = 170,
  annual_cpe_required = 20,
  metadata = jsonb_build_object(
    'tier_level', 'professional',
    'exam_type', 'multiple_choice',
    'pass_rate', 65,
    'free_attempts', 2,
    'cpe_cycle_years', 2,
    'cpe_cycle_hours', 40,
    'prerequisites', '[]'::jsonb
  ),
  updated_at = NOW()
WHERE abbreviation = 'CHRS';

-- ============================================================================
-- 2. INSERT NEW DESIGNATIONS
-- ============================================================================

-- ---------- TIER 1: GATEWAY ----------

-- CASP — Certified AI Strategy Professional
INSERT INTO designations (
  name, name_ar, slug, abbreviation, description, description_ar,
  annual_cpe_required, renewal_fee, founding_fee, late_fee, reinstatement_fee,
  currency, renewal_month, renewal_day, grace_period_months, is_active, metadata
) VALUES (
  'Certified AI Strategy Professional',
  'محترف استراتيجية الذكاء الاصطناعي المعتمد',
  'casp', 'CASP',
  'This intensive program is designed for professionals aiming to master the strategic integration of AI within their organizations. Participants develop the acumen to formulate robust AI strategies, drive innovation, and lead successful AI-driven transformations.',
  'هذا البرنامج المكثف مصمم للمحترفين الذين يهدفون إلى إتقان التكامل الاستراتيجي للذكاء الاصطناعي داخل مؤسساتهم.',
  20, 110, 0, 30, 30, 'USD', 7, 1, 3, TRUE,
  '{"tier_level":"gateway","exam_type":"multiple_choice","pass_rate":65,"free_attempts":2,"cpe_cycle_years":2,"cpe_cycle_hours":40,"prerequisites":[]}'::jsonb
) ON CONFLICT (abbreviation) DO NOTHING;

-- CDA — Certificate in Data Analysis & Business Reporting
INSERT INTO designations (
  name, name_ar, slug, abbreviation, description, description_ar,
  annual_cpe_required, renewal_fee, founding_fee, late_fee, reinstatement_fee,
  currency, renewal_month, renewal_day, grace_period_months, is_active, metadata
) VALUES (
  'Certificate in Data Analysis & Business Reporting Techniques Using Excel',
  'شهادة في تحليل البيانات وتقنيات إعداد التقارير باستخدام إكسل',
  'cda', 'CDA',
  'This hands-on course advances your data massaging, modeling, integration and automation skills using Excel. Master normalization, preparation of reports, analysis and reconciliation.',
  'تطور هذه الدورة العملية مهاراتك في معالجة البيانات والنمذجة والتكامل والأتمتة باستخدام إكسل.',
  20, 110, 0, 30, 30, 'USD', 7, 1, 3, TRUE,
  '{"tier_level":"gateway","exam_type":"multiple_choice","pass_rate":65,"free_attempts":2,"cpe_cycle_years":2,"cpe_cycle_hours":40,"prerequisites":[]}'::jsonb
) ON CONFLICT (abbreviation) DO NOTHING;

-- CAPA — Certified AI Powered Accountant
INSERT INTO designations (
  name, name_ar, slug, abbreviation, description, description_ar,
  annual_cpe_required, renewal_fee, founding_fee, late_fee, reinstatement_fee,
  currency, renewal_month, renewal_day, grace_period_months, is_active, metadata
) VALUES (
  'Certified AI Powered Accountant',
  'المحاسب المعتمد المدعوم بالذكاء الاصطناعي',
  'capa', 'CAPA',
  'The CAPA program equips accounting professionals with practical AI skills to modernize their workflows. Participants learn AI fundamentals and apply AI tools to bookkeeping, financial reporting, and Excel-based tasks.',
  'يزود برنامج CAPA المحترفين المحاسبيين بمهارات الذكاء الاصطناعي العملية لتحديث سير عملهم.',
  20, 110, 0, 30, 30, 'USD', 7, 1, 3, TRUE,
  '{"tier_level":"gateway","exam_type":"multiple_choice","pass_rate":65,"free_attempts":2,"cpe_cycle_years":2,"cpe_cycle_hours":40,"prerequisites":[]}'::jsonb
) ON CONFLICT (abbreviation) DO NOTHING;

-- ---------- TIER 2: PROFESSIONAL ----------

-- CAIP — Certified Artificial Intelligence Practitioner
INSERT INTO designations (
  name, name_ar, slug, abbreviation, description, description_ar,
  annual_cpe_required, renewal_fee, founding_fee, late_fee, reinstatement_fee,
  currency, renewal_month, renewal_day, grace_period_months, is_active, metadata
) VALUES (
  'Certified Artificial Intelligence Practitioner',
  'ممارس الذكاء الاصطناعي المعتمد',
  'caip', 'CAIP',
  'The CAIP course equips professionals with skills to use AI in a modern and effective way. Participants learn AI for content creation, data analysis, workflow automation, and machine learning without needing coding expertise.',
  'تزود دورة CAIP المحترفين بمهارات استخدام الذكاء الاصطناعي بطريقة حديثة وفعالة.',
  20, 170, 50, 30, 30, 'USD', 7, 1, 3, TRUE,
  '{"tier_level":"professional","exam_type":"multiple_choice","pass_rate":65,"free_attempts":2,"cpe_cycle_years":2,"cpe_cycle_hours":40,"prerequisites":["CDIP","CASP"]}'::jsonb
) ON CONFLICT (abbreviation) DO NOTHING;

-- CAFA — Certified AI Financial Analyst
INSERT INTO designations (
  name, name_ar, slug, abbreviation, description, description_ar,
  annual_cpe_required, renewal_fee, founding_fee, late_fee, reinstatement_fee,
  currency, renewal_month, renewal_day, grace_period_months, is_active, metadata
) VALUES (
  'Certified AI Financial Analyst',
  'المحلل المالي المعتمد بالذكاء الاصطناعي',
  'cafa', 'CAFA',
  'The Certified AI Financial Analyst program introduces a modern way of working with financial data by combining solid analytical skills with the power of Microsoft Copilot AI.',
  'يقدم برنامج المحلل المالي المعتمد بالذكاء الاصطناعي طريقة حديثة للعمل مع البيانات المالية.',
  20, 170, 50, 30, 30, 'USD', 7, 1, 3, TRUE,
  '{"tier_level":"professional","exam_type":"multiple_choice","pass_rate":65,"free_attempts":2,"cpe_cycle_years":2,"cpe_cycle_hours":40,"prerequisites":[]}'::jsonb
) ON CONFLICT (abbreviation) DO NOTHING;

-- CAIFL — Certified AI Finance Leader
INSERT INTO designations (
  name, name_ar, slug, abbreviation, description, description_ar,
  annual_cpe_required, renewal_fee, founding_fee, late_fee, reinstatement_fee,
  currency, renewal_month, renewal_day, grace_period_months, is_active, metadata
) VALUES (
  'Certified AI Finance Leader',
  'قائد المالية المعتمد بالذكاء الاصطناعي',
  'caifl', 'CAIFL',
  'The CAIFL program empowers finance professionals to leverage artificial intelligence for strategic decision-making in financial planning, forecasting, analytics, risk assessment, and corporate valuation.',
  'يمكّن برنامج CAIFL المحترفين الماليين من الاستفادة من الذكاء الاصطناعي لاتخاذ القرارات الاستراتيجية.',
  20, 170, 50, 30, 30, 'USD', 7, 1, 3, TRUE,
  '{"tier_level":"professional","exam_type":"multiple_choice","pass_rate":65,"free_attempts":2,"cpe_cycle_years":2,"cpe_cycle_hours":40,"prerequisites":[]}'::jsonb
) ON CONFLICT (abbreviation) DO NOTHING;

-- CCTP — Certified Cost Transformation Practitioner
INSERT INTO designations (
  name, name_ar, slug, abbreviation, description, description_ar,
  annual_cpe_required, renewal_fee, founding_fee, late_fee, reinstatement_fee,
  currency, renewal_month, renewal_day, grace_period_months, is_active, metadata
) VALUES (
  'Certified Cost Transformation Practitioner',
  'ممارس تحويل التكاليف المعتمد',
  'cctp', 'CCTP',
  'This certification helps professionals rethink how organizations manage and improve their costs through practical frameworks using Excel, Power BI, and Copilot.',
  'تساعد هذه الشهادة المحترفين على إعادة التفكير في كيفية إدارة المؤسسات لتكاليفها وتحسينها.',
  20, 170, 50, 30, 30, 'USD', 7, 1, 3, TRUE,
  '{"tier_level":"professional","exam_type":"multiple_choice","pass_rate":65,"free_attempts":2,"cpe_cycle_years":2,"cpe_cycle_hours":40,"prerequisites":[]}'::jsonb
) ON CONFLICT (abbreviation) DO NOTHING;

-- CDBTL — Certified Digital & Business Transformation Leader
INSERT INTO designations (
  name, name_ar, slug, abbreviation, description, description_ar,
  annual_cpe_required, renewal_fee, founding_fee, late_fee, reinstatement_fee,
  currency, renewal_month, renewal_day, grace_period_months, is_active, metadata
) VALUES (
  'Certified Digital & Business Transformation Leader',
  'قائد التحول الرقمي والأعمال المعتمد',
  'cdbtl', 'CDBTL',
  'This course prepares business leaders to design, lead, and implement transformation strategies that drive sustainable growth, focusing on both business strategy and digital tools.',
  'تعد هذه الدورة قادة الأعمال لتصميم وقيادة وتنفيذ استراتيجيات التحول التي تدفع النمو المستدام.',
  20, 170, 50, 30, 30, 'USD', 7, 1, 3, TRUE,
  '{"tier_level":"professional","exam_type":"multiple_choice","pass_rate":65,"free_attempts":2,"cpe_cycle_years":2,"cpe_cycle_hours":40,"prerequisites":[]}'::jsonb
) ON CONFLICT (abbreviation) DO NOTHING;

-- CSMP — Certified Strategic Marketing Professional
INSERT INTO designations (
  name, name_ar, slug, abbreviation, description, description_ar,
  annual_cpe_required, renewal_fee, founding_fee, late_fee, reinstatement_fee,
  currency, renewal_month, renewal_day, grace_period_months, is_active, metadata
) VALUES (
  'Certified Strategic Marketing Professional',
  'محترف التسويق الاستراتيجي المعتمد',
  'csmp', 'CSMP',
  'This course equips participants with the knowledge and tools to design, execute, and measure strategic marketing initiatives that create sustainable growth and competitive advantage.',
  'تزود هذه الدورة المشاركين بالمعرفة والأدوات لتصميم وتنفيذ وقياس مبادرات التسويق الاستراتيجي.',
  20, 170, 50, 30, 30, 'USD', 7, 1, 3, TRUE,
  '{"tier_level":"professional","exam_type":"multiple_choice","pass_rate":65,"free_attempts":2,"cpe_cycle_years":2,"cpe_cycle_hours":40,"prerequisites":[]}'::jsonb
) ON CONFLICT (abbreviation) DO NOTHING;

-- ---------- TIER 3: EXECUTIVE ----------

-- CSBIP — Certified Strategic Business Intelligence Partner
INSERT INTO designations (
  name, name_ar, slug, abbreviation, description, description_ar,
  annual_cpe_required, renewal_fee, founding_fee, late_fee, reinstatement_fee,
  currency, renewal_month, renewal_day, grace_period_months, is_active, metadata
) VALUES (
  'Certified Strategic Business Intelligence Partner',
  'شريك ذكاء الأعمال الاستراتيجي المعتمد',
  'csbip', 'CSBIP',
  'This course focuses on the highest-impact role of data: building one system and driving decisions. For BI professionals who think strategically and translate data into actionable business decisions.',
  'تركز هذه الدورة على الدور الأكثر تأثيراً للبيانات: بناء نظام واحد ودفع القرارات.',
  20, 230, 70, 30, 30, 'USD', 7, 1, 3, TRUE,
  '{"tier_level":"executive","exam_type":"simulation","pass_rate":65,"free_attempts":2,"cpe_cycle_years":2,"cpe_cycle_hours":40,"prerequisites":["CAIP"]}'::jsonb
) ON CONFLICT (abbreviation) DO NOTHING;

-- CBACP — Certified Board Audit Committee Professional
INSERT INTO designations (
  name, name_ar, slug, abbreviation, description, description_ar,
  annual_cpe_required, renewal_fee, founding_fee, late_fee, reinstatement_fee,
  currency, renewal_month, renewal_day, grace_period_months, is_active, metadata
) VALUES (
  'Certified Board Audit Committee Professional',
  'محترف لجنة التدقيق المعتمد',
  'cbacp', 'CBACP',
  'The CBACP program empowers professionals to serve as the ethical backbone of corporate governance. Participants explore how effective audit committees shape financial transparency, strengthen internal control, and ensure strategic resilience.',
  'يمكّن برنامج CBACP المحترفين من العمل كعمود فقري أخلاقي لحوكمة الشركات.',
  20, 230, 70, 30, 30, 'USD', 7, 1, 3, TRUE,
  '{"tier_level":"executive","exam_type":"simulation","pass_rate":65,"free_attempts":2,"cpe_cycle_years":2,"cpe_cycle_hours":40,"prerequisites":[]}'::jsonb
) ON CONFLICT (abbreviation) DO NOTHING;

-- CPAFG — Certified Professional in AI Forensic Governance
INSERT INTO designations (
  name, name_ar, slug, abbreviation, description, description_ar,
  annual_cpe_required, renewal_fee, founding_fee, late_fee, reinstatement_fee,
  currency, renewal_month, renewal_day, grace_period_months, is_active, metadata
) VALUES (
  'Certified Professional in AI Forensic Governance',
  'المحترف المعتمد في حوكمة الطب الشرعي بالذكاء الاصطناعي',
  'cpafg', 'CPAFG',
  'This program empowers professionals to lead with integrity at the intersection of technology, ethics, and accountability. It blends forensic investigation principles with AI governance.',
  'يمكّن هذا البرنامج المحترفين من القيادة بنزاهة عند تقاطع التكنولوجيا والأخلاقيات والمساءلة.',
  20, 230, 70, 30, 30, 'USD', 7, 1, 3, TRUE,
  '{"tier_level":"executive","exam_type":"simulation","pass_rate":65,"free_attempts":2,"cpe_cycle_years":2,"cpe_cycle_hours":40,"prerequisites":[]}'::jsonb
) ON CONFLICT (abbreviation) DO NOTHING;

-- CAIQLP — Certified AI Quality Leadership Professional
INSERT INTO designations (
  name, name_ar, slug, abbreviation, description, description_ar,
  annual_cpe_required, renewal_fee, founding_fee, late_fee, reinstatement_fee,
  currency, renewal_month, renewal_day, grace_period_months, is_active, metadata
) VALUES (
  'Certified AI Quality Leadership Professional',
  'محترف قيادة الجودة بالذكاء الاصطناعي المعتمد',
  'caiqlp', 'CAIQLP',
  'This program equips supervisors, team leaders, and managers to lead small, safe AI initiatives within Quality Management Systems while maintaining compliance and control.',
  'يزود هذا البرنامج المشرفين وقادة الفرق والمديرين لقيادة مبادرات الذكاء الاصطناعي ضمن أنظمة إدارة الجودة.',
  20, 230, 70, 30, 30, 'USD', 7, 1, 3, TRUE,
  '{"tier_level":"executive","exam_type":"simulation","pass_rate":65,"free_attempts":2,"cpe_cycle_years":2,"cpe_cycle_hours":40,"prerequisites":[]}'::jsonb
) ON CONFLICT (abbreviation) DO NOTHING;

-- ============================================================================
-- 3. INSERT TIERS (Founding Member + Standard for each new designation)
-- ============================================================================

-- CASP tiers
INSERT INTO designation_tiers (designation_id, name, name_ar, slug, renewal_fee, is_available, sort_order)
VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CASP'), 'Founding Member', 'عضو مؤسس', 'founding-member', 0, false, 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CASP'), 'Standard', 'عادي', 'standard', 110, true, 2)
ON CONFLICT (designation_id, slug) DO NOTHING;

-- CDA tiers
INSERT INTO designation_tiers (designation_id, name, name_ar, slug, renewal_fee, is_available, sort_order)
VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CDA'), 'Founding Member', 'عضو مؤسس', 'founding-member', 0, false, 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CDA'), 'Standard', 'عادي', 'standard', 110, true, 2)
ON CONFLICT (designation_id, slug) DO NOTHING;

-- CAPA tiers
INSERT INTO designation_tiers (designation_id, name, name_ar, slug, renewal_fee, is_available, sort_order)
VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CAPA'), 'Founding Member', 'عضو مؤسس', 'founding-member', 0, false, 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CAPA'), 'Standard', 'عادي', 'standard', 110, true, 2)
ON CONFLICT (designation_id, slug) DO NOTHING;

-- CAIP tiers
INSERT INTO designation_tiers (designation_id, name, name_ar, slug, renewal_fee, is_available, sort_order)
VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CAIP'), 'Founding Member', 'عضو مؤسس', 'founding-member', 50, false, 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIP'), 'Standard', 'عادي', 'standard', 170, true, 2)
ON CONFLICT (designation_id, slug) DO NOTHING;

-- CAFA tiers
INSERT INTO designation_tiers (designation_id, name, name_ar, slug, renewal_fee, is_available, sort_order)
VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CAFA'), 'Founding Member', 'عضو مؤسس', 'founding-member', 50, false, 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CAFA'), 'Standard', 'عادي', 'standard', 170, true, 2)
ON CONFLICT (designation_id, slug) DO NOTHING;

-- CAIFL tiers
INSERT INTO designation_tiers (designation_id, name, name_ar, slug, renewal_fee, is_available, sort_order)
VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CAIFL'), 'Founding Member', 'عضو مؤسس', 'founding-member', 50, false, 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIFL'), 'Standard', 'عادي', 'standard', 170, true, 2)
ON CONFLICT (designation_id, slug) DO NOTHING;

-- CCTP tiers
INSERT INTO designation_tiers (designation_id, name, name_ar, slug, renewal_fee, is_available, sort_order)
VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CCTP'), 'Founding Member', 'عضو مؤسس', 'founding-member', 50, false, 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CCTP'), 'Standard', 'عادي', 'standard', 170, true, 2)
ON CONFLICT (designation_id, slug) DO NOTHING;

-- CDBTL tiers
INSERT INTO designation_tiers (designation_id, name, name_ar, slug, renewal_fee, is_available, sort_order)
VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CDBTL'), 'Founding Member', 'عضو مؤسس', 'founding-member', 50, false, 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CDBTL'), 'Standard', 'عادي', 'standard', 170, true, 2)
ON CONFLICT (designation_id, slug) DO NOTHING;

-- CSMP tiers
INSERT INTO designation_tiers (designation_id, name, name_ar, slug, renewal_fee, is_available, sort_order)
VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CSMP'), 'Founding Member', 'عضو مؤسس', 'founding-member', 50, false, 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CSMP'), 'Standard', 'عادي', 'standard', 170, true, 2)
ON CONFLICT (designation_id, slug) DO NOTHING;

-- CSBIP tiers
INSERT INTO designation_tiers (designation_id, name, name_ar, slug, renewal_fee, is_available, sort_order)
VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CSBIP'), 'Founding Member', 'عضو مؤسس', 'founding-member', 70, false, 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CSBIP'), 'Standard', 'عادي', 'standard', 230, true, 2)
ON CONFLICT (designation_id, slug) DO NOTHING;

-- CBACP tiers
INSERT INTO designation_tiers (designation_id, name, name_ar, slug, renewal_fee, is_available, sort_order)
VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CBACP'), 'Founding Member', 'عضو مؤسس', 'founding-member', 70, false, 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CBACP'), 'Standard', 'عادي', 'standard', 230, true, 2)
ON CONFLICT (designation_id, slug) DO NOTHING;

-- CPAFG tiers
INSERT INTO designation_tiers (designation_id, name, name_ar, slug, renewal_fee, is_available, sort_order)
VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CPAFG'), 'Founding Member', 'عضو مؤسس', 'founding-member', 70, false, 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CPAFG'), 'Standard', 'عادي', 'standard', 230, true, 2)
ON CONFLICT (designation_id, slug) DO NOTHING;

-- CAIQLP tiers
INSERT INTO designation_tiers (designation_id, name, name_ar, slug, renewal_fee, is_available, sort_order)
VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CAIQLP'), 'Founding Member', 'عضو مؤسس', 'founding-member', 70, false, 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIQLP'), 'Standard', 'عادي', 'standard', 230, true, 2)
ON CONFLICT (designation_id, slug) DO NOTHING;

-- Also update CDIP tiers to match new pricing
UPDATE designation_tiers SET renewal_fee = 0
WHERE designation_id = (SELECT id FROM designations WHERE abbreviation = 'CDIP')
  AND slug = 'founding-member';
UPDATE designation_tiers SET renewal_fee = 110
WHERE designation_id = (SELECT id FROM designations WHERE abbreviation = 'CDIP')
  AND slug = 'standard';

-- Also update CHRS tiers to match new pricing
UPDATE designation_tiers SET renewal_fee = 50
WHERE designation_id = (SELECT id FROM designations WHERE abbreviation = 'CHRS')
  AND slug = 'founding-member';
UPDATE designation_tiers SET renewal_fee = 170
WHERE designation_id = (SELECT id FROM designations WHERE abbreviation = 'CHRS')
  AND slug = 'standard';

-- ============================================================================
-- 4. INSERT CPE CATEGORIES (4 per designation, 12 new designations)
-- ============================================================================

DO $$
DECLARE
  abbr TEXT;
  abbrs TEXT[] := ARRAY['CASP','CDA','CAPA','CAIP','CAFA','CAIFL','CCTP','CDBTL','CSMP','CSBIP','CBACP','CPAFG','CAIQLP'];
  des_id UUID;
BEGIN
  FOREACH abbr IN ARRAY abbrs LOOP
    SELECT id INTO des_id FROM designations WHERE abbreviation = abbr;
    IF des_id IS NOT NULL THEN
      INSERT INTO cpe_categories (designation_id, name, name_ar, description, annual_max_hours, requires_approval, sort_order)
      VALUES
        (des_id, 'VIFM Training Courses', 'دورات تدريب VIFM', 'Instructor-led training courses delivered by VIFM. 1 CPE hour per training hour.', NULL, FALSE, 1),
        (des_id, 'VIFM Webinars', 'ندوات VIFM', 'Webinars and online learning sessions hosted by VIFM. 1 CPE hour per webinar hour.', NULL, FALSE, 2),
        (des_id, 'External Conferences', 'المؤتمرات الخارجية', 'Attendance at professional conferences and industry events. Documentation required.', 10, TRUE, 3),
        (des_id, 'Self-Study', 'الدراسة الذاتية', 'Self-directed learning activities such as reading publications or completing online courses.', 5, TRUE, 4);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 5. INSERT DOCUMENT PLACEHOLDERS
-- ============================================================================

-- CASP — 5 modules
INSERT INTO designation_documents (designation_id, title, title_ar, description, file_url, file_type, sort_order) VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CASP'), 'Module 1: Foundations of AI Strategy', 'الوحدة 1: أسس استراتيجية الذكاء الاصطناعي', 'Understanding the AI landscape, strategic opportunities, and developing an AI-ready mindset.', 'casp/casp-module1-foundations.pdf', 'pdf', 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CASP'), 'Module 2: AI Technologies & Business Applications', 'الوحدة 2: تقنيات الذكاء الاصطناعي وتطبيقات الأعمال', 'Demystifying AI technologies for business leaders and exploring practical applications.', 'casp/casp-module2-technologies.pdf', 'pdf', 2),
  ((SELECT id FROM designations WHERE abbreviation = 'CASP'), 'Module 3: Ethical AI & Governance', 'الوحدة 3: أخلاقيات الذكاء الاصطناعي والحوكمة', 'Addressing ethical considerations and establishing governance frameworks.', 'casp/casp-module3-ethics.pdf', 'pdf', 3),
  ((SELECT id FROM designations WHERE abbreviation = 'CASP'), 'Module 4: Leading AI Innovation & Transformation', 'الوحدة 4: قيادة الابتكار والتحول بالذكاء الاصطناعي', 'Fostering innovation culture, managing AI projects, and driving organizational change.', 'casp/casp-module4-innovation.pdf', 'pdf', 4),
  ((SELECT id FROM designations WHERE abbreviation = 'CASP'), 'Module 5: Implementing & Sustaining AI Strategy', 'الوحدة 5: تنفيذ واستدامة استراتيجية الذكاء الاصطناعي', 'Developing implementation roadmaps, managing transitions, and building partnerships.', 'casp/casp-module5-implementation.pdf', 'pdf', 5);

-- CDA — 6 modules
INSERT INTO designation_documents (designation_id, title, title_ar, description, file_url, file_type, sort_order) VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CDA'), 'Module 1: Data Massaging Tools & Techniques', 'الوحدة 1: أدوات وتقنيات معالجة البيانات', 'Merge, consolidate, validate, and clean data using Excel functions.', 'cda/cda-module1-data-massaging.pdf', 'pdf', 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CDA'), 'Module 2: Pivot Tables Reporting', 'الوحدة 2: إعداد التقارير بالجداول المحورية', 'The 19 rules of Pivot Tables: design, analytics, and visualization.', 'cda/cda-module2-pivot-tables.pdf', 'pdf', 2),
  ((SELECT id FROM designations WHERE abbreviation = 'CDA'), 'Module 3: Data Modeling', 'الوحدة 3: نمذجة البيانات', 'Spinners, check boxes, what-if analysis, Goal Seek, Solver, and Scenario Manager.', 'cda/cda-module3-data-modeling.pdf', 'pdf', 3),
  ((SELECT id FROM designations WHERE abbreviation = 'CDA'), 'Module 4: Data Integration Using PowerQuery', 'الوحدة 4: تكامل البيانات باستخدام PowerQuery', 'Linking Excel with text files, databases, and multiple Excel files.', 'cda/cda-module4-powerquery.pdf', 'pdf', 4),
  ((SELECT id FROM designations WHERE abbreviation = 'CDA'), 'Module 5: Advanced Reporting Using Power Pivot', 'الوحدة 5: التقارير المتقدمة باستخدام Power Pivot', 'ETL processes, data model relationships, and advanced reporting.', 'cda/cda-module5-power-pivot.pdf', 'pdf', 5),
  ((SELECT id FROM designations WHERE abbreviation = 'CDA'), 'Module 6: Automation Using Macros', 'الوحدة 6: الأتمتة باستخدام الماكرو', 'Planning, recording, testing, editing, and running macros.', 'cda/cda-module6-macros.pdf', 'pdf', 6);

-- CAPA — 5 modules
INSERT INTO designation_documents (designation_id, title, title_ar, description, file_url, file_type, sort_order) VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CAPA'), 'Module 1: Foundations of AI in Accounting', 'الوحدة 1: أسس الذكاء الاصطناعي في المحاسبة', 'AI concepts, machine learning, NLP, and AI capabilities for automation.', 'capa/capa-module1-foundations.pdf', 'pdf', 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CAPA'), 'Module 2: AI-Powered Bookkeeping', 'الوحدة 2: مسك الدفاتر المدعوم بالذكاء الاصطناعي', 'Automating transaction recording, reconciliation, and error detection.', 'capa/capa-module2-bookkeeping.pdf', 'pdf', 2),
  ((SELECT id FROM designations WHERE abbreviation = 'CAPA'), 'Module 3: Automating Financial Reporting with AI', 'الوحدة 3: أتمتة التقارير المالية بالذكاء الاصطناعي', 'AI-driven report generation, financial statements, and KPI evaluation.', 'capa/capa-module3-reporting.pdf', 'pdf', 3),
  ((SELECT id FROM designations WHERE abbreviation = 'CAPA'), 'Module 4: Excel Formulas Using AI', 'الوحدة 4: صيغ إكسل باستخدام الذكاء الاصطناعي', 'AI-assisted formulas, data processing, and analysis within Excel.', 'capa/capa-module4-excel-ai.pdf', 'pdf', 4),
  ((SELECT id FROM designations WHERE abbreviation = 'CAPA'), 'Module 5: Integrated AI Applications in Accounting', 'الوحدة 5: تطبيقات الذكاء الاصطناعي المتكاملة في المحاسبة', 'Case studies combining AI in bookkeeping, reporting, and Excel.', 'capa/capa-module5-integrated.pdf', 'pdf', 5);

-- CAIP — 8 modules
INSERT INTO designation_documents (designation_id, title, title_ar, description, file_url, file_type, sort_order) VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CAIP'), 'Module 1: Prompt Engineering', 'الوحدة 1: هندسة الأوامر', 'Understanding prompts, structuring instructions, iterating and refining.', 'caip/caip-module1-prompt-engineering.pdf', 'pdf', 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIP'), 'Module 2: Difference Between GPTs', 'الوحدة 2: الفرق بين نماذج GPT', 'ChatGPT, Gemini, and Copilot comparison and platform selection.', 'caip/caip-module2-gpts.pdf', 'pdf', 2),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIP'), 'Module 3: AI Tools for Content Creation', 'الوحدة 3: أدوات الذكاء الاصطناعي لإنشاء المحتوى', 'Presentations, images, videos, audio, and written content generation.', 'caip/caip-module3-content-creation.pdf', 'pdf', 3),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIP'), 'Module 4: AI Tools for Data Analysis', 'الوحدة 4: أدوات الذكاء الاصطناعي لتحليل البيانات', 'Data preparation, analysis, reporting, and visualization.', 'caip/caip-module4-data-analysis.pdf', 'pdf', 4),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIP'), 'Module 5: Low-Code/No-Code Machine Learning', 'الوحدة 5: التعلم الآلي بدون كود', 'Clustering, classification, market basket analysis, and sentiment analysis.', 'caip/caip-module5-ml.pdf', 'pdf', 5),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIP'), 'Module 6: Agentic AI', 'الوحدة 6: الذكاء الاصطناعي الوكيل', 'Autonomous agents, task execution, research, and workflow assistance.', 'caip/caip-module6-agentic-ai.pdf', 'pdf', 6),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIP'), 'Module 7: Model Context Protocol (MCP)', 'الوحدة 7: بروتوكول سياق النموذج', 'MCP structure, enterprise data integration, security, and governance.', 'caip/caip-module7-mcp.pdf', 'pdf', 7),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIP'), 'Module 8: AI Tools for Automation', 'الوحدة 8: أدوات الذكاء الاصطناعي للأتمتة', 'Task identification, automation tools, custom workflows, and implementation.', 'caip/caip-module8-automation.pdf', 'pdf', 8);

-- CAFA — 7 modules
INSERT INTO designation_documents (designation_id, title, title_ar, description, file_url, file_type, sort_order) VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CAFA'), 'Module 1: Introduction to Financial Statements with Copilot AI', 'الوحدة 1: مقدمة في القوائم المالية مع Copilot AI', 'Overview of financial statements supported by Copilot tools.', 'cafa/cafa-module1-intro.pdf', 'pdf', 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CAFA'), 'Module 2: Income Statement Analysis with Copilot AI', 'الوحدة 2: تحليل قائمة الدخل مع Copilot AI', 'AI support for reviewing revenues, costs, and profitability.', 'cafa/cafa-module2-income.pdf', 'pdf', 2),
  ((SELECT id FROM designations WHERE abbreviation = 'CAFA'), 'Module 3: Balance Sheet Analysis with Copilot AI', 'الوحدة 3: تحليل الميزانية العمومية مع Copilot AI', 'Assets, liabilities, equity, depreciation, and solvency evaluation.', 'cafa/cafa-module3-balance-sheet.pdf', 'pdf', 3),
  ((SELECT id FROM designations WHERE abbreviation = 'CAFA'), 'Module 4: Cash Flow Analysis with Copilot AI', 'الوحدة 4: تحليل التدفقات النقدية مع Copilot AI', 'Operating, investing, and financing cash flows with AI support.', 'cafa/cafa-module4-cash-flow.pdf', 'pdf', 4),
  ((SELECT id FROM designations WHERE abbreviation = 'CAFA'), 'Module 5: Financial Ratio Analysis with Copilot AI', 'الوحدة 5: تحليل النسب المالية مع Copilot AI', 'Automatic ratio generation, dashboards, and performance summaries.', 'cafa/cafa-module5-ratios.pdf', 'pdf', 5),
  ((SELECT id FROM designations WHERE abbreviation = 'CAFA'), 'Module 6: Performance Evaluation & Trend Analysis', 'الوحدة 6: تقييم الأداء وتحليل الاتجاهات', 'Comparative analysis, horizontal/vertical analysis, and performance shifts.', 'cafa/cafa-module6-trends.pdf', 'pdf', 6),
  ((SELECT id FROM designations WHERE abbreviation = 'CAFA'), 'Module 7: Business Decision-Making with Copilot AI', 'الوحدة 7: اتخاذ القرارات التجارية مع Copilot AI', 'Cost analysis, capital project evaluation, valuation, and risk review.', 'cafa/cafa-module7-decisions.pdf', 'pdf', 7);

-- CAIFL — 5 modules
INSERT INTO designation_documents (designation_id, title, title_ar, description, file_url, file_type, sort_order) VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CAIFL'), 'Module 1: AI in Financial Planning, Budgeting & Forecasting', 'الوحدة 1: الذكاء الاصطناعي في التخطيط المالي والميزانية والتنبؤ', 'AI applications in finance planning, automated forecasting, and scenario planning.', 'caifl/caifl-module1-planning.pdf', 'pdf', 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIFL'), 'Module 2: Descriptive & Predictive Analytics for Finance', 'الوحدة 2: التحليلات الوصفية والتنبؤية للمالية', 'Data visualization, historical performance, predictive models, and dashboards.', 'caifl/caifl-module2-analytics.pdf', 'pdf', 2),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIFL'), 'Module 3: AI in Risk Management', 'الوحدة 3: الذكاء الاصطناعي في إدارة المخاطر', 'Risk modeling, fraud detection, compliance checks, and stress testing.', 'caifl/caifl-module3-risk.pdf', 'pdf', 3),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIFL'), 'Module 4: AI for Corporate Valuation & Investment Decisions', 'الوحدة 4: الذكاء الاصطناعي للتقييم المؤسسي وقرارات الاستثمار', 'AI-enhanced valuation models, investment screening, and M&A analysis.', 'caifl/caifl-module4-valuation.pdf', 'pdf', 4),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIFL'), 'Module 5: Integrated AI Applications in Strategic Finance', 'الوحدة 5: تطبيقات الذكاء الاصطناعي المتكاملة في المالية الاستراتيجية', 'Case studies combining forecasting, analytics, risk, and valuation.', 'caifl/caifl-module5-integrated.pdf', 'pdf', 5);

-- CCTP — 9 modules
INSERT INTO designation_documents (designation_id, title, title_ar, description, file_url, file_type, sort_order) VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CCTP'), 'Module 1: Strategic Cost Awareness', 'الوحدة 1: الوعي الاستراتيجي بالتكاليف', 'Cost transformation concepts, efficiency, and financial sustainability.', 'cctp/cctp-module1-awareness.pdf', 'pdf', 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CCTP'), 'Module 2: Cost Structure Mapping in Excel', 'الوحدة 2: رسم هيكل التكاليف في إكسل', 'Visualization of cost elements, drivers, and benchmark comparisons.', 'cctp/cctp-module2-mapping.pdf', 'pdf', 2),
  ((SELECT id FROM designations WHERE abbreviation = 'CCTP'), 'Module 3: Transformation Frameworks & Phases', 'الوحدة 3: أطر ومراحل التحول', 'Core phases, enablers, accountability, and common challenges.', 'cctp/cctp-module3-frameworks.pdf', 'pdf', 3),
  ((SELECT id FROM designations WHERE abbreviation = 'CCTP'), 'Module 4: Copilot for Cost Insights', 'الوحدة 4: Copilot لرؤى التكاليف', 'Cost summaries, variance insights, and scenario commentary with AI.', 'cctp/cctp-module4-copilot.pdf', 'pdf', 4),
  ((SELECT id FROM designations WHERE abbreviation = 'CCTP'), 'Module 5: Performance Metrics & Dashboards', 'الوحدة 5: مقاييس الأداء ولوحات المعلومات', 'Cost KPIs, Power BI visuals, variance display, and executive dashboards.', 'cctp/cctp-module5-metrics.pdf', 'pdf', 5),
  ((SELECT id FROM designations WHERE abbreviation = 'CCTP'), 'Module 6: Efficiency & Process Improvement', 'الوحدة 6: الكفاءة وتحسين العمليات', 'Common inefficiencies, lean-based improvements, and tracking results.', 'cctp/cctp-module6-efficiency.pdf', 'pdf', 6),
  ((SELECT id FROM designations WHERE abbreviation = 'CCTP'), 'Module 7: Cost Forecasting & Scenario Modeling', 'الوحدة 7: التنبؤ بالتكاليف ونمذجة السيناريوهات', 'Forecasting templates, what-if analysis, and Power BI trends.', 'cctp/cctp-module7-forecasting.pdf', 'pdf', 7),
  ((SELECT id FROM designations WHERE abbreviation = 'CCTP'), 'Module 8: Implementation & Change Readiness', 'الوحدة 8: التنفيذ والاستعداد للتغيير', 'Stakeholder alignment, monitoring, sustaining benefits, and success factors.', 'cctp/cctp-module8-implementation.pdf', 'pdf', 8),
  ((SELECT id FROM designations WHERE abbreviation = 'CCTP'), 'Module 9: Capstone Project', 'الوحدة 9: مشروع التخرج', 'Realistic cost transformation scenario, simulation, and presentation.', 'cctp/cctp-module9-capstone.pdf', 'pdf', 9);

-- CDBTL — 8 modules
INSERT INTO designation_documents (designation_id, title, title_ar, description, file_url, file_type, sort_order) VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CDBTL'), 'Module 1: Foundations of Digital & Business Transformation', 'الوحدة 1: أسس التحول الرقمي والأعمال', 'Business vs. digital transformation, global trends, and readiness.', 'cdbtl/cdbtl-module1-foundations.pdf', 'pdf', 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CDBTL'), 'Module 2: Business Model Innovation & Process Transformation', 'الوحدة 2: ابتكار نماذج الأعمال وتحول العمليات', 'Platform models, value chain disruption, Lean, Agile, and Six Sigma.', 'cdbtl/cdbtl-module2-innovation.pdf', 'pdf', 2),
  ((SELECT id FROM designations WHERE abbreviation = 'CDBTL'), 'Module 3: Technology as a Strategic Enabler', 'الوحدة 3: التكنولوجيا كمحفز استراتيجي', 'Cloud, AI/ML, IoT, Blockchain, Big Data, and technology roadmaps.', 'cdbtl/cdbtl-module3-technology.pdf', 'pdf', 3),
  ((SELECT id FROM designations WHERE abbreviation = 'CDBTL'), 'Module 4: Change & Building Transformation Culture', 'الوحدة 4: التغيير وبناء ثقافة التحول', 'Leadership, digital competencies, change frameworks (Kotter, ADKAR).', 'cdbtl/cdbtl-module4-change.pdf', 'pdf', 4),
  ((SELECT id FROM designations WHERE abbreviation = 'CDBTL'), 'Module 5: Strategy Execution & Measuring Success', 'الوحدة 5: تنفيذ الاستراتيجية وقياس النجاح', 'Transformation roadmaps, governance, KPIs, and OKRs.', 'cdbtl/cdbtl-module5-execution.pdf', 'pdf', 5),
  ((SELECT id FROM designations WHERE abbreviation = 'CDBTL'), 'Module 6: Innovation & Continuous Improvement', 'الوحدة 6: الابتكار والتحسين المستمر', 'Experimentation, prototyping, scaling, and innovation labs.', 'cdbtl/cdbtl-module6-continuous.pdf', 'pdf', 6),
  ((SELECT id FROM designations WHERE abbreviation = 'CDBTL'), 'Module 7: Risk Management & Governance', 'الوحدة 7: إدارة المخاطر والحوكمة', 'Digital transformation risks, compliance, cybersecurity, and accountability.', 'cdbtl/cdbtl-module7-risk.pdf', 'pdf', 7),
  ((SELECT id FROM designations WHERE abbreviation = 'CDBTL'), 'Module 8: Sustainability & Future Trends', 'الوحدة 8: الاستدامة والاتجاهات المستقبلية', 'ESG integration, green technologies, and future disruptions.', 'cdbtl/cdbtl-module8-sustainability.pdf', 'pdf', 8);

-- CSMP — 8 modules
INSERT INTO designation_documents (designation_id, title, title_ar, description, file_url, file_type, sort_order) VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CSMP'), 'Module 1: Strategic Marketing Principles & Market Dynamics', 'الوحدة 1: مبادئ التسويق الاستراتيجي وديناميكيات السوق', 'Marketing role in growth, customer behavior, and competitive analysis.', 'csmp/csmp-module1-principles.pdf', 'pdf', 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CSMP'), 'Module 2: Segmentation, Targeting & Positioning (STP)', 'الوحدة 2: التجزئة والاستهداف والتموضع', 'Advanced segmentation, targeting models, and perceptual mapping.', 'csmp/csmp-module2-stp.pdf', 'pdf', 2),
  ((SELECT id FROM designations WHERE abbreviation = 'CSMP'), 'Module 3: Strategic Marketing Planning', 'الوحدة 3: التخطيط التسويقي الاستراتيجي', 'Marketing strategy alignment, value propositions, and scenario planning.', 'csmp/csmp-module3-planning.pdf', 'pdf', 3),
  ((SELECT id FROM designations WHERE abbreviation = 'CSMP'), 'Module 4: Go-to-Market Strategy', 'الوحدة 4: استراتيجية الذهاب إلى السوق', 'Market entry, product launch, partnerships, and channel design.', 'csmp/csmp-module4-gtm.pdf', 'pdf', 4),
  ((SELECT id FROM designations WHERE abbreviation = 'CSMP'), 'Module 5: Brand Strategy & Storytelling', 'الوحدة 5: استراتيجية العلامة التجارية وسرد القصص', 'Brand equity, architecture, portfolio management, and storytelling.', 'csmp/csmp-module5-brand.pdf', 'pdf', 5),
  ((SELECT id FROM designations WHERE abbreviation = 'CSMP'), 'Module 6: Customer Experience & Pricing Strategy', 'الوحدة 6: تجربة العميل واستراتيجية التسعير', 'Customer journey design, pricing as positioning, and Blue Ocean Strategy.', 'csmp/csmp-module6-cx-pricing.pdf', 'pdf', 6),
  ((SELECT id FROM designations WHERE abbreviation = 'CSMP'), 'Module 7: Measuring Marketing Performance & ROI', 'الوحدة 7: قياس أداء التسويق والعائد على الاستثمار', 'ROMI, Balanced Scorecards, dashboards, and impact tracking.', 'csmp/csmp-module7-roi.pdf', 'pdf', 7),
  ((SELECT id FROM designations WHERE abbreviation = 'CSMP'), 'Module 8: Future of Strategic Marketing', 'الوحدة 8: مستقبل التسويق الاستراتيجي', 'AI in marketing, purpose-driven strategies, and sustainability.', 'csmp/csmp-module8-future.pdf', 'pdf', 8);

-- CSBIP — 5 modules
INSERT INTO designation_documents (designation_id, title, title_ar, description, file_url, file_type, sort_order) VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CSBIP'), 'Module 1: Enterprise Advantage Through Data Analysis', 'الوحدة 1: الميزة المؤسسية من خلال تحليل البيانات', 'Data translation, analytics opportunities, KPIs, and reporting.', 'csbip/csbip-module1-enterprise.pdf', 'pdf', 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CSBIP'), 'Module 2: Business Acumen & Decision Intelligence', 'الوحدة 2: الفطنة التجارية وذكاء القرار', 'Core business models, decision frameworks, and strategic thinking.', 'csbip/csbip-module2-acumen.pdf', 'pdf', 2),
  ((SELECT id FROM designations WHERE abbreviation = 'CSBIP'), 'Module 3: Executive Communication with Data', 'الوحدة 3: التواصل التنفيذي بالبيانات', 'Business context communication, actionable insights, and influence.', 'csbip/csbip-module3-communication.pdf', 'pdf', 3),
  ((SELECT id FROM designations WHERE abbreviation = 'CSBIP'), 'Module 4: AI Acumen & Integration', 'الوحدة 4: الفطنة في الذكاء الاصطناعي والتكامل', 'AI in business, tool identification, integration, and automation.', 'csbip/csbip-module4-ai.pdf', 'pdf', 4),
  ((SELECT id FROM designations WHERE abbreviation = 'CSBIP'), 'Module 5: Value Enablement Data Architecture', 'الوحدة 5: بنية بيانات تمكين القيمة', 'Data pipelines, ETL/ELT processes, governance, security, and quality.', 'csbip/csbip-module5-architecture.pdf', 'pdf', 5);

-- CBACP — 7 modules
INSERT INTO designation_documents (designation_id, title, title_ar, description, file_url, file_type, sort_order) VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CBACP'), 'Module 1: Corporate Governance Foundations', 'الوحدة 1: أسس حوكمة الشركات', 'Governance structures, board roles, accountability, and global frameworks.', 'cbacp/cbacp-module1-governance.pdf', 'pdf', 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CBACP'), 'Module 2: Audit Committee Leadership', 'الوحدة 2: قيادة لجنة التدقيق', 'Leadership mandate, charters, boardroom decision-making, and chairmanship.', 'cbacp/cbacp-module2-leadership.pdf', 'pdf', 2),
  ((SELECT id FROM designations WHERE abbreviation = 'CBACP'), 'Module 3: Financial Oversight Practices', 'الوحدة 3: ممارسات الرقابة المالية', 'Financial statements, accounting judgments, audit quality, and KPIs.', 'cbacp/cbacp-module3-oversight.pdf', 'pdf', 3),
  ((SELECT id FROM designations WHERE abbreviation = 'CBACP'), 'Module 4: Risk & Control Governance', 'الوحدة 4: حوكمة المخاطر والرقابة', 'Risk management, internal controls, assurance, and continuous improvement.', 'cbacp/cbacp-module4-risk.pdf', 'pdf', 4),
  ((SELECT id FROM designations WHERE abbreviation = 'CBACP'), 'Module 5: Regulatory & Compliance Insight', 'الوحدة 5: الرؤى التنظيمية والامتثال', 'Regulatory frameworks, compliance systems, whistleblowing, and ESG.', 'cbacp/cbacp-module5-compliance.pdf', 'pdf', 5),
  ((SELECT id FROM designations WHERE abbreviation = 'CBACP'), 'Module 6: Ethical & Strategic Decision-Making', 'الوحدة 6: اتخاذ القرارات الأخلاقية والاستراتيجية', 'Ethical judgment, fiduciary duty, conflicts of interest, and long-term value.', 'cbacp/cbacp-module6-ethics.pdf', 'pdf', 6),
  ((SELECT id FROM designations WHERE abbreviation = 'CBACP'), 'Module 7: Stakeholder Reporting & Transparency', 'الوحدة 7: إعداد التقارير لأصحاب المصلحة والشفافية', 'Board reporting, audit committee disclosures, trust, and ESG assurance.', 'cbacp/cbacp-module7-reporting.pdf', 'pdf', 7);

-- CPAFG — 7 modules
INSERT INTO designation_documents (designation_id, title, title_ar, description, file_url, file_type, sort_order) VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CPAFG'), 'Module 1: AI Governance Frameworks', 'الوحدة 1: أطر حوكمة الذكاء الاصطناعي', 'AI governance pillars, global standards, EU AI Act, OECD, and ISO 42001.', 'cpafg/cpafg-module1-governance.pdf', 'pdf', 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CPAFG'), 'Module 2: Forensic Data Analytics', 'الوحدة 2: تحليلات البيانات الجنائية', 'Data forensics, anomaly detection, visualization, and predictive analytics.', 'cpafg/cpafg-module2-forensics.pdf', 'pdf', 2),
  ((SELECT id FROM designations WHERE abbreviation = 'CPAFG'), 'Module 3: Ethical AI Oversight', 'الوحدة 3: الرقابة الأخلاقية على الذكاء الاصطناعي', 'Ethical boundaries, algorithmic bias, responsible oversight, and explainability.', 'cpafg/cpafg-module3-ethics.pdf', 'pdf', 3),
  ((SELECT id FROM designations WHERE abbreviation = 'CPAFG'), 'Module 4: Digital Evidence Management', 'الوحدة 4: إدارة الأدلة الرقمية', 'Evidence collection, chain of custody, AI in forensics, and reporting.', 'cpafg/cpafg-module4-evidence.pdf', 'pdf', 4),
  ((SELECT id FROM designations WHERE abbreviation = 'CPAFG'), 'Module 5: Fraud & Compliance', 'الوحدة 5: الاحتيال والامتثال', 'Anti-fraud programs, AML, risk scoring, and forensic-compliance coordination.', 'cpafg/cpafg-module5-fraud.pdf', 'pdf', 5),
  ((SELECT id FROM designations WHERE abbreviation = 'CPAFG'), 'Module 6: Algorithmic Accountability', 'الوحدة 6: المساءلة الخوارزمية', 'ML governance, bias detection, model validation, and control frameworks.', 'cpafg/cpafg-module6-accountability.pdf', 'pdf', 6),
  ((SELECT id FROM designations WHERE abbreviation = 'CPAFG'), 'Module 7: Cyber Risk Resilience', 'الوحدة 7: مرونة المخاطر السيبرانية', 'Cybersecurity, threat intelligence, incident detection, and data recovery.', 'cpafg/cpafg-module7-cyber.pdf', 'pdf', 7);

-- CAIQLP — 5 modules
INSERT INTO designation_documents (designation_id, title, title_ar, description, file_url, file_type, sort_order) VALUES
  ((SELECT id FROM designations WHERE abbreviation = 'CAIQLP'), 'Module 1: AI & Quality Leadership Basics', 'الوحدة 1: أساسيات الذكاء الاصطناعي وقيادة الجودة', 'Why leaders must understand AI, customer focus, compliance, and guardrails.', 'caiqlp/caiqlp-module1-basics.pdf', 'pdf', 1),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIQLP'), 'Module 2: Planning AI Use in Quality', 'الوحدة 2: تخطيط استخدام الذكاء الاصطناعي في الجودة', 'Safe starter areas, risk identification, oversight design, and pilot scoping.', 'caiqlp/caiqlp-module2-planning.pdf', 'pdf', 2),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIQLP'), 'Module 3: Leading AI-Supported Teams', 'الوحدة 3: قيادة الفرق المدعومة بالذكاء الاصطناعي', 'Roles, RACI, ISO compliance, audit evidence, and workflow integration.', 'caiqlp/caiqlp-module3-leading.pdf', 'pdf', 3),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIQLP'), 'Module 4: Building a Culture of AI-Enabled Quality', 'الوحدة 4: بناء ثقافة الجودة المدعومة بالذكاء الاصطناعي', 'Safe experimentation, PDCA integration, adoption cadence, and stop/scale decisions.', 'caiqlp/caiqlp-module4-culture.pdf', 'pdf', 4),
  ((SELECT id FROM designations WHERE abbreviation = 'CAIQLP'), 'Module 5: Measurement, Reporting & Audit Readiness', 'الوحدة 5: القياس والتقارير والاستعداد للتدقيق', 'Leading/lagging indicators, evidence packaging, and pilot consolidation.', 'caiqlp/caiqlp-module5-measurement.pdf', 'pdf', 5);

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
