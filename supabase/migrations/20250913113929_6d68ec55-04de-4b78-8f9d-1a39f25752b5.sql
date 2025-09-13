-- Enable advanced security for all existing tables
ALTER TABLE public.notes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.folders FORCE ROW LEVEL SECURITY;  
ALTER TABLE public.flashcards FORCE ROW LEVEL SECURITY;
ALTER TABLE public.note_history FORCE ROW LEVEL SECURITY;

-- Add audit trigger function for tracking changes
CREATE OR REPLACE FUNCTION public.audit_trigger_row() 
RETURNS TRIGGER AS $$
DECLARE
  audit_row RECORD;
BEGIN
  IF TG_WHEN <> 'AFTER' THEN
    RAISE EXCEPTION 'audit_trigger_row() may only run as an AFTER trigger';
  END IF;
  
  audit_row = COALESCE(NEW, OLD);
  
  -- Log audit information to system logs
  RAISE LOG 'AUDIT: Operation % on table % by user % at %', 
    TG_OP, TG_TABLE_NAME, auth.uid(), now();
    
  RETURN audit_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to all user tables
CREATE TRIGGER audit_notes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_row();

CREATE TRIGGER audit_folders_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_row();

CREATE TRIGGER audit_flashcards_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.flashcards
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_row();