import { Star, Clock, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NoteCardProps {
  id: string;
  title: string;
  content: string;
  isStarred: boolean;
  updatedAt: string;
  tags?: string[];
  onClick: () => void;
  onToggleStar: () => void;
}

export function NoteCard({ 
  title, 
  content, 
  isStarred, 
  updatedAt, 
  tags = [], 
  onClick, 
  onToggleStar 
}: NoteCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getPreview = (text: string) => {
    const plainText = text.replace(/[#*`\[\]]/g, '').trim();
    return plainText.length > 120 ? plainText.substring(0, 120) + '...' : plainText;
  };

  return (
    <Card 
      className="hover:shadow-md transition-all duration-200 cursor-pointer group border-0 bg-card/60 backdrop-blur-sm"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
            {title || 'Untitled'}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar();
            }}
          >
            <Star 
              className={`w-4 h-4 ${isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
          {getPreview(content) || 'No content'}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatDate(updatedAt)}
          </div>
          
          {tags.length > 0 && (
            <div className="flex items-center gap-1">
              {tags.slice(0, 2).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="text-xs px-2 py-0 h-5"
                >
                  <Hash className="w-2 h-2 mr-1" />
                  {tag}
                </Badge>
              ))}
              {tags.length > 2 && (
                <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                  +{tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}