import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FlashcardGenerator } from '@/components/FlashcardGenerator';
import { FlashcardViewer } from '@/components/FlashcardViewer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Navigate } from 'react-router-dom';

interface Note {
  id: string;
  title: string;
  content: string;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty: string;
  note_id: string;
  created_at: string;
}

export default function Flashcards() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('id, title, content')
        .order('updated_at', { ascending: false });

      if (notesError) {
        throw new Error(`Failed to fetch notes: ${notesError.message}`);
      }

      // Fetch flashcards
      const { data: flashcardsData, error: flashcardsError } = await supabase
        .from('flashcards')
        .select('*')
        .order('created_at', { ascending: false });

      if (flashcardsError) {
        throw new Error(`Failed to fetch flashcards: ${flashcardsError.message}`);
      }

      setNotes(notesData || []);
      setFlashcards(flashcardsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "Failed to load flashcards and notes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlashcardsGenerated = () => {
    fetchData();
  };

  const handleClearAllFlashcards = async () => {
    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        throw new Error(`Failed to clear flashcards: ${error.message}`);
      }

      setFlashcards([]);
      toast({
        title: "Flashcards cleared",
        description: "All flashcards have been deleted.",
      });
    } catch (error) {
      console.error('Error clearing flashcards:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clear flashcards.",
        variant: "destructive",
      });
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="w-8 h-8" />
              Flashcards
            </h1>
            <p className="text-muted-foreground mt-2">
              Generate AI-powered flashcards from your notes and study efficiently
            </p>
          </div>
          {flashcards.length > 0 && (
            <Button variant="destructive" onClick={handleClearAllFlashcards}>
              Clear All
            </Button>
          )}
        </div>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate Flashcards</TabsTrigger>
            <TabsTrigger value="study" disabled={flashcards.length === 0}>
              Study ({flashcards.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-4">
            <FlashcardGenerator 
              notes={notes} 
              onFlashcardsGenerated={handleFlashcardsGenerated}
            />
          </TabsContent>
          
          <TabsContent value="study" className="space-y-4">
            <FlashcardViewer 
              flashcards={flashcards} 
              notes={notes}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}