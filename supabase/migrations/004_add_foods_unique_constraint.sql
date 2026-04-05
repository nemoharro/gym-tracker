-- Add unique constraint on (name, user_id) for the foods table.
-- Required for the upsert in food logging to work correctly.
--
-- If duplicate (name, user_id) rows already exist, this will fail.
-- To find duplicates:
--   SELECT name, user_id, count(*) FROM public.foods GROUP BY name, user_id HAVING count(*) > 1;
-- To remove duplicates (keeps lowest id):
--   DELETE FROM public.foods a USING public.foods b
--   WHERE a.id > b.id AND a.name = b.name AND a.user_id = b.user_id;

ALTER TABLE public.foods
  ADD CONSTRAINT foods_name_user_id_key UNIQUE (name, user_id);
