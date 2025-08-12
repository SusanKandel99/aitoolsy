import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
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

export default function Search() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    if (user && searchQuery.trim()) {
      performSearch();
    } else {
      setNotes([]);
    }
  }, [user, searchQuery]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoadingNotes(true);
    try {
      const { data, error } = await (supabase as any)
        .from('notes')
        .select('*')
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .order('updated_at', { ascending: false });

      if (error) {
        toast({
          title: "Error searching notes",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setNotes(data || []);
      }
    } catch (error) {
      console.error('Error searching notes:', error);
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
        setNotes(notes.map(note => 
          note.id === noteId 
            ? { ...note, is_starred: !currentStarred }
            : note
        ));
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
            <h1 className="text-2xl font-bold">Search Notes</h1>
            <p className="text-muted-foreground">
              Find your notes quickly
            </p>
          </div>
        </div>
        
        <div className="px-6 pb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search through your notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {loadingNotes ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Searching...</p>
            </div>
          </div>
        ) : !searchQuery.trim() ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Start searching</h3>
              <p className="text-muted-foreground">
                Enter a search term to find your notes
              </p>
            </div>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Found {notes.length} {notes.length === 1 ? 'note' : 'notes'} for "{searchQuery}"
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          </div>
        )}
      </div>
    </div>
  );
}