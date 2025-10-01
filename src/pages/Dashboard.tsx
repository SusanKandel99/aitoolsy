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
import { isDemoMode, getDemoNotes, getDemoFolders, saveDemoNotes, getDemoUser, autoResetDemoMode } from '@/utils/demoData';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  is_starred: boolean;
  updated_at: string;
  created_at: string;
  folder_id: string | null;
  tags?: Tag[];
  user_id?: string;
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

  // Check if we're in demo mode
  const isDemo = isDemoMode();
  const demoUser = getDemoUser();

  useEffect(() => {
    // Auto-reset demo mode on page load
    autoResetDemoMode();
    
    if (user) {
      // User is authenticated - load their real data
      fetchNotes();
      fetchFolders();
      const cleanup = setupRealTimeSubscriptions();
      return cleanup;
    } else if (isDemo) {
      // User not authenticated but in demo mode - load demo data
      const demoNotes = getDemoNotes().map(note => ({
        ...note,
        tags: [] as Tag[]
      }));
      setNotes(demoNotes);
      setFolders(getDemoFolders());
      setLoadingNotes(false);
    }
  }, [user, isDemo]);

  const fetchNotes = async () => {
    try {
      const { data: notesData, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching notes",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Fetch tags for each note
      const notesWithTags = await Promise.all(
        (notesData || []).map(async (note) => {
          const { data: noteTagsData } = await supabase
            .from('note_tags')
            .select(`
              tag_id,
              tags (
                id,
                name,
                color
              )
            `)
            .eq('note_id', note.id);

          const tags = (noteTagsData || [])
            .map((nt: any) => nt.tags)
            .filter(Boolean) as Tag[];

          return { ...note, tags };
        })
      );

      setNotes(notesWithTags);
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
    // Use shared channel names to avoid conflicts with sidebar
    const notesChannel = supabase
      .channel('dashboard-notes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes'
        },
        (payload) => {
          console.log('Dashboard received note update:', payload.eventType, payload);
          
          // Immediate state updates using functional updates for better performance
          if (payload.eventType === 'INSERT') {
            const newNote = payload.new as Note;
            setNotes(prev => {
              // Check if note already exists to prevent duplicates
              const exists = prev.some(note => note.id === newNote.id);
              return exists ? prev : [newNote, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedNote = payload.new as Note;
            setNotes(prev => prev.map(note => 
              note.id === updatedNote.id ? updatedNote : note
            ));
          } else if (payload.eventType === 'DELETE') {
            setNotes(prev => prev.filter(note => note.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Folders real-time subscription with optimized updates
    const foldersChannel = supabase
      .channel('dashboard-folders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folders'
        },
        (payload) => {
          console.log('Dashboard received folder update:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            const newFolder = payload.new as Folder;
            setFolders(prev => {
              // Check if folder already exists to prevent duplicates
              const exists = prev.some(folder => folder.id === newFolder.id);
              if (exists) {
                console.log('Dashboard: Folder already exists, skipping duplicate');
                return prev;
              }
              console.log('Dashboard: Adding new folder:', newFolder.name);
              return [...prev, newFolder].sort((a, b) => a.name.localeCompare(b.name));
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedFolder = payload.new as Folder;
            setFolders(prev => prev.map(folder => 
              folder.id === updatedFolder.id ? updatedFolder : folder
            ).sort((a, b) => a.name.localeCompare(b.name)));
          } else if (payload.eventType === 'DELETE') {
            setFolders(prev => prev.filter(folder => folder.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up dashboard subscriptions...');
      supabase.removeChannel(notesChannel);
      supabase.removeChannel(foldersChannel);
    };
  };

  const handleCreateNote = async () => {
    if (user) {
      // User is authenticated - create real note
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
      return;
    }

    if (isDemo) {
      // Create demo note
      const newNote: Note = {
        id: `note-${Date.now()}`,
        user_id: demoUser?.id || 'demo-user',
        title: 'Untitled',
        content: '',
        is_starred: false,
        folder_id: null,
        tags: [] as Tag[],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      saveDemoNotes(updatedNotes as any);
      
      toast({
        title: "Note created",
        description: "A new note has been created.",
      });
      navigate(`/editor/${newNote.id}`);
      return;
    }
  };

  const handleToggleStar = async (noteId: string, currentStarred: boolean) => {
    if (user) {
      // User is authenticated - update real note
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
      return;
    }

    if (isDemo) {
      // Update demo note
      const updatedNotes = notes.map(note =>
        note.id === noteId ? { ...note, is_starred: !currentStarred } : note
      );
      setNotes(updatedNotes);
      saveDemoNotes(updatedNotes as any);
      return;
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
      if (selectedFolderId === 'unfiled') {
        filtered = filtered.filter(note => !note.folder_id);
      } else {
        filtered = filtered.filter(note => note.folder_id === selectedFolderId);
      }
    }

    if (selectedTag) {
      filtered = filtered.filter(note => 
        note.tags?.some(tag => tag.id === selectedTag)
      );
    }

    return filtered;
  };

  const filteredNotes = getFilteredNotes();
  const selectedFolder = selectedFolderId && selectedFolderId !== 'unfiled' 
    ? folders.find(f => f.id === selectedFolderId) 
    : null;

  if (loading && !user && !isDemo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !isDemo) {
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
            {(selectedFolder || selectedTag || selectedFolderId === 'unfiled') && (
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
                {selectedFolderId === 'unfiled' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Unfiled
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