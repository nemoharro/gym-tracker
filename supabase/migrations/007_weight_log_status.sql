-- Add draft/finalized status to body weight logs
ALTER TABLE public.body_weight_logs ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';

-- Mark all existing entries as finalized
UPDATE public.body_weight_logs SET status = 'finalized' WHERE status = 'draft';
