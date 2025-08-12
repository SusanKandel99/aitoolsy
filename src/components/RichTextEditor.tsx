import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder = "Start writing..." }: RichTextEditorProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const handleAiAction = async (action: string) => {
    if (!editor) return;

    const selectedText = editor.state.selection.empty 
      ? editor.getText() 
      : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);

    if (!selectedText.trim()) {
      toast({
        title: "No content selected",
        description: "Please select some text or ensure your document has content to use AI features.",
        variant: "destructive"
      });
      return;
    }

    setIsAiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: { 
          action,
          content: selectedText,
          prompt: action === 'generate' ? selectedText : undefined
        }
      });

      if (error) throw error;

      if (data?.result) {
        if (editor.state.selection.empty) {
          // If no text selected, replace all content
          editor.commands.setContent(data.result);
        } else {
          // Replace selected text
          editor.commands.insertContent(data.result);
        }
        
        toast({
          title: "AI assistance complete",
          description: `Text has been ${action === 'generate' ? 'generated' : action + 'd'} successfully.`,
        });
      }
    } catch (error) {
      console.error('AI assistance error:', error);
      toast({
        title: "AI assistance failed",
        description: "Please try again. Make sure your API key is configured.",
        variant: "destructive"
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const setLink = () => {
    if (!editor) return;
    
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    if (!editor) return;
    
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg bg-background">
      {/* Toolbar */}
      <div className="border-b p-2 flex items-center gap-1 flex-wrap">
        {/* Text Formatting */}
        <Button
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive('code') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <Button
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Media */}
        <Button
          variant="ghost"
          size="sm"
          onClick={setLink}
        >
          <LinkIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={addImage}
        >
          <ImageIcon className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* AI Features */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              disabled={isAiLoading}
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
            >
              {isAiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              AI
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleAiAction('improve')}>
              <Sparkles className="w-4 h-4 mr-2" />
              Improve Writing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAiAction('summarize')}>
              <Quote className="w-4 h-4 mr-2" />
              Summarize
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAiAction('expand')}>
              <List className="w-4 h-4 mr-2" />
              Expand
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAiAction('tone')}>
              <Code className="w-4 h-4 mr-2" />
              Adjust Tone
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAiAction('generate')}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Content
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Editor */}
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-4 min-h-[200px] focus-within:outline-none"
      />
    </div>
  );
}