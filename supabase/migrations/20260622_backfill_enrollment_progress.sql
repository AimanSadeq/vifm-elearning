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
)
UPDATE enrollments e
SET
  completed_lesson_items = LEAST(COALESCE(d.completed, 0), COALESCE(t.total, 0)),
  total_lesson_items = COALESCE(NULLIF(e.total_lesson_items, 0), t.total, 0),
  progress_percentage = CASE
    WHEN COALESCE(t.total, 0) > 0
      THEN LEAST(100, ROUND(COALESCE(d.completed, 0)::numeric / t.total * 100))
    ELSE 0
  END,
  status = CASE
    WHEN COALESCE(t.total, 0) > 0 AND COALESCE(d.completed, 0) >= t.total
      THEN 'completed'
    ELSE e.status
  END,
  completed_at = CASE
    WHEN COALESCE(t.total, 0) > 0 AND COALESCE(d.completed, 0) >= t.total
         AND e.completed_at IS NULL
      THEN NOW()
    ELSE e.completed_at
  END
FROM totals t
LEFT JOIN done d ON d.course_id = t.course_id AND d.user_id = e.user_id
WHERE e.course_id = t.course_id;
