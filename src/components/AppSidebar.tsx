import { useState, useEffect } from 'react';
import { Brain, Star, Hash, FolderOpen, Search, Settings, LogOut, Plus, Sparkles, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const navigationItems = [
  { title: 'All Notes', url: '/', icon: FolderOpen },
  { title: 'Starred', url: '/starred', icon: Star },
  { title: 'Search', url: '/search', icon: Search },
];

const aiTools = [
  { title: 'AI Assistant', url: '/ai-assistant', icon: Brain },
  { title: 'Flashcards', url: '/flashcards', icon: Sparkles },
];

interface Tag {
  id: string;
  name: string;
  color: string;
  count?: number;
}

interface Note {
  id: string;
  title: string;
  folder_id: string | null;
  tag_ids?: string[];
}

interface Folder {
  id: string;
  name: string;
  color: string;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { signOut, user } = useAuth();
  const currentPath = location.pathname;
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchFoldersAndNotes();
      setupRealTimeSubscriptions();
    }
  }, [user]);

  const fetchFoldersAndNotes = async () => {
    try {
      // Fetch folders
      const { data: foldersData } = await supabase
        .from('folders')
        .select('*')
        .order('name');

      // Fetch notes with their tag IDs
      const { data: notesData } = await supabase
        .from('notes')
        .select('id, title, folder_id')
        .order('updated_at', { ascending: false });
      
      // Fetch note_tags to map notes to tags
      const { data: noteTagsData } = await supabase
        .from('note_tags')
        .select('note_id, tag_id');

      // Map notes with their tag IDs
      const notesWithTagIds = (notesData || []).map(note => ({
        ...note,
        tag_ids: (noteTagsData || [])
          .filter(nt => nt.note_id === note.id)
          .map(nt => nt.tag_id)
      }));

      // Fetch all tags
      const { data: tagsData } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      // Add note count to each tag
      const tagsWithCounts = (tagsData || []).map(tag => {
        const count = (noteTagsData || []).filter(nt => nt.tag_id === tag.id).length;
        return { ...tag, count };
      });

      setFolders(foldersData || []);
      setNotes(notesWithTagIds);
      setAllTags(tagsWithCounts);
    } catch (error) {
      console.error('Error fetching folders and notes:', error);
    }
  };

  const setupRealTimeSubscriptions = () => {
    console.log('Setting up sidebar real-time subscriptions...');
    
    // Notes subscription
    const notesChannel = supabase
      .channel('sidebar-notes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes'
        },
        (payload) => {
          console.log('Sidebar received note update:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            const newNote = payload.new as Note;
            setNotes(prev => {
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

    // Folders subscription
    const foldersChannel = supabase
      .channel('sidebar-folders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folders'
        },
        (payload) => {
          console.log('Sidebar received folder update:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            const newFolder = payload.new as Folder;
            setFolders(prev => {
              const exists = prev.some(folder => folder.id === newFolder.id);
              if (exists) return prev;
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

    // Tags subscription
    const tagsChannel = supabase
      .channel('sidebar-tags-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tags'
        },
        () => {
          fetchFoldersAndNotes();
        }
      )
      .subscribe();

    // Note-tags junction table subscription
    const noteTagsChannel = supabase
      .channel('sidebar-note-tags-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'note_tags'
        },
        () => {
          fetchFoldersAndNotes();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up sidebar subscriptions...');
      supabase.removeChannel(notesChannel);
      supabase.removeChannel(foldersChannel);
      supabase.removeChannel(tagsChannel);
      supabase.removeChannel(noteTagsChannel);
    };
  };

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50';

  const getNotesInFolder = (folderId: string | null) => 
    notes.filter(note => note.folder_id === folderId);

  const getUnfiledNotes = () => 
    notes.filter(note => !note.folder_id);

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const toggleTagExpansion = (tagId: string) => {
    setExpandedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  };

  const getNotesWithTag = (tagId: string) => 
    notes.filter(note => note.tag_ids?.includes(tagId));

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'}>
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              aitoolsy
            </span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Notes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/editor" className="border-dashed border">
                    <Plus className="w-4 h-4" />
                    {!collapsed && <span>New Note</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {!collapsed && 'AI Tools'}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiTools.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Dynamic Folders */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <button
                onClick={() => setFoldersExpanded(!foldersExpanded)}
                className="flex items-center gap-1 w-full text-left hover:text-sidebar-accent-foreground/80 transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Folders</span>
                {foldersExpanded ? (
                  <ChevronDown className="w-4 h-4 ml-auto" />
                ) : (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>
            </SidebarGroupLabel>
            {foldersExpanded && (
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Regular Folders */}
                  {folders.map((folder) => {
                    const folderNotes = getNotesInFolder(folder.id);
                    const isExpanded = expandedFolders.has(folder.id);
                    return (
                      <div key={folder.id}>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <button
                              onClick={() => toggleFolderExpansion(folder.id)}
                              className="flex items-center justify-between w-full pl-6 hover:bg-sidebar-accent/50"
                            >
                              <div className="flex items-center gap-2">
                                <FolderOpen className="w-4 h-4" />
                                <span className="text-sm">{folder.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">{folderNotes.length}</span>
                                {folderNotes.length > 0 && (
                                  isExpanded ? (
                                    <ChevronDown className="w-3 h-3 opacity-60" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 opacity-60" />
                                  )
                                )}
                              </div>
                            </button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        {/* Notes in folder */}
                        {isExpanded && folderNotes.map((note) => (
                          <SidebarMenuItem key={note.id}>
                            <SidebarMenuButton asChild>
                              <NavLink 
                                to={`/editor/${note.id}`}
                                className="flex items-center gap-2 w-full pl-12 text-xs hover:bg-sidebar-accent/30"
                              >
                                <span className="truncate">{note.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </div>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        )}

        {/* Dynamic Tags */}
        {!collapsed && allTags.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <button
                onClick={() => setTagsExpanded(!tagsExpanded)}
                className="flex items-center gap-1 w-full text-left hover:text-sidebar-accent-foreground/80 transition-colors"
              >
                <Hash className="w-4 h-4" />
                <span>Tags</span>
                {tagsExpanded ? (
                  <ChevronDown className="w-4 h-4 ml-auto" />
                ) : (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>
            </SidebarGroupLabel>
            {tagsExpanded && (
              <SidebarGroupContent>
                <SidebarMenu>
                  {allTags.map((tag) => {
                    const tagNotes = getNotesWithTag(tag.id);
                    const isExpanded = expandedTags.has(tag.id);
                    return (
                      <div key={tag.id}>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <button
                              onClick={() => toggleTagExpansion(tag.id)}
                              className="flex items-center justify-between w-full pl-6 hover:bg-sidebar-accent/50"
                            >
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: tag.color }}
                                />
                                <span className="text-sm">{tag.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">{tagNotes.length}</span>
                                {tagNotes.length > 0 && (
                                  isExpanded ? (
                                    <ChevronDown className="w-3 h-3 opacity-60" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 opacity-60" />
                                  )
                                )}
                              </div>
                            </button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        {/* Notes with this tag */}
                        {isExpanded && tagNotes.map((note) => (
                          <SidebarMenuItem key={note.id}>
                            <SidebarMenuButton asChild>
                              <NavLink 
                                to={`/editor/${note.id}`}
                                className="flex items-center gap-2 w-full pl-12 text-xs hover:bg-sidebar-accent/30"
                              >
                                <span className="truncate">{note.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </div>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/settings" className={getNavCls}>
                <Settings className="w-4 h-4" />
                {!collapsed && <span>Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="text-destructive hover:bg-destructive/10">
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}