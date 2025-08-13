import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, RotateCcw, Eye, EyeOff } from 'lucide-react';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty: string;
  note_id: string;
}

interface Note {
  id: string;
  title: string;
}

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  notes: Note[];
}

export function FlashcardViewer({ flashcards, notes }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const currentCard = flashcards[currentIndex];
  const currentNote = notes.find(note => note.id === currentCard?.note_id);

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    setShowAnswer(false);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setShowAnswer(false);
  };

  const resetCards = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (flashcards.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <div className="text-muted-foreground">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No flashcards yet</p>
            <p className="text-sm">Generate some flashcards from your notes to start studying!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {flashcards.length}
          </span>
          {currentNote && (
            <Badge variant="outline" className="text-xs">
              From: {currentNote.title}
            </Badge>
          )}
          <Badge className={getDifficultyColor(currentCard.difficulty)}>
            {currentCard.difficulty}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={resetCards}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <Card className="min-h-[300px]">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Question:</h3>
              <p className="text-base leading-relaxed">{currentCard.question}</p>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Answer:</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnswer(!showAnswer)}
                >
                  {showAnswer ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Answer
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Answer
                    </>
                  )}
                </Button>
              </div>
              
              {showAnswer ? (
                <p className="text-base leading-relaxed bg-muted/30 p-4 rounded-lg">
                  {currentCard.answer}
                </p>
              ) : (
                <div className="bg-muted/20 p-4 rounded-lg text-center text-muted-foreground">
                  Click "Show Answer" to reveal the answer
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={prevCard}
          disabled={flashcards.length <= 1}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex gap-1">
          {flashcards.slice(0, 10).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentIndex 
                  ? 'bg-primary' 
                  : 'bg-muted-foreground/20'
              }`}
            />
          ))}
          {flashcards.length > 10 && (
            <span className="text-xs text-muted-foreground ml-2">
              +{flashcards.length - 10} more
            </span>
          )}
        </div>

        <Button
          variant="outline"
          onClick={nextCard}
          disabled={flashcards.length <= 1}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}