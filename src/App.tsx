import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import NoteEditor from "./pages/NoteEditor";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import Starred from "./pages/Starred";
import AIAssistant from "./pages/AIAssistant";
import Flashcards from "./pages/Flashcards";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/*" 
              element={
                <SidebarProvider>
                  <div className="flex min-h-screen w-full">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col">
                      <header className="flex items-center border-b px-4 py-2">
                        <SidebarTrigger />
                      </header>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/editor/:noteId" element={<NoteEditor />} />
                        <Route path="/editor" element={<NoteEditor />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/starred" element={<Starred />} />
                        <Route path="/ai-assistant" element={<AIAssistant />} />
                        <Route path="/flashcards" element={<Flashcards />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </div>
                  </div>
                </SidebarProvider>
              } 
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
