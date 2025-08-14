import { useState, useEffect } from 'react';
import { Brain, Star, Hash, FolderOpen, Search, Settings, LogOut, Plus, Sparkles, Tag } from 'lucide-react';
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

  useEffect(() => {
    if (user) {
      fetchFoldersAndNotes();
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

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50';

  const getNotesInFolder = (folderId: string | null) => 
    notes.filter(note => note.folder_id === folderId);

  const getNotesWithTag = (tag: string) =>
    notes.filter(note => note.tags?.includes(tag));

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
        {!collapsed && folders.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Folders</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {folders.map((folder) => {
                  const folderNotes = getNotesInFolder(folder.id);
                  return (
                    <SidebarMenuItem key={folder.id}>
                      <div className="flex items-center justify-between w-full p-2 rounded-md hover:bg-sidebar-accent/50">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: folder.color }}
                          />
                          <FolderOpen className="w-4 h-4" />
                          <span className="truncate text-sm">{folder.name}</span>
                        </div>
                        {folderNotes.length > 0 && (
                          <Badge variant="secondary" className="text-xs h-5">
                            {folderNotes.length}
                          </Badge>
                        )}
                      </div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Dynamic Tags */}
        {!collapsed && allTags.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Tags</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {allTags.slice(0, 8).map((tag) => {
                  const taggedNotes = getNotesWithTag(tag);
                  return (
                    <SidebarMenuItem key={tag}>
                      <div className="flex items-center justify-between w-full p-2 rounded-md hover:bg-sidebar-accent/50">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          <span className="truncate text-sm">{tag}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs h-5">
                          {taggedNotes.length}
                        </Badge>
                      </div>
                    </SidebarMenuItem>
                  );
                })}
                {allTags.length > 8 && (
                  <SidebarMenuItem>
                    <div className="px-2 py-1 text-xs text-muted-foreground">
                      +{allTags.length - 8} more tags
                    </div>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
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