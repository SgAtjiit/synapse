import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles, Bot, Copy, Check } from 'lucide-react';
import { Message, PresenceUser } from '@/types';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  messages: Message[];
  users: PresenceUser[];
  currentUser: string;
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
}

export function ChatPanel({ messages, users, currentUser, onSendMessage, onTyping }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const copyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    onTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
      onTyping(false);
    }
  };

  const typingUsers = users.filter(u => u.isTyping && u.username !== currentUser);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-card/50 border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-synapse-success" />
          Chat
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {messages.length} messages • {users.length} online
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Sparkles className="w-8 h-8 mb-2 text-primary/50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">
              Start the conversation or use <code className="px-1 py-0.5 rounded bg-secondary font-mono">/ai</code> for AI help
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.username === currentUser;
            const isAI = message.isAI;

            return (
              <div
                key={message.id}
                className={cn(
                  "animate-fade-in flex",
                  isOwnMessage ? "justify-end" : "justify-start"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl p-3",
                    isAI && "ai-message-gradient border border-synapse-ai/20 rounded-xl",
                    isOwnMessage && !isAI && "bg-primary text-primary-foreground rounded-br-sm",
                    !isOwnMessage && !isAI && "bg-secondary/80 rounded-bl-sm"
                  )}
                >
                  {/* Avatar and name for non-own messages */}
                  {!isOwnMessage && (
                    <div className="flex items-center gap-2 mb-1">
                      {isAI ? (
                        <div className="w-6 h-6 rounded-lg bg-synapse-ai/20 border border-synapse-ai/30 flex items-center justify-center shrink-0">
                          <Bot className="w-3 h-3 text-synapse-ai" />
                        </div>
                      ) : (
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: getUserColor(message.username) }}
                        >
                          {message.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className={cn(
                        "font-medium text-xs",
                        isAI ? "text-synapse-ai" : "text-foreground"
                      )}>
                        {isAI ? 'Synapse AI' : message.username}
                      </span>
                    </div>
                  )}

                  {/* Message content */}
                  <p className={cn(
                    "text-sm whitespace-pre-wrap break-words",
                    isAI && "text-foreground/90",
                    isOwnMessage && !isAI && "text-primary-foreground",
                    !isOwnMessage && !isAI && "text-foreground"
                  )}>
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 ml-1 bg-synapse-ai animate-pulse" />
                    )}
                  </p>

                  {/* Timestamp and Copy */}
                  <div className={cn(
                    "flex items-center gap-2 mt-1",
                    isOwnMessage ? "justify-end" : "justify-start"
                  )}>
                    <span className={cn(
                      "text-[10px]",
                      isOwnMessage && !isAI ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {formatTime(message.timestamp)}
                    </span>
                    <button
                      onClick={() => copyMessage(message.id, message.content)}
                      className={cn(
                        "p-1 rounded hover:bg-black/10 transition-colors",
                        isOwnMessage && !isAI ? "text-primary-foreground/50 hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                      title="Copy message"
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="w-3 h-3 text-synapse-success" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground animate-fade-in">
            <div className="typing-indicator flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            </div>
            <span>
              {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Type a message or /ai for AI..."
            value={input}
            onChange={handleInputChange}
            className="flex-1 bg-secondary/50"
          />
          <Button type="submit" size="icon" disabled={!input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function getUserColor(username: string): string {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
