-- Create note history table to track versions
CREATE TABLE public.note_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  folder_id UUID,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.note_history ENABLE ROW LEVEL SECURITY;

-- Create policies for note history
CREATE POLICY "Users can view their own note history" 
ON public.note_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own note history" 
ON public.note_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_note_history_note_id ON public.note_history(note_id, version_number DESC);
CREATE INDEX idx_note_history_user_id ON public.note_history(user_id);

-- Create function to automatically create history when notes are updated
CREATE OR REPLACE FUNCTION public.create_note_history()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically save history
CREATE TRIGGER notes_history_trigger
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_note_history();