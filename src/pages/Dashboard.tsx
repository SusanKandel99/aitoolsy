import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, LayoutGrid, List, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  folder_id: string | null;
  tags: string[];
}

interface Folder {
  id: string;
  name: string;
  color: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loadingNotes, setLoadingNotes] = useState(true);

  const selectedFolderId = searchParams.get('folder');
  const selectedTag = searchParams.get('tag');

  useEffect(() => {
    if (user) {
      fetchNotes();
      fetchFolders();
      setupRealTimeSubscriptions();
    }
  }, [user]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching notes",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setNotes(data || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const { data } = await supabase
        .from('folders')
        .select('*')
        .order('name');
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const setupRealTimeSubscriptions = () => {
    // Notes real-time subscription
    const notesChannel = supabase
      .channel('notes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotes(prev => [payload.new as Note, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotes(prev => prev.map(note => 
              note.id === payload.new.id ? payload.new as Note : note
            ));
          } else if (payload.eventType === 'DELETE') {
            setNotes(prev => prev.filter(note => note.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Folders real-time subscription
    const foldersChannel = supabase
      .channel('folders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folders'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setFolders(prev => [...prev, payload.new as Folder].sort((a, b) => a.name.localeCompare(b.name)));
          } else if (payload.eventType === 'UPDATE') {
            setFolders(prev => prev.map(folder => 
              folder.id === payload.new.id ? payload.new as Folder : folder
            ).sort((a, b) => a.name.localeCompare(b.name)));
          } else if (payload.eventType === 'DELETE') {
            setFolders(prev => prev.filter(folder => folder.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notesChannel);
      supabase.removeChannel(foldersChannel);
    };
  };

  const handleCreateNote = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            user_id: user.id,
            title: 'Untitled',
            content: '',
          }
        ])
        .select()
        .single();

      if (error) {
        toast({
          title: "Error creating note",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Note created",
          description: "A new note has been created.",
        });
        navigate(`/editor/${data.id}`);
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleToggleStar = async (noteId: string, currentStarred: boolean) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_starred: !currentStarred })
        .eq('id', noteId);

      if (error) {
        toast({
          title: "Error updating note",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const clearFilter = () => {
    setSearchParams({});
  };

  const getFilteredNotes = () => {
    let filtered = notes.filter(note => 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedFolderId) {
      filtered = filtered.filter(note => note.folder_id === selectedFolderId);
    }

    if (selectedTag) {
      filtered = filtered.filter(note => note.tags?.includes(selectedTag));
    }

    return filtered;
  };

  const filteredNotes = getFilteredNotes();
  const selectedFolder = selectedFolderId ? folders.find(f => f.id === selectedFolderId) : null;

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
            <h1 className="text-2xl font-bold">Your Notes</h1>
            <p className="text-muted-foreground">
              {filteredNotes.length} of {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </p>
            {(selectedFolder || selectedTag) && (
              <div className="flex items-center gap-2 mt-2">
                {selectedFolder && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: selectedFolder.color }}
                    />
                    {selectedFolder.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilter}
                      className="h-4 w-4 p-0 ml-1"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {selectedTag && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    #{selectedTag}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilter}
                      className="h-4 w-4 p-0 ml-1"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
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
            
            <Button onClick={() => navigate('/editor')} className="bg-gradient-to-r from-primary to-accent">
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {loadingNotes ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading notes...</p>
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No notes found' : 'No notes yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search query'
                  : 'Create your first note to get started'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate('/editor')} className="bg-gradient-to-r from-primary to-accent">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Note
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-4'
          }>
            {filteredNotes.map((note) => (
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