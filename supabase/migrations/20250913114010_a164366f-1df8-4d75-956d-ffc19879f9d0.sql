-- Fix search path security issues for existing functions
DROP FUNCTION IF EXISTS public.audit_trigger_row();
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

-- Recreate the update_updated_at_column function with proper search path
DROP FUNCTION IF EXISTS public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;