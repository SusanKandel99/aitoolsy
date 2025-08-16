import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  Clock, 
  RotateCcw, 
  Loader2,
  Eye 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NoteHistoryEntry {
  id: string;
  note_id: string;
  title: string;
  content: string;
  tags: string[];
  folder_id: string | null;
  version_number: number;
  created_at: string;
}

interface NoteHistoryProps {
  noteId: string;
  onRestore: (historyEntry: NoteHistoryEntry) => void;
}

export function NoteHistory({ noteId, onRestore }: NoteHistoryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [history, setHistory] = useState<NoteHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [previewEntry, setPreviewEntry] = useState<NoteHistoryEntry | null>(null);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!user || !noteId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('note_history')
        .select('*')
        .eq('note_id', noteId)
        .order('version_number', { ascending: false });

      if (error) throw error;

      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching note history:', error);
      toast({
        title: "Failed to load history",
        description: "Could not load note history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, noteId, user]);

  const handleRestore = async (entry: NoteHistoryEntry) => {
    setIsRestoring(entry.id);
    try {
      onRestore(entry);
      toast({
        title: "Version restored",
        description: `Restored to version ${entry.version_number} from ${formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}`,
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error restoring version:', error);
      toast({
        title: "Restore failed",
        description: "Failed to restore version. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(null);
    }
  };

  const getPreviewText = (content: string) => {
    const plainText = content
      .replace(/<[^>]*>/g, '')
      .replace(/[#*`\[\]]/g, '')
      .trim();
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Note History</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading history...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No version history available</p>
                <p className="text-sm">History is created each time you save changes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          v{entry.version_number}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewEntry(entry)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(entry)}
                          disabled={isRestoring === entry.id}
                        >
                          {isRestoring === entry.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <h4 className="font-medium mb-1 truncate">{entry.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {getPreviewText(entry.content || 'No content')}
                    </p>
                    
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {entry.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {entry.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{entry.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewEntry} onOpenChange={() => setPreviewEntry(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="outline">v{previewEntry?.version_number}</Badge>
              {previewEntry?.title}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            {previewEntry && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Saved {formatDistanceToNow(new Date(previewEntry.created_at), { addSuffix: true })}
                </div>
                
                {previewEntry.tags && previewEntry.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {previewEntry.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewEntry.content || '<p>No content</p>' }}
                />
                
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={() => {
                      handleRestore(previewEntry);
                      setPreviewEntry(null);
                    }}
                    disabled={isRestoring === previewEntry.id}
                  >
                    {isRestoring === previewEntry.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RotateCcw className="w-4 h-4 mr-2" />
                    )}
                    Restore This Version
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}