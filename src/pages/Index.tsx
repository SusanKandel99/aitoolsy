import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Brain, Sparkles, FileText, Zap, History, Lightbulb, Search, Tags, Users, BarChart3 } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    {
      icon: FileText,
      title: "Smart Note Editor",
      description: "Rich text formatting, tagging, and organization tools for all your ideas"
    },
    {
      icon: Brain,
      title: "AI Assistant",
      description: "Summarize, generate flashcards, and get insights from your notes"
    },
    {
      icon: Lightbulb,
      title: "Study Tools",
      description: "Flashcards, quizzes, and spaced repetition for enhanced learning"
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "Share notes and collaborate in real-time with your team"
    },
    {
      icon: Search,
      title: "Smart Search",
      description: "Find anything instantly with powerful search and AI-powered suggestions"
    },
    {
      icon: BarChart3,
      title: "AI Insights",
      description: "Get analytics on your learning progress and note-taking patterns"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-50"></div>
        
        <div className="container relative mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Hero content */}
            <div className="text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-Powered Productivity
              </div>
              
              <div className="space-y-6">
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  Transform Your{' '}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Note-Taking
                  </span>
                </h1>
                
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                  Experience the future of digital note-taking with AI assistance, smart organization, 
                  and powerful collaboration tools.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white">
                  Get Started Free
                </Button>
                <Button size="lg" variant="outline">
                  Watch Demo
                </Button>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground justify-center lg:justify-start">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Free to start
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  No credit card required
                </div>
              </div>
            </div>
            
            {/* Right side - CTA */}
            <div className="flex justify-center">
              <div className="text-center space-y-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center">
                  <Brain className="w-16 h-16 text-white" />
                </div>
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white px-12 py-4 text-lg">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-primary via-primary to-accent">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Notes?
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Join thousands of users who have revolutionized their note-taking with 
              AI-powered insights and smart organization.
            </p>
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg"
            >
              Start Your Journey →
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Everything You Need for Smart Note-Taking
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              From intelligent AI assistance to powerful collaboration tools, aitoolsy has 
              everything you need to enhance your productivity and learning.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group p-8 border-0 bg-card/50 hover:bg-card/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Unlock Full AI Power Section */}
      <div className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto p-8 lg:p-12 bg-card/80 backdrop-blur-sm border-0 shadow-2xl">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center flex-shrink-0">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-6 flex-1">
                <div className="space-y-4">
                  <h3 className="text-2xl lg:text-3xl font-bold">Unlock Full AI Power</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    To experience the complete aitoolsy AI features including real AI assistance, 
                    authentication, cloud sync, and collaboration, connect to Supabase using our native integration.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {['AI Chat Assistant', 'User Authentication', 'Cloud Synchronization', 'Real-time Collaboration', 'File Storage'].map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card/30 backdrop-blur-sm py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                aitoolsy
              </span>
            </div>
            <p className="text-muted-foreground text-center md:text-right">
              &copy; 2024 aitoolsy. Transform your note-taking experience.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
