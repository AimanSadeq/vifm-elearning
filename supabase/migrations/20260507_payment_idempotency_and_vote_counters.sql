-- ============================================================
-- Payment-flow idempotency + forum vote counter integrity
-- ============================================================
--
-- 1. subscriptions.stripe_subscription_id — partial unique index so a
--    Stripe retry of the same subscription event can't create two rows.
--    (`enrollments` already has UNIQUE(user_id, course_id) and
--    `forum_votes` already has UNIQUE(post_id, user_id) — confirmed in
--    001_initial_schema.sql.)
--
-- 2. Active-subscription-per-user — a partial unique stops two concurrent
--    Stripe checkouts from both creating an active row for the same user.
--    Cancelled/expired rows are not constrained so the user can resub.
--
-- 3. forum_posts.upvotes/downvotes — replace the application-side
--    increment/decrement (lost-update prone under concurrent votes) with
--    a DB trigger that recounts from forum_votes after every change.
--
-- All operations are idempotent (IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- 1. Subscriptions: prevent Stripe-event duplicate inserts
CREATE UNIQUE INDEX IF NOT EXISTS uq_subscriptions_stripe_subscription_id
  ON subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- 2. One active subscription per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_subscriptions_user_active
  ON subscriptions(user_id)
  WHERE status = 'active';

-- 3. Forum vote counter trigger — recompute on any change to forum_votes
CREATE OR REPLACE FUNCTION refresh_forum_post_vote_counts()
RETURNS TRIGGER AS $$
DECLARE
  target_post UUID;
BEGIN
  -- Pick whichever post id is available (insert/update have NEW; delete has OLD).
  target_post := COALESCE(NEW.post_id, OLD.post_id);

  UPDATE forum_posts
     SET upvotes = (
           SELECT COUNT(*)::INT FROM forum_votes
            WHERE post_id = target_post AND vote_type = 'up'
         ),
         downvotes = (
           SELECT COUNT(*)::INT FROM forum_votes
            WHERE post_id = target_post AND vote_type = 'down'
         )
   WHERE id = target_post;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_forum_post_vote_counts ON forum_votes;
CREATE TRIGGER trg_refresh_forum_post_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON forum_votes
  FOR EACH ROW
  EXECUTE FUNCTION refresh_forum_post_vote_counts();

-- One-time backfill so existing rows are consistent before the app stops
-- writing to upvotes/downvotes manually.
UPDATE forum_posts p SET
  upvotes = COALESCE((
    SELECT COUNT(*)::INT FROM forum_votes WHERE post_id = p.id AND vote_type = 'up'
  ), 0),
  downvotes = COALESCE((
    SELECT COUNT(*)::INT FROM forum_votes WHERE post_id = p.id AND vote_type = 'down'
  ), 0);
