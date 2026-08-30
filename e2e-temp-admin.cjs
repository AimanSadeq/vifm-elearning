// Creates (or deletes with --delete) a throwaway super_admin for local UI checks.
const fs = require('fs');
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);
const { createClient } = require('@supabase/supabase-js');
const a = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const EMAIL = 'e2e-quiz-admin@example.com';
const PASS = 'E2ETest123!';
(async () => {
  const { data: list } = await a.auth.admin.listUsers({ perPage: 200 });
  const existing = list.users.find(u => u.email === EMAIL);
  if (process.argv[2] === '--delete') {
    if (existing) {
      await a.from('profiles').delete().eq('id', existing.id);
      await a.auth.admin.deleteUser(existing.id);
    }
    console.log('deleted');
    return;
  }
  if (existing) { console.log('exists', existing.id); return; }
  const { data, error } = await a.auth.admin.createUser({
    email: EMAIL, password: PASS, email_confirm: true,
    app_metadata: { role: 'super_admin' }, user_metadata: { full_name: 'E2E Quiz Admin' },
  });
  if (error) throw error;
  await a.from('profiles').upsert({
    id: data.user.id, email: EMAIL, full_name: 'E2E Quiz Admin',
    role: 'super_admin', is_active: true,
  });
  console.log('created', data.user.id);
})();
