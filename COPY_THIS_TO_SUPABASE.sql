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
  notes text,
  split_day_id integer,
  edited_at timestamptz
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
  fiber_per_100g numeric(5,1),
  sugar_per_100g numeric(5,1),
  saturated_fat_per_100g numeric(5,1),
  sodium_per_100g numeric(5,1),
  is_verified boolean default false,
  created_at timestamptz default now(),
  unique(name, user_id)
);

-- Saved meal templates
create table public.meals (
  id serial primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  total_weight_g numeric(8,1),
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
  fat numeric(6,1) not null,
  fiber numeric(6,1),
  sugar numeric(6,1),
  saturated_fat numeric(6,1),
  sodium numeric(6,1),
  status text not null default 'draft'
);

-- Nutrition targets
create table public.nutrition_targets (
  id serial primary key,
  user_id uuid references auth.users(id) not null unique,
  calories numeric(7,1),
  protein_g numeric(5,1),
  carbs_g numeric(5,1),
  fat_g numeric(5,1),
  fiber_g numeric(5,1),
  sugar_g numeric(5,1)
);

-- Push subscriptions
create table public.push_subscriptions (
  id serial primary key,
  user_id uuid references auth.users(id) not null,
  subscription jsonb not null,
  created_at timestamptz default now()
);

-- Workout splits
create table public.workout_splits (
  id serial primary key,
  user_id uuid not null references auth.users(id),
  name text not null,
  description text,
  is_preset boolean default false,
  created_at timestamptz default now()
);

create table public.split_days (
  id serial primary key,
  split_id integer not null references public.workout_splits(id) on delete cascade,
  name text not null,
  day_order smallint not null
);

create table public.split_day_exercises (
  id serial primary key,
  split_day_id integer not null references public.split_days(id) on delete cascade,
  exercise_id integer not null references public.exercises(id),
  order_index smallint not null,
  target_sets smallint,
  target_reps smallint
);

create table public.split_schedule (
  id serial primary key,
  user_id uuid not null references auth.users(id),
  day_of_week smallint not null,
  split_day_id integer references public.split_days(id) on delete set null,
  is_rest_day boolean default false,
  unique(user_id, day_of_week)
);

-- Add FK for split_day_id on workout_sessions now that split_days exists
alter table public.workout_sessions
  add constraint fk_workout_sessions_split_day
  foreign key (split_day_id) references public.split_days(id);

-- Indexes
create index idx_workout_sets_session on public.workout_sets(session_id);
create index idx_workout_sets_exercise on public.workout_sets(exercise_id);
create index idx_workout_sessions_user_date on public.workout_sessions(user_id, started_at desc);
create index idx_body_weight_user_date on public.body_weight_logs(user_id, logged_at desc);
create index idx_food_log_user_date on public.food_log(user_id, logged_at desc);
create index idx_foods_user on public.foods(user_id);
create index idx_split_days_split on public.split_days(split_id);
create index idx_split_day_exercises_day on public.split_day_exercises(split_day_id);
create index idx_split_schedule_user on public.split_schedule(user_id);

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
alter table public.workout_splits enable row level security;
alter table public.split_days enable row level security;
alter table public.split_day_exercises enable row level security;
alter table public.split_schedule enable row level security;

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
create policy "Users manage own splits" on public.workout_splits for all using (auth.uid() = user_id);
create policy "Users manage own split days" on public.split_days for all using (split_id in (select id from public.workout_splits where user_id = auth.uid()));
create policy "Users manage own split day exercises" on public.split_day_exercises for all using (split_day_id in (select sd.id from public.split_days sd join public.workout_splits ws on sd.split_id = ws.id where ws.user_id = auth.uid()));
create policy "Users manage own schedule" on public.split_schedule for all using (auth.uid() = user_id);

-- SEED DATA: System exercises
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Flat Bench Press', 'Chest', 'barbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Incline Bench Press', 'Chest', 'barbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Decline Bench Press', 'Chest', 'barbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Dumbbell Flyes', 'Chest', 'dumbbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Cable Crossover', 'Chest', 'cable', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Push-ups', 'Chest', 'bodyweight', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Chest Press Machine', 'Chest', 'machine', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Incline Dumbbell Press', 'Chest', 'dumbbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Barbell Row', 'Back', 'barbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Dumbbell Row', 'Back', 'dumbbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Lat Pulldown', 'Back', 'cable', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Seated Cable Row', 'Back', 'cable', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Pull-ups', 'Back', 'bodyweight', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Chin-ups', 'Back', 'bodyweight', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('T-Bar Row', 'Back', 'barbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Face Pulls', 'Back', 'cable', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Barbell Squat', 'Legs', 'barbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Front Squat', 'Legs', 'barbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Leg Press', 'Legs', 'machine', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Romanian Deadlift', 'Legs', 'barbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Leg Curl', 'Legs', 'machine', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Leg Extension', 'Legs', 'machine', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Calf Raises', 'Legs', 'machine', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Bulgarian Split Squat', 'Legs', 'dumbbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Hip Thrust', 'Legs', 'barbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Goblet Squat', 'Legs', 'dumbbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Overhead Press', 'Shoulders', 'barbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Dumbbell Lateral Raise', 'Shoulders', 'dumbbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Front Raise', 'Shoulders', 'dumbbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Reverse Flyes', 'Shoulders', 'dumbbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Arnold Press', 'Shoulders', 'dumbbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Upright Row', 'Shoulders', 'barbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Cable Lateral Raise', 'Shoulders', 'cable', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Barbell Curl', 'Arms', 'barbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Dumbbell Curl', 'Arms', 'dumbbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Hammer Curl', 'Arms', 'dumbbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Preacher Curl', 'Arms', 'barbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Concentration Curl', 'Arms', 'dumbbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Tricep Pushdown', 'Arms', 'cable', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Skull Crushers', 'Arms', 'barbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Overhead Tricep Extension', 'Arms', 'dumbbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Dips', 'Arms', 'bodyweight', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Cable Curl', 'Arms', 'cable', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Plank', 'Core', 'bodyweight', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Cable Crunch', 'Core', 'cable', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Hanging Leg Raise', 'Core', 'bodyweight', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Ab Rollout', 'Core', NULL, false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Russian Twist', 'Core', NULL, false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Deadlift', 'Compound', 'barbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Clean and Press', 'Compound', 'barbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Farmer''s Walk', 'Compound', 'dumbbell', false, NULL);
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom, created_by) VALUES ('Trap Bar Deadlift', 'Compound', 'barbell', false, NULL);
