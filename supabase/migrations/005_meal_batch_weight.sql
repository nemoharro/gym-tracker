-- Add total batch weight to meals for portion-based logging
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS total_weight_g numeric(8,1);
