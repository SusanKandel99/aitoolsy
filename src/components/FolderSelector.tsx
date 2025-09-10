import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Folder, Plus, FolderPlus } from 'lucide-react';

interface Folder {
  id: string;
  name: string;
  color: string;
}

interface FolderSelectorProps {
  selectedFolderId?: string;
  onFolderChange: (folderId: string | null) => void;
}

const folderColors = [
  { name: 'Blue', value: '#6366f1' },
  { name: 'Green', value: '#10b981' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Gray', value: '#6b7280' },
];

export function FolderSelector({ selectedFolderId, onFolderChange }: FolderSelectorProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(folderColors[0].value);
  const { toast } = useToast();

  useEffect(() => {
    fetchFolders();
    const cleanup = setupRealTimeSubscriptions();
    return cleanup;
  }, []);

  const setupRealTimeSubscriptions = () => {
    console.log('Setting up FolderSelector real-time subscriptions...');
    
    const foldersChannel = supabase
      .channel('folder-selector-folders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folders'
        },
        (payload) => {
          console.log('FolderSelector received folder update:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            const newFolder = payload.new as Folder;
            setFolders(prev => {
              const exists = prev.some(folder => folder.id === newFolder.id);
              if (exists) {
                console.log('Folder already exists, skipping duplicate');
                return prev;
              }
              console.log('Adding new folder to FolderSelector:', newFolder.name);
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
      console.log('Cleaning up FolderSelector subscriptions...');
      supabase.removeChannel(foldersChannel);
    };
  };

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('name');

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('folders')
        .insert([{
          user_id: user.user.id,
          name: newFolderName.trim(),
          color: newFolderColor
        }])
        .select()
        .single();

      if (error) throw error;

      setFolders([...folders, data]);
      setNewFolderName('');
      setNewFolderColor(folderColors[0].value);
      setIsCreateOpen(false);
      
      toast({
        title: "Folder created",
        description: `Created folder "${data.name}".`,
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Folder className="w-4 h-4" />
        Folder
      </Label>
      
      <div className="flex gap-2">
        <Select
          value={selectedFolderId || 'none'}
          onValueChange={(value) => onFolderChange(value === 'none' ? null : value)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a folder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No folder</SelectItem>
            {folders.map((folder) => (
              <SelectItem key={folder.id} value={folder.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: folder.color }}
                  />
                  {folder.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FolderPlus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name..."
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {folderColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewFolderColor(color.value)}
                      className={`w-6 h-6 rounded-full border-2 ${
                        newFolderColor === color.value ? 'border-foreground' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createFolder} disabled={!newFolderName.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}