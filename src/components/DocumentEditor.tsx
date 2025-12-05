import { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Save, Users } from 'lucide-react';
import { PresenceUser } from '@/types';
import { cn } from '@/lib/utils';

interface DocumentEditorProps {
  content: string;
  users: PresenceUser[];
  currentUser: string;
  onContentChange: (content: string) => void;
}

export function DocumentEditor({ content, users, currentUser, onContentChange }: DocumentEditorProps) {
  const [localContent, setLocalContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync external content changes
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const debouncedSave = useCallback((newContent: string) => {
    setIsSaving(true);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onContentChange(newContent);
      setIsSaving(false);
    }, 500);
  }, [onContentChange]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    debouncedSave(newContent);
  };

  const otherUsers = users.filter(u => u.username !== currentUser);

  const wordCount = localContent.trim() ? localContent.trim().split(/\s+/).length : 0;
  const charCount = localContent.length;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Shared Document</h2>
            <p className="text-xs text-muted-foreground">
              {wordCount} words • {charCount} characters
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Save indicator */}
          <div className={cn(
            "flex items-center gap-1.5 text-xs transition-opacity duration-200",
            isSaving ? "opacity-100" : "opacity-0"
          )}>
            <Save className="w-3 h-3 text-synapse-warning animate-pulse" />
            <span className="text-muted-foreground">Saving...</span>
          </div>
          
          {/* Collaborators */}
          {otherUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div className="flex -space-x-2">
                {otherUsers.slice(0, 3).map((user) => (
                  <div
                    key={user.id}
                    className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: user.color }}
                    title={user.username}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                ))}
                {otherUsers.length > 3 && (
                  <div className="w-6 h-6 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                    +{otherUsers.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={handleChange}
          placeholder="Start typing your document here...

This is a collaborative document. Any changes you make will be visible to all users in this room in real-time.

Tips:
• Use the chat panel to communicate with your team
• Type /ai followed by a prompt to get AI assistance
• Changes are automatically saved"
          className={cn(
            "w-full h-full resize-none bg-card/30 border border-border rounded-xl p-4",
            "text-foreground placeholder:text-muted-foreground/50",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            "transition-all duration-200 font-mono text-sm leading-relaxed"
          )}
        />
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
          <span>
            {otherUsers.length > 0 
              ? `Collaborating with ${otherUsers.map(u => u.username).join(', ')}`
              : 'You are the only editor'
            }
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-synapse-success" />
            Auto-save enabled
          </span>
        </div>
      </div>
    </div>
  );
}
