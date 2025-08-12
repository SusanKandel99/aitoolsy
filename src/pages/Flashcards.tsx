import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Sparkles, RotateCcw, Plus, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export default function Flashcards() {
  const { user, loading } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    {
      id: '1',
      front: 'What is the capital of France?',
      back: 'Paris'
    },
    {
      id: '2',
      front: 'What is 2 + 2?',
      back: '4'
    },
    {
      id: '3',
      front: 'Who wrote Romeo and Juliet?',
      back: 'William Shakespeare'
    }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState(false);

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
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

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Flashcards
            </h1>
            <p className="text-muted-foreground">
              Study with interactive flashcards
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant={studyMode ? 'default' : 'outline'}
              onClick={() => setStudyMode(!studyMode)}
            >
              <Play className="w-4 h-4 mr-2" />
              {studyMode ? 'Exit Study Mode' : 'Study Mode'}
            </Button>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Card
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {flashcards.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first flashcard to start studying
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Flashcard
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Card {currentIndex + 1} of {flashcards.length}</span>
                <span>{Math.round(((currentIndex + 1) / flashcards.length) * 100)}% complete</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Flashcard */}
            <div className="relative mb-6">
              <Card 
                className="w-full h-80 cursor-pointer transition-transform hover:scale-105 perspective-1000"
                onClick={flipCard}
              >
                <CardContent className="flex items-center justify-center h-full p-8">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-4">
                      {isFlipped ? 'Answer' : 'Question'}
                    </div>
                    <div className="text-xl font-medium">
                      {isFlipped ? flashcards[currentIndex].back : flashcards[currentIndex].front}
                    </div>
                    <div className="text-sm text-muted-foreground mt-4">
                      Click to {isFlipped ? 'see question' : 'reveal answer'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4">
              <Button 
                variant="outline"
                onClick={prevCard}
                disabled={flashcards.length <= 1}
              >
                Previous
              </Button>
              
              <Button 
                variant="outline"
                onClick={flipCard}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Flip Card
              </Button>
              
              <Button 
                onClick={nextCard}
                disabled={flashcards.length <= 1}
              >
                Next
              </Button>
            </div>

            {studyMode && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  Hard
                </Button>
                <Button variant="outline" className="text-yellow-600 border-yellow-200 hover:bg-yellow-50">
                  Medium
                </Button>
                <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                  Easy
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}