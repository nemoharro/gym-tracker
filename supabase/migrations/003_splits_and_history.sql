-- Workout splits system
CREATE TABLE public.workout_splits (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  is_preset BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.split_days (
  id SERIAL PRIMARY KEY,
  split_id INTEGER NOT NULL REFERENCES public.workout_splits(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  day_order SMALLINT NOT NULL
);

CREATE TABLE public.split_day_exercises (
  id SERIAL PRIMARY KEY,
  split_day_id INTEGER NOT NULL REFERENCES public.split_days(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES public.exercises(id),
  order_index SMALLINT NOT NULL,
  target_sets SMALLINT,
  target_reps SMALLINT
);

CREATE TABLE public.split_schedule (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  day_of_week SMALLINT NOT NULL,
  split_day_id INTEGER REFERENCES public.split_days(id) ON DELETE SET NULL,
  is_rest_day BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, day_of_week)
);

-- Link sessions to split days
ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS split_day_id INTEGER REFERENCES public.split_days(id);
ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- RLS
ALTER TABLE public.workout_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_day_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own splits" ON public.workout_splits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own split days" ON public.split_days FOR ALL USING (split_id IN (SELECT id FROM public.workout_splits WHERE user_id = auth.uid()));
CREATE POLICY "Users manage own split day exercises" ON public.split_day_exercises FOR ALL USING (split_day_id IN (SELECT sd.id FROM public.split_days sd JOIN public.workout_splits ws ON sd.split_id = ws.id WHERE ws.user_id = auth.uid()));
CREATE POLICY "Users manage own schedule" ON public.split_schedule FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_split_days_split ON public.split_days(split_id);
CREATE INDEX idx_split_day_exercises_day ON public.split_day_exercises(split_day_id);
CREATE INDEX idx_split_schedule_user ON public.split_schedule(user_id);
