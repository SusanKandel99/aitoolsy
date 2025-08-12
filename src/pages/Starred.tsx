import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Star, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NoteCard } from '@/components/NoteCard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  title: string;
  content: string;
  is_starred: boolean;
  updated_at: string;
  created_at: string;
}

export default function Starred() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loadingNotes, setLoadingNotes] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStarredNotes();
    }
  }, [user]);

  const fetchStarredNotes = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('notes')
        .select('*')
        .eq('is_starred', true)
        .order('updated_at', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching starred notes",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setNotes(data || []);
      }
    } catch (error) {
      console.error('Error fetching starred notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleToggleStar = async (noteId: string, currentStarred: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('notes')
        .update({ is_starred: !currentStarred })
        .eq('id', noteId);

      if (error) {
        toast({
          title: "Error updating note",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Remove from starred view since it's no longer starred
        setNotes(notes.filter(note => note.id !== noteId));
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-2xl font-bold">Starred Notes</h1>
            <p className="text-muted-foreground">
              {notes.length} {notes.length === 1 ? 'starred note' : 'starred notes'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {loadingNotes ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading starred notes...</p>
            </div>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No starred notes</h3>
              <p className="text-muted-foreground mb-4">
                Star your favorite notes to see them here
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                Browse All Notes
              </Button>
            </div>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-4'
          }>
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                id={note.id}
                title={note.title}
                content={note.content}
                isStarred={note.is_starred}
                updatedAt={note.updated_at}
                onClick={() => navigate(`/editor/${note.id}`)}
                onToggleStar={() => handleToggleStar(note.id, note.is_starred)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}