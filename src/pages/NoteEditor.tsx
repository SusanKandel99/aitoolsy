import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/RichTextEditor';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save, Star, StarOff, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Note {
  id: string;
  title: string;
  content: string;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
}

export default function NoteEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (noteId && user) {
      fetchNote();
    } else if (!noteId) {
      // New note
      setIsLoading(false);
      setTitle('Untitled');
      setContent('');
    }
  }, [noteId, user]);

  useEffect(() => {
    if (note) {
      const titleChanged = title !== note.title;
      const contentChanged = content !== note.content;
      setHasUnsavedChanges(titleChanged || contentChanged);
      
      // Auto-save after changes
      if (titleChanged || contentChanged) {
        if (autoSaveTimeout) {
          clearTimeout(autoSaveTimeout);
        }
        
        const timeout = setTimeout(() => {
          autoSave();
        }, 2000); // Auto-save after 2 seconds of inactivity
        
        setAutoSaveTimeout(timeout);
      }
    } else if (!noteId) {
      // New note with content
      setHasUnsavedChanges(title.trim() !== '' || content.trim() !== '');
    }
  }, [title, content, note]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  const fetchNote = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error) {
        toast({
          title: "Error loading note",
          description: error.message,
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setNote(data);
      setTitle(data.title);
      setContent(data.content || '');
    } catch (error) {
      console.error('Error fetching note:', error);
      toast({
        title: "Error loading note",
        description: "Failed to load the note. Please try again.",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const autoSave = async () => {
    if (!user || isSaving || !hasUnsavedChanges) return;
    
    try {
      if (noteId && note) {
        // Auto-save existing note
        await (supabase as any)
          .from('notes')
          .update({ 
            title: title.trim() || 'Untitled', 
            content,
            updated_at: new Date().toISOString()
          })
          .eq('id', noteId);

        // Update local state
        setNote({
          ...note,
          title: title.trim() || 'Untitled',
          content,
          updated_at: new Date().toISOString()
        });
        
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const saveNote = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      if (noteId) {
        // Update existing note
        const { error } = await (supabase as any)
          .from('notes')
          .update({ 
            title: title.trim() || 'Untitled', 
            content,
            updated_at: new Date().toISOString()
          })
          .eq('id', noteId);

        if (error) throw error;

        // Update local state
        if (note) {
          setNote({
            ...note,
            title: title.trim() || 'Untitled',
            content,
            updated_at: new Date().toISOString()
          });
        }
      } else {
        // Create new note
        const { data, error } = await (supabase as any)
          .from('notes')
          .insert([{
            user_id: user.id,
            title: title.trim() || 'Untitled',
            content,
          }])
          .select()
          .single();

        if (error) throw error;

        // Navigate to the new note
        navigate(`/editor/${data.id}`, { replace: true });
        setNote(data);
      }

      setHasUnsavedChanges(false);
      toast({
        title: "Note saved",
        description: "Your note has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Save failed",
        description: "Failed to save the note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStar = async () => {
    if (!note) return;

    try {
      const newStarredState = !note.is_starred;
      const { error } = await (supabase as any)
        .from('notes')
        .update({ is_starred: newStarredState })
        .eq('id', note.id);

      if (error) throw error;

      setNote({ ...note, is_starred: newStarredState });
      toast({
        title: newStarredState ? "Note starred" : "Note unstarred",
        description: newStarredState ? "Added to starred notes" : "Removed from starred notes",
      });
    } catch (error) {
      console.error('Error toggling star:', error);
      toast({
        title: "Error",
        description: "Failed to update star status",
        variant: "destructive",
      });
    }
  };

  const deleteNote = async () => {
    if (!note) return;

    try {
      const { error } = await (supabase as any)
        .from('notes')
        .delete()
        .eq('id', note.id);

      if (error) throw error;

      toast({
        title: "Note deleted",
        description: "The note has been permanently deleted.",
      });
      navigate('/');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the note. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading note...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="text-xs">
                Unsaved changes
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {note && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleStar}
                >
                  {note.is_starred ? (
                    <Star className="w-4 h-4 fill-current text-yellow-500" />
                  ) : (
                    <StarOff className="w-4 h-4" />
                  )}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Note</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this note? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteNote} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            <Button 
              onClick={saveNote}
              disabled={isSaving || !hasUnsavedChanges}
              className="bg-gradient-to-r from-primary to-accent"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="space-y-6">
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          {/* Rich Text Editor */}
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your note..."
          />

          {/* Metadata */}
          {note && (
            <div className="text-sm text-muted-foreground border-t pt-4">
              <p>Created: {new Date(note.created_at).toLocaleDateString()}</p>
              <p>Last modified: {new Date(note.updated_at).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}