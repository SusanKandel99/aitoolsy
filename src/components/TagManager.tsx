import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, X, Tag as TagIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagManagerProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

const TAG_COLORS = [
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#14b8a6', // teal
  '#f97316', // orange
];

export function TagManager({ selectedTagIds, onTagsChange }: TagManagerProps) {
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchTags();
      setupRealTimeSubscriptions();
    }
  }, [user]);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setAvailableTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const setupRealTimeSubscriptions = () => {
    const channel = supabase
      .channel('tags-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tags' },
        () => {
          fetchTags();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createTag = async () => {
    if (!user) return;

    const trimmedName = newTagName.trim();
    if (!trimmedName) {
      toast({
        title: "Tag name required",
        description: "Please enter a tag name.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert([{
          user_id: user.id,
          name: trimmedName,
          color: selectedColor,
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Tag already exists",
            description: "You already have a tag with this name.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Tag created",
        description: `Tag "${trimmedName}" has been created.`,
      });

      // Add the new tag to selected tags
      onTagsChange([...selectedTagIds, data.id]);
      
      setNewTagName('');
      setSelectedColor(TAG_COLORS[0]);
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: "Error",
        description: "Failed to create tag. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const selectedTags = availableTags.filter(tag => selectedTagIds.includes(tag.id));
  const unselectedTags = availableTags.filter(tag => !selectedTagIds.includes(tag.id));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createTag();
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <TagIcon className="w-4 h-4" />
        Tags
      </Label>
      
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
        {selectedTags.map((tag) => (
          <Badge 
            key={tag.id} 
            variant="secondary" 
            className="flex items-center gap-1"
            style={{ 
              backgroundColor: `${tag.color}20`,
              borderColor: tag.color,
              color: tag.color
            }}
          >
            {tag.name}
            <button
              onClick={() => toggleTag(tag.id)}
              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Tags</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="tag-name">Create New Tag</Label>
                <Input
                  id="tag-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter tag name..."
                  autoFocus
                />
                
                <div className="space-y-2">
                  <Label className="text-sm">Tag Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          selectedColor === color 
                            ? 'border-foreground scale-110' 
                            : 'border-muted hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={createTag} 
                  disabled={isCreating || !newTagName.trim()}
                  className="w-full"
                >
                  {isCreating ? 'Creating...' : 'Create Tag'}
                </Button>
              </div>
              
              {unselectedTags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Available Tags</Label>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {unselectedTags.map((tag) => (
                      <Button
                        key={tag.id}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        style={{ 
                          borderColor: tag.color,
                          color: tag.color
                        }}
                        onClick={() => {
                          toggleTag(tag.id);
                        }}
                      >
                        <span 
                          className="w-2 h-2 rounded-full mr-1.5"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}