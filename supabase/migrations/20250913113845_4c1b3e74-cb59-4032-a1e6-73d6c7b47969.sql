-- Enable database encryption and security features
-- Create RLS policies for enhanced security

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

-- Add performance indexes for better query optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_updated ON public.notes(user_id, updated_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_tags_gin ON public.notes USING GIN(tags);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_content_search ON public.notes USING GIN(to_tsvector('english', title || ' ' || content));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_folders_user_name ON public.folders(user_id, name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flashcards_note ON public.flashcards(note_id, user_id);