-- Create a table to store session data
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  total_detections integer not null,
  dominant_mood text,
  emotion_percentages jsonb not null,
  timeline_data jsonb,
  -- Ensure only the service role can insert/read all data by default, or set policies
  -- For now, we rely on RLS policies if we were using client-side, 
  -- but we use SERVICE_ROLE on backend, so we bypass RLS.
  -- However, it is good practice to enable RLS.
  user_id uuid references auth.users(id) -- Optional if we had auth
);

-- Enable RLS
alter table public.sessions enable row level security;

-- Policy: Allow anonymous inserts (if we wanted client-side, but we are doing server-side)
-- adjust as needed. For now, since we use Service Role in API, we don't strictly need 
-- a policy for the API to work, but we should adding one for safety if we ever expose it.
-- create policy "Allow public inserts" on public.sessions for insert with check (true);
