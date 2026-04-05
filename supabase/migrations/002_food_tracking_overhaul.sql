-- Add nutrient columns to foods table
ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS fiber_per_100g numeric(5,1),
  ADD COLUMN IF NOT EXISTS sugar_per_100g numeric(5,1),
  ADD COLUMN IF NOT EXISTS saturated_fat_per_100g numeric(5,1),
  ADD COLUMN IF NOT EXISTS sodium_per_100g numeric(5,1);

-- Add nutrient columns to food_log table
ALTER TABLE public.food_log
  ADD COLUMN IF NOT EXISTS fiber numeric(6,1),
  ADD COLUMN IF NOT EXISTS sugar numeric(6,1),
  ADD COLUMN IF NOT EXISTS saturated_fat numeric(6,1),
  ADD COLUMN IF NOT EXISTS sodium numeric(6,1);

-- Add target columns to nutrition_targets table
ALTER TABLE public.nutrition_targets
  ADD COLUMN IF NOT EXISTS fiber_g numeric(5,1),
  ADD COLUMN IF NOT EXISTS sugar_g numeric(5,1);
