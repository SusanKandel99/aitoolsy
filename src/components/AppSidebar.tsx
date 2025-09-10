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

interface Note {
  id: string;
  title: string;
  folder_id: string | null;
  tags: string[];
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
  const [allTags, setAllTags] = useState<string[]>([]);
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

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

      // Fetch notes
      const { data: notesData } = await supabase
        .from('notes')
        .select('id, title, folder_id, tags')
        .order('updated_at', { ascending: false });

      setFolders(foldersData || []);
      setNotes(notesData || []);

      // Extract unique tags
      const tagsSet = new Set<string>();
      (notesData || []).forEach(note => {
        (note.tags || []).forEach(tag => tagsSet.add(tag));
      });
      setAllTags(Array.from(tagsSet).sort());
    } catch (error) {
      console.error('Error fetching folders and notes:', error);
    }
  };

  const setupRealTimeSubscriptions = () => {
    // Notes real-time subscription
    const notesChannel = supabase
      .channel('sidebar-notes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNote = payload.new as Note;
            setNotes(prev => [newNote, ...prev]);
            // Update tags if note has tags
            if (newNote.tags?.length) {
              setAllTags(prev => {
                const newTags = new Set([...prev, ...newNote.tags]);
                return Array.from(newTags).sort();
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedNote = payload.new as Note;
            setNotes(prev => prev.map(note => 
              note.id === updatedNote.id ? updatedNote : note
            ));
            // Recalculate tags
            setNotes(currentNotes => {
              const updated = currentNotes.map(note => 
                note.id === updatedNote.id ? updatedNote : note
              );
              const tagsSet = new Set<string>();
              updated.forEach(note => {
                (note.tags || []).forEach(tag => tagsSet.add(tag));
              });
              setAllTags(Array.from(tagsSet).sort());
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            setNotes(prev => {
              const filtered = prev.filter(note => note.id !== payload.old.id);
              // Recalculate tags
              const tagsSet = new Set<string>();
              filtered.forEach(note => {
                (note.tags || []).forEach(tag => tagsSet.add(tag));
              });
              setAllTags(Array.from(tagsSet).sort());
              return filtered;
            });
          }
        }
      )
      .subscribe();

    // Folders real-time subscription
    const foldersChannel = supabase
      .channel('sidebar-folders-changes')
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

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50';

  const getNotesInFolder = (folderId: string | null) => 
    notes.filter(note => note.folder_id === folderId);

  const getNotesWithTag = (tag: string) =>
    notes.filter(note => note.tags?.includes(tag));

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
                  {folders.filter(folder => getNotesInFolder(folder.id).length > 0).map((folder) => {
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
                                {isExpanded ? (
                                  <ChevronDown className="w-3 h-3 opacity-60" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 opacity-60" />
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
                  {allTags.slice(0, 8).map((tag) => {
                    const taggedNotes = getNotesWithTag(tag);
                    return (
                      <SidebarMenuItem key={tag}>
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={`/?tag=${tag}`} 
                            className="flex items-center justify-between w-full pl-6"
                          >
                            <span className="text-sm">{tag}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                  {allTags.length > 8 && (
                    <SidebarMenuItem>
                      <div className="px-6 py-1 text-xs text-muted-foreground">
                        +{allTags.length - 8} more
                      </div>
                    </SidebarMenuItem>
                  )}
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