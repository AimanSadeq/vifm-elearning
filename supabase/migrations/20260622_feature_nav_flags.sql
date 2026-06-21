-- Admin-controllable visibility for the Subscription and Learning Paths
-- learner nav tabs. Both default to hidden (false). The app already treats a
-- missing row as "hidden", so this seed is optional / documentary — the
-- toggles on the admin platform settings page upsert these same keys.

INSERT INTO site_settings (key, value, description) VALUES
  (
    'feature_subscriptions',
    'false'::jsonb,
    'Show the Subscription tab in the learner sidebar.'
  ),
  (
    'feature_learning_paths',
    'false'::jsonb,
    'Show the Learning Paths tab in the learner sidebar.'
  )
ON CONFLICT (key) DO NOTHING;
