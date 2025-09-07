export interface DemoNote {
  id: string;
  title: string;
  content: string;
  is_starred: boolean;
  updated_at: string;
  created_at: string;
  folder_id: string | null;
  tags: string[];
  user_id: string;
}

export interface DemoFolder {
  id: string;
  name: string;
  color: string;
}

export const demoFolders: DemoFolder[] = [
  { id: 'folder-1', name: 'Work Projects', color: '#3b82f6' },
  { id: 'folder-2', name: 'Personal', color: '#10b981' },
  { id: 'folder-3', name: 'Ideas', color: '#f59e0b' },
];

export const demoNotes: DemoNote[] = [
  {
    id: 'note-1',
    user_id: 'demo-user',
    title: 'AI-Powered Note Taking Features',
    content: `<h2>Smart Features Overview</h2>
    <p>This demo showcases the powerful AI capabilities of our note-taking app:</p>
    <ul>
      <li><strong>AI Text Enhancement:</strong> Improve writing quality and clarity</li>
      <li><strong>Smart Summarization:</strong> Generate concise summaries of long notes</li>
      <li><strong>Content Expansion:</strong> Elaborate on ideas with AI assistance</li>
      <li><strong>Tone Adjustment:</strong> Modify the tone to match your audience</li>
    </ul>
    <blockquote>
      <p>"Transform your note-taking experience with cutting-edge AI technology that adapts to your workflow."</p>
    </blockquote>
    <p>Try editing this content and use the AI features in the toolbar above!</p>`,
    is_starred: true,
    folder_id: 'folder-1',
    tags: ['AI', 'features', 'demo'],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z',
  },
  {
    id: 'note-2',
    user_id: 'demo-user',
    title: 'Meeting Notes - Product Roadmap',
    content: `<h2>Q1 2024 Product Roadmap Meeting</h2>
    <p><strong>Date:</strong> January 15, 2024</p>
    <p><strong>Attendees:</strong> Sarah, Mike, Alex, Jennifer</p>
    
    <h3>Key Decisions</h3>
    <ul>
      <li>Implement real-time collaboration features</li>
      <li>Enhance mobile app performance</li>
      <li>Add advanced search capabilities</li>
    </ul>
    
    <h3>Action Items</h3>
    <ul>
      <li>Sarah: Research collaboration tools integration</li>
      <li>Mike: Mobile performance optimization plan</li>
      <li>Alex: Search algorithm improvements</li>
    </ul>`,
    is_starred: false,
    folder_id: 'folder-1',
    tags: ['meeting', 'roadmap', 'planning'],
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T11:45:00Z',
  },
  {
    id: 'note-3',
    user_id: 'demo-user',
    title: 'Creative Writing Ideas',
    content: `<h2>Story Concepts</h2>
    
    <h3>📚 "The Digital Librarian"</h3>
    <p>A story about an AI that becomes sentient while organizing humanity's knowledge. It discovers hidden patterns in human behavior and starts predicting the future.</p>
    
    <h3>🌟 "Constellation Maps"</h3>
    <p>In a world where emotions create visible light patterns in the sky, a young astronomer discovers that star constellations are actually collective human memories.</p>
    
    <h3>🔮 "The Note Keeper"</h3>
    <p>Every thought someone writes down comes to life in a parallel dimension. A writer discovers their notes are creating an entire universe.</p>
    
    <blockquote>
      <p>"Ideas are like seeds - they need the right environment to grow into something beautiful."</p>
    </blockquote>`,
    is_starred: true,
    folder_id: 'folder-2',
    tags: ['creative', 'writing', 'stories', 'ideas'],
    created_at: '2024-01-14T20:15:00Z',
    updated_at: '2024-01-15T08:20:00Z',
  },
  {
    id: 'note-4',
    user_id: 'demo-user',
    title: 'Learning React Best Practices',
    content: `<h2>React Development Guidelines</h2>
    
    <h3>Component Design Principles</h3>
    <ul>
      <li><strong>Single Responsibility:</strong> Each component should have one clear purpose</li>
      <li><strong>Composition over Inheritance:</strong> Use composition patterns for flexibility</li>
      <li><strong>Props Interface:</strong> Define clear TypeScript interfaces for props</li>
    </ul>
    
    <h3>Performance Optimization</h3>
    <ul>
      <li>Use React.memo for expensive renders</li>
      <li>Implement useCallback for stable references</li>
      <li>Optimize bundle size with lazy loading</li>
    </ul>
    
    <pre><code>// Example of optimized component
const OptimizedComponent = React.memo(({ data, onUpdate }) => {
  const handleClick = useCallback(() => {
    onUpdate(data.id);
  }, [data.id, onUpdate]);
  
  return &lt;div onClick={handleClick}&gt;{data.title}&lt;/div&gt;;
});</code></pre>`,
    is_starred: false,
    folder_id: 'folder-1',
    tags: ['react', 'programming', 'learning', 'best-practices'],
    created_at: '2024-01-13T15:30:00Z',
    updated_at: '2024-01-14T09:15:00Z',
  },
  {
    id: 'note-5',
    user_id: 'demo-user',
    title: 'Travel Journal - Tokyo Adventure',
    content: `<h2>🗾 Tokyo Trip - Day 1</h2>
    <p><strong>January 10, 2024</strong></p>
    
    <h3>Morning - Shibuya Crossing</h3>
    <p>Witnessed the famous scramble crossing at rush hour. The organized chaos is mesmerizing - thousands of people moving in perfect harmony despite the apparent madness.</p>
    
    <h3>Afternoon - Meiji Shrine</h3>
    <p>A peaceful oasis in the middle of the bustling city. The contrast between the serene forest paths and the urban environment just outside is striking.</p>
    
    <h3>Evening - Tsukiji Fish Market</h3>
    <p>Best sushi I've ever had! The freshness and quality are incomparable. Learned about the art of sushi preparation from a master chef.</p>
    
    <blockquote>
      <p>"Travel is the only thing you can buy that makes you richer in experiences."</p>
    </blockquote>
    
    <p><strong>Tomorrow's Plan:</strong> Visit TeamLab Borderless and explore Harajuku district.</p>`,
    is_starred: true,
    folder_id: 'folder-2',
    tags: ['travel', 'tokyo', 'journal', 'experiences'],
    created_at: '2024-01-10T22:00:00Z',
    updated_at: '2024-01-11T08:45:00Z',
  },
  {
    id: 'note-6',
    user_id: 'demo-user',
    title: 'Startup Ideas & Innovations',
    content: `<h2>💡 Innovative Business Concepts</h2>
    
    <h3>EcoTech Solutions</h3>
    <p>Developing biodegradable tech components that naturally decompose without environmental impact. Focus on phone cases, laptop shells, and accessories.</p>
    
    <h3>AI Personal Nutritionist</h3>
    <p>An app that analyzes your health data, food preferences, and lifestyle to create personalized meal plans. Integration with grocery delivery and health tracking.</p>
    
    <h3>Virtual Reality Therapy</h3>
    <p>VR environments designed for mental health treatment, phobia reduction, and stress relief. Partnering with licensed therapists for guided sessions.</p>
    
    <h3>Smart City Infrastructure</h3>
    <p>IoT sensors for traffic optimization, energy management, and waste reduction. Real-time city data to improve urban living quality.</p>
    
    <p><em>Research needed: Market validation, technical feasibility, funding requirements</em></p>`,
    is_starred: false,
    folder_id: 'folder-3',
    tags: ['startup', 'innovation', 'business', 'tech'],
    created_at: '2024-01-12T11:20:00Z',
    updated_at: '2024-01-13T16:40:00Z',
  }
];

// Demo data management utilities
export const getDemoNotes = (): DemoNote[] => {
  const stored = localStorage.getItem('demo-notes');
  return stored ? JSON.parse(stored) : demoNotes;
};

export const saveDemoNotes = (notes: DemoNote[]) => {
  localStorage.setItem('demo-notes', JSON.stringify(notes));
};

export const getDemoFolders = (): DemoFolder[] => {
  const stored = localStorage.getItem('demo-folders');
  return stored ? JSON.parse(stored) : demoFolders;
};

export const saveDemoFolders = (folders: DemoFolder[]) => {
  localStorage.setItem('demo-folders', JSON.stringify(folders));
};

export const initializeDemoMode = () => {
  // Set demo mode flag
  localStorage.setItem('demo-mode', 'true');
  // Initialize demo data if not exists
  if (!localStorage.getItem('demo-notes')) {
    saveDemoNotes(demoNotes);
  }
  if (!localStorage.getItem('demo-folders')) {
    saveDemoFolders(demoFolders);
  }
  // Set demo user
  localStorage.setItem('demo-user', JSON.stringify({
    id: 'demo-user',
    email: 'demo@aitoolsy.com',
    name: 'Demo User'
  }));
};

export const clearDemoMode = () => {
  localStorage.removeItem('demo-mode');
  localStorage.removeItem('demo-notes');
  localStorage.removeItem('demo-folders');
  localStorage.removeItem('demo-user');
};

export const isDemoMode = (): boolean => {
  return localStorage.getItem('demo-mode') === 'true';
};

export const getDemoUser = () => {
  const stored = localStorage.getItem('demo-user');
  return stored ? JSON.parse(stored) : null;
};