-- Fix the search path for the create_note_history function
CREATE OR REPLACE FUNCTION public.create_note_history()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create history for updates, not inserts
  IF TG_OP = 'UPDATE' THEN
    -- Get the next version number
    INSERT INTO public.note_history (
      note_id,
      user_id,
      title,
      content,
      tags,
      folder_id,
      version_number
    )
    SELECT 
      OLD.id,
      OLD.user_id,
      OLD.title,
      OLD.content,
      OLD.tags,
      OLD.folder_id,
      COALESCE((
        SELECT MAX(version_number) + 1 
        FROM public.note_history 
        WHERE note_id = OLD.id
      ), 1);
  END IF;
  
  RETURN NEW;
END;
$$;