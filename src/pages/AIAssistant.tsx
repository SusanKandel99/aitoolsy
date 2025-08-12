import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Brain, Send, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AIAssistant() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: {
          action: 'generate',
          prompt: prompt
        }
      });

      if (error) {
        toast({
          title: "AI generation failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setResponse(data.result);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Error",
        description: "Failed to generate content",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const quickPrompts = [
    "Write a creative story about artificial intelligence",
    "Explain quantum computing in simple terms",
    "Create a marketing strategy for a small business",
    "Write a professional email template",
    "Generate ideas for a weekend project",
    "Create a workout plan for beginners"
  ];

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
              <Brain className="w-6 h-6" />
              AI Assistant
            </h1>
            <p className="text-muted-foreground">
              Generate content with AI assistance
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Input Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  What would you like to create?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter your prompt here... Be specific about what you want to generate."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-32 resize-none"
                />
                <Button 
                  onClick={handleGenerate} 
                  disabled={!prompt.trim() || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Prompts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Quick Prompts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {quickPrompts.map((quickPrompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start h-auto p-3 text-left whitespace-normal"
                      onClick={() => setPrompt(quickPrompt)}
                    >
                      {quickPrompt}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Output Section */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Generated Content</CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                {response ? (
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap">
                      {response}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(response)}
                      >
                        Copy to Clipboard
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const noteContent = `# AI Generated Content\n\n**Prompt:** ${prompt}\n\n**Response:**\n${response}`;
                          window.location.href = `/editor?content=${encodeURIComponent(noteContent)}`;
                        }}
                      >
                        Save as Note
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Enter a prompt to generate content with AI
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}