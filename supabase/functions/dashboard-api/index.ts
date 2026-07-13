// Supabase Edge Function: dashboard-api
//
// Proxies the personal dashboard's auth + CRUD calls so the browser never
// holds the Supabase project URL or anon key. SUPABASE_URL and
// SUPABASE_ANON_KEY are provided automatically by the Edge Function
// runtime as environment variables — no secrets to configure manually.
//
// Deploy with JWT verification DISABLED (this function does its own auth
// by validating the access_token in the request body), otherwise Supabase's
// gateway will reject requests before they reach this code.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid JSON body' }, 400);
  }

  const { action } = body;

  // Login and refresh are the only actions that don't require an existing session.
  if (action === 'login') {
    const { email, password } = body;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return json({ error: error.message }, 401);
    return json({ session: data.session });
  }

  if (action === 'refresh') {
    const { refresh_token } = body;
    if (!refresh_token) return json({ error: 'missing refresh_token' }, 400);
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error) return json({ error: error.message }, 401);
    return json({ session: data.session });
  }

  // Every other action requires a valid access_token from a logged-in session.
  const { access_token } = body;
  if (!access_token) return json({ error: 'missing access_token' }, 401);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${access_token}` } }
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(access_token);
  if (userError || !userData.user) return json({ error: 'invalid or expired session' }, 401);

  if (action === 'list') {
    const { data, error } = await supabase
      .from('dashboard_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return json({ error: error.message }, 400);
    return json({ items: data });
  }

  if (action === 'add') {
    const { item } = body;
    if (!item?.title) return json({ error: 'title is required' }, 400);
    const { error } = await supabase.from('dashboard_items').insert({
      user_id: userData.user.id,
      type: item.type || 'note',
      title: item.title,
      url: item.url || null,
      content: item.content || null,
      status: item.type === 'task' ? 'todo' : null
    });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  if (action === 'delete') {
    const { id } = body;
    if (!id) return json({ error: 'missing id' }, 400);
    const { error } = await supabase.from('dashboard_items').delete().eq('id', id);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  return json({ error: 'unknown action' }, 400);
});
