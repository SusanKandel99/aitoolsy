import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Brain, Sparkles, FileText, Zap, History, Lightbulb, Search, Tags, Users, BarChart3 } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-glow"></div>
        </div>
        
        <div className="container relative mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Hero content */}
            <div className="text-center lg:text-left space-y-10 animate-fade-in">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-card backdrop-blur-sm border border-primary/20 text-primary text-sm font-semibold shadow-soft">
                <Sparkles className="w-5 h-5 animate-glow" />
                AI-Powered Productivity
              </div>
              
              <div className="space-y-8">
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  Transform Your{' '}
                  <span className="bg-gradient-hero bg-clip-text text-transparent animate-glow">
                    Note-Taking
                  </span>
                </h1>
                
                <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                  Experience the future of digital note-taking with AI assistance, smart organization, 
                  and powerful collaboration tools that adapt to your workflow.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-gradient-primary hover:shadow-glow text-white text-lg px-8 py-4 h-auto font-semibold transition-all duration-300 hover:scale-105 shadow-elegant"
                  onClick={() => navigate('/auth')}
                >
                  Get Started Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-4 h-auto font-semibold border-2 hover:bg-primary/5 transition-all duration-300 hover:scale-105"
                >
                  Watch Demo
                </Button>
              </div>
              
              <div className="flex items-center gap-8 justify-center lg:justify-start">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-3 h-3 bg-gradient-primary rounded-full animate-glow"></div>
                  <span className="font-medium">Free to start</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-3 h-3 bg-gradient-primary rounded-full animate-glow"></div>
                  <span className="font-medium">No credit card required</span>
                </div>
              </div>
            </div>
            
            {/* Right side - Visual Element */}
            <div className="flex justify-center animate-slide-up">
              <div className="relative">
                <div className="w-80 h-80 bg-gradient-hero rounded-3xl flex items-center justify-center shadow-large animate-float">
                  <Brain className="w-32 h-32 text-white drop-shadow-lg" />
                </div>
                <div className="absolute -inset-4 bg-gradient-primary rounded-3xl blur-xl opacity-30 animate-glow"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="container relative mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-10">
            <h2 className="text-4xl lg:text-6xl font-bold text-white leading-tight animate-fade-in">
              Ready to Transform Your Notes?
            </h2>
            <p className="text-xl lg:text-2xl text-white/90 leading-relaxed animate-slide-up">
              Join thousands of users who have revolutionized their note-taking with 
              AI-powered insights and smart organization.
            </p>
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/95 hover:scale-105 font-bold px-12 py-6 text-xl h-auto shadow-elegant transition-all duration-300"
            >
              Start Your Journey →
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container relative mx-auto px-4">
          <div className="text-center mb-20 space-y-8 animate-fade-in">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Everything You Need for 
              <span className="bg-gradient-hero bg-clip-text text-transparent"> Smart Note-Taking</span>
            </h2>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              From intelligent AI assistance to powerful collaboration tools, aitoolsy has 
              everything you need to enhance your productivity and learning.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="group p-8 border-0 bg-gradient-card backdrop-blur-sm hover:shadow-elegant transition-all duration-500 hover:scale-105 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center shadow-medium group-hover:shadow-glow transition-all duration-300 animate-float">
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -inset-2 bg-gradient-primary rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-lg">
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
      <div className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-card"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
        </div>
        
        <div className="container relative mx-auto px-4">
          <Card className="max-w-5xl mx-auto p-10 lg:p-16 bg-white/80 backdrop-blur-xl border-0 shadow-large animate-slide-up">
            <div className="flex flex-col lg:flex-row items-start gap-10">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center shadow-glow animate-float">
                  <Brain className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -inset-4 bg-gradient-primary rounded-3xl blur-xl opacity-30 animate-glow"></div>
              </div>
              <div className="space-y-8 flex-1">
                <div className="space-y-6">
                  <h3 className="text-3xl lg:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                    Unlock Full AI Power
                  </h3>
                  <p className="text-muted-foreground text-xl leading-relaxed">
                    To experience the complete aitoolsy AI features including real AI assistance, 
                    authentication, cloud sync, and collaboration, connect to Supabase using our native integration.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  {['AI Chat Assistant', 'User Authentication', 'Cloud Synchronization', 'Real-time Collaboration', 'File Storage'].map((tag, index) => (
                    <span 
                      key={tag} 
                      className="px-6 py-3 bg-gradient-card border border-primary/20 text-primary rounded-full font-semibold shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
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
      <footer className="relative border-t border-primary/10 bg-gradient-card backdrop-blur-xl py-16">
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container relative mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-elegant animate-float">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -inset-2 bg-gradient-primary rounded-2xl blur-lg opacity-30 animate-glow"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                aitoolsy
              </span>
            </div>
            <p className="text-muted-foreground text-center md:text-right text-lg font-medium">
              &copy; 2024 aitoolsy. Transform your note-taking experience.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
