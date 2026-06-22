-- Backfill enrollment progress from the authoritative lesson_progress table.
--
-- enrollments.progress_percentage was derived from a lossy completed_lesson_ids
-- array (read-modify-write), so finished courses got stuck well below reality
-- (e.g. 7% when every lesson is done). Recompute every enrollment's completed
-- count + percentage from lesson_progress, which is per-row and accurate.
-- Safe to re-run.

WITH done AS (
  SELECT user_id, course_id, COUNT(*) AS completed
  FROM lesson_progress
  WHERE is_completed = true
  GROUP BY user_id, course_id
),
totals AS (
  SELECT course_id, COUNT(*) AS total
  FROM lessons
  GROUP BY course_id
),
calc AS (
  SELECT
    e.id AS enrollment_id,
    LEAST(COALESCE(d.completed, 0), COALESCE(t.total, 0)) AS completed_items,
    COALESCE(NULLIF(e.total_lesson_items, 0), t.total, 0) AS total_items,
    CASE
      WHEN COALESCE(t.total, 0) > 0
        THEN LEAST(100, ROUND(COALESCE(d.completed, 0)::numeric / t.total * 100))
      ELSE 0
    END AS pct,
    (COALESCE(t.total, 0) > 0 AND COALESCE(d.completed, 0) >= t.total) AS is_done,
    e.status AS cur_status,
    e.completed_at AS cur_completed_at
  FROM enrollments e
  LEFT JOIN totals t ON t.course_id = e.course_id
  LEFT JOIN done d ON d.course_id = e.course_id AND d.user_id = e.user_id
)
UPDATE enrollments e
SET
  completed_lesson_items = c.completed_items,
  total_lesson_items = c.total_items,
  progress_percentage = c.pct,
  status = CASE WHEN c.is_done THEN 'completed' ELSE c.cur_status END,
  completed_at = CASE
    WHEN c.is_done AND c.cur_completed_at IS NULL THEN NOW()
    ELSE c.cur_completed_at
  END
FROM calc c
WHERE c.enrollment_id = e.id;
