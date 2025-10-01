-- Fix search path security issues by dropping triggers first, then functions, then recreating
DROP TRIGGER IF EXISTS audit_notes_trigger ON public.notes;
DROP TRIGGER IF EXISTS audit_folders_trigger ON public.folders;
DROP TRIGGER IF EXISTS audit_flashcards_trigger ON public.flashcards;

DROP FUNCTION IF EXISTS public.audit_trigger_row();

-- Recreate audit function with proper search path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate triggers
CREATE TRIGGER audit_notes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_row();

CREATE TRIGGER audit_folders_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_row();

CREATE TRIGGER audit_flashcards_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.flashcards
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_row();

-- Fix the existing update_updated_at_column function search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;