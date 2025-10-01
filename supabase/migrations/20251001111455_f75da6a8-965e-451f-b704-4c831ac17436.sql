-- Create tags table (similar to folders)
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#8b5cf6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create junction table for note-tag relationships
CREATE TABLE public.note_tags (
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (note_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for tags
CREATE POLICY "Users can view their own tags"
  ON public.tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
  ON public.tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON public.tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON public.tags FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for note_tags
CREATE POLICY "Users can view their own note tags"
  ON public.note_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_tags.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own note tags"
  ON public.note_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_tags.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own note tags"
  ON public.note_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_tags.note_id 
    AND notes.user_id = auth.uid()
  ));

-- Add updated_at trigger for tags
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing tags data from notes.tags array to new structure
DO $$
DECLARE
  note_record RECORD;
  tag_text TEXT;
  tag_record RECORD;
BEGIN
  FOR note_record IN SELECT id, user_id, tags FROM public.notes WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
  LOOP
    FOREACH tag_text IN ARRAY note_record.tags
    LOOP
      -- Insert tag if it doesn't exist
      INSERT INTO public.tags (user_id, name)
      VALUES (note_record.user_id, tag_text)
      ON CONFLICT (user_id, name) DO NOTHING;
      
      -- Get the tag id
      SELECT id INTO tag_record FROM public.tags 
      WHERE user_id = note_record.user_id AND name = tag_text;
      
      -- Create note-tag relationship
      INSERT INTO public.note_tags (note_id, tag_id)
      VALUES (note_record.id, tag_record.id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Add indexes for performance
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_note_tags_note_id ON public.note_tags(note_id);
CREATE INDEX idx_note_tags_tag_id ON public.note_tags(tag_id);

-- Add audit triggers
CREATE TRIGGER audit_tags_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_row();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tags;
ALTER PUBLICATION supabase_realtime ADD TABLE public.note_tags;