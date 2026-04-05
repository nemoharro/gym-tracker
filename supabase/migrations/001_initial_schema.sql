-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null,
  created_at timestamptz default now()
);

-- Exercises library
create table public.exercises (
  id serial primary key,
  name text not null,
  muscle_group text not null,
  equipment text,
  is_custom boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(name, created_by)
);

-- Workout sessions
create table public.workout_sessions (
  id serial primary key,
  user_id uuid references auth.users(id) not null,
  started_at timestamptz default now(),
  finished_at timestamptz,
  notes text
);

-- Workout sets
create table public.workout_sets (
  id serial primary key,
  session_id integer references public.workout_sessions(id) on delete cascade not null,
  exercise_id integer references public.exercises(id) not null,
  set_number smallint not null,
  weight_kg numeric(5,1) not null,
  reps smallint not null,
  rpe smallint,
  logged_at timestamptz default now()
);

-- Body weight logs
create table public.body_weight_logs (
  id serial primary key,
  user_id uuid references auth.users(id) not null,
  weight_kg numeric(5,1) not null,
  logged_at date default current_date,
  unique(user_id, logged_at)
);

-- Foods (nutritional database, AI-estimated)
create table public.foods (
  id serial primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  calories_per_100g numeric(6,1) not null,
  protein_per_100g numeric(5,1) not null,
  carbs_per_100g numeric(5,1) not null,
  fat_per_100g numeric(5,1) not null,
  is_verified boolean default false,
  created_at timestamptz default now()
);

-- Saved meal templates
create table public.meals (
  id serial primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  created_at timestamptz default now()
);

-- Meal ingredients
create table public.meal_ingredients (
  id serial primary key,
  meal_id integer references public.meals(id) on delete cascade not null,
  food_id integer references public.foods(id) not null,
  quantity_g numeric(7,1) not null
);

-- Daily food log
create table public.food_log (
  id serial primary key,
  user_id uuid references auth.users(id) not null,
  logged_at date default current_date,
  meal_type text not null,
  food_id integer references public.foods(id),
  meal_id integer references public.meals(id),
  quantity_g numeric(7,1),
  servings numeric(3,1) default 1,
  calories numeric(7,1) not null,
  protein numeric(6,1) not null,
  carbs numeric(6,1) not null,
  fat numeric(6,1) not null
);

-- Nutrition targets
create table public.nutrition_targets (
  id serial primary key,
  user_id uuid references auth.users(id) not null unique,
  calories numeric(7,1),
  protein_g numeric(5,1),
  carbs_g numeric(5,1),
  fat_g numeric(5,1)
);

-- Push subscriptions
create table public.push_subscriptions (
  id serial primary key,
  user_id uuid references auth.users(id) not null,
  subscription jsonb not null,
  created_at timestamptz default now()
);

-- Indexes
create index idx_workout_sets_session on public.workout_sets(session_id);
create index idx_workout_sets_exercise on public.workout_sets(exercise_id);
create index idx_workout_sessions_user_date on public.workout_sessions(user_id, started_at desc);
create index idx_body_weight_user_date on public.body_weight_logs(user_id, logged_at desc);
create index idx_food_log_user_date on public.food_log(user_id, logged_at desc);
create index idx_foods_user on public.foods(user_id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
alter table public.body_weight_logs enable row level security;
alter table public.foods enable row level security;
alter table public.meals enable row level security;
alter table public.meal_ingredients enable row level security;
alter table public.food_log enable row level security;
alter table public.nutrition_targets enable row level security;
alter table public.push_subscriptions enable row level security;

-- RLS Policies
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Anyone reads system exercises" on public.exercises for select using (created_by is null or auth.uid() = created_by);
create policy "Users manage own exercises" on public.exercises for insert with check (auth.uid() = created_by);
create policy "Users update own exercises" on public.exercises for update using (auth.uid() = created_by);
create policy "Users delete own exercises" on public.exercises for delete using (auth.uid() = created_by);

create policy "Users manage own sessions" on public.workout_sessions for all using (auth.uid() = user_id);
create policy "Users manage own sets" on public.workout_sets for all using (session_id in (select id from public.workout_sessions where user_id = auth.uid()));
create policy "Users manage own weight" on public.body_weight_logs for all using (auth.uid() = user_id);
create policy "Users manage own foods" on public.foods for all using (auth.uid() = user_id);
create policy "Users manage own meals" on public.meals for all using (auth.uid() = user_id);
create policy "Users manage own meal ingredients" on public.meal_ingredients for all using (meal_id in (select id from public.meals where user_id = auth.uid()));
create policy "Users manage own food log" on public.food_log for all using (auth.uid() = user_id);
create policy "Users manage own nutrition targets" on public.nutrition_targets for all using (auth.uid() = user_id);
create policy "Users manage own push subs" on public.push_subscriptions for all using (auth.uid() = user_id);
