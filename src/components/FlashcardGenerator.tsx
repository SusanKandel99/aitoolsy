import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brain, Loader2 } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
}

interface FlashcardGeneratorProps {
  notes: Note[];
  onFlashcardsGenerated: () => void;
}

interface Flashcard {
  question: string;
  answer: string;
}

export function FlashcardGenerator({ notes, onFlashcardsGenerated }: FlashcardGeneratorProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateFlashcards = async () => {
    if (!selectedNoteId) {
      toast({
        title: "No note selected",
        description: "Please select a note to generate flashcards from.",
        variant: "destructive",
      });
      return;
    }

    const selectedNote = notes.find(note => note.id === selectedNoteId);
    if (!selectedNote) return;

    setIsGenerating(true);

    try {
      // Strip HTML tags from content for AI processing
      const textContent = selectedNote.content.replace(/<[^>]*>/g, '').trim();
      
      if (!textContent) {
        throw new Error('Note content is empty');
      }

      // Generate flashcards using OpenRouter AI
      const { data: response, error: functionError } = await supabase.functions.invoke('generate-flashcards', {
        body: {
          content: textContent,
          difficulty: difficulty
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to generate flashcards');
      }

      if (response.error) {
        throw new Error(response.error);
      }

      const flashcards: Flashcard[] = response.flashcards;

      if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
        throw new Error('No flashcards were generated');
      }

      // Save flashcards to database
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const flashcardData = flashcards.map(flashcard => ({
        user_id: user.user.id,
        note_id: selectedNote.id,
        question: flashcard.question,
        answer: flashcard.answer,
        difficulty: difficulty
      }));

      const { error: insertError } = await supabase
        .from('flashcards')
        .insert(flashcardData);

      if (insertError) {
        throw new Error(`Failed to save flashcards: ${insertError.message}`);
      }

      toast({
        title: "Flashcards generated",
        description: `Successfully generated ${flashcards.length} ${difficulty} flashcards from "${selectedNote.title}".`,
      });

      // Reset form
      setSelectedNoteId('');
      setDifficulty('medium');
      
      // Trigger refresh of flashcards list
      onFlashcardsGenerated();

    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Generate Flashcards from Notes
        </CardTitle>
        <CardDescription>
          Select a note and difficulty level to generate AI-powered flashcards for studying
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Note</label>
          <Select value={selectedNoteId} onValueChange={setSelectedNoteId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a note to generate flashcards from" />
            </SelectTrigger>
            <SelectContent>
              {notes.length === 0 ? (
                <SelectItem value="no-notes" disabled>
                  No notes available
                </SelectItem>
              ) : (
                notes.map(note => (
                  <SelectItem key={note.id} value={note.id}>
                    {note.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Difficulty Level</label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor('easy')}>Easy</Badge>
                  <span className="text-sm text-muted-foreground">Basic facts and definitions</span>
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor('medium')}>Medium</Badge>
                  <span className="text-sm text-muted-foreground">Concepts and connections</span>
                </div>
              </SelectItem>
              <SelectItem value="hard">
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor('hard')}>Hard</Badge>
                  <span className="text-sm text-muted-foreground">Critical thinking and analysis</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleGenerateFlashcards}
          disabled={!selectedNoteId || isGenerating || notes.length === 0}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Flashcards...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Generate Flashcards
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}