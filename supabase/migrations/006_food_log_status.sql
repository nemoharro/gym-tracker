-- Add draft/finalized status to food log entries
-- Existing entries are set to 'finalized' so they continue to count
ALTER TABLE public.food_log ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';

-- Mark all existing entries as finalized (they were logged before this feature)
UPDATE public.food_log SET status = 'finalized' WHERE status = 'draft';
