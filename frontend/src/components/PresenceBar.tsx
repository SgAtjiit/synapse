import { useState } from 'react';
import { LogOut, Wifi, WifiOff, FileText, MessageSquare, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PresenceUser } from '@/types';
import { cn } from '@/lib/utils';

interface PresenceBarProps {
  roomId: string;
  users: PresenceUser[];
  currentUser: string;
  isConnected: boolean;
  onLeave: () => void;
  showChat?: boolean;
  onToggleChat?: () => void;
  showDocuments?: boolean;
  onToggleDocuments?: () => void;
}

export function PresenceBar({
  roomId,
  users,
  currentUser,
  isConnected,
  onLeave,
  showChat,
  onToggleChat,
  showDocuments,
  onToggleDocuments
}: PresenceBarProps) {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <header className="min-h-[3.5rem] border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-2 sm:px-4 gap-2 flex-wrap sm:flex-nowrap py-2 sm:py-0">
      {/* Left: Logo & Room */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex-shrink-0">
            <img src="/logo.png" alt="Synapse" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-foreground hidden sm:inline">Synapse</span>
        </div>

        <div className="h-6 w-px bg-border hidden sm:block" />

        {/* Toggle buttons - only show on desktop */}
        {onToggleChat && onToggleDocuments && (
          <>
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleChat}
                className={cn("h-8 w-8", showChat && "bg-accent text-accent-foreground")}
                title="Toggle Chat"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleDocuments}
                className={cn("h-8 w-8", showDocuments && "bg-accent text-accent-foreground")}
                title="Toggle Documents"
              >
                <FileText className="w-4 h-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-border hidden md:block" />
          </>
        )}

        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground hidden xs:inline">Room:</span>
          <code className="px-1.5 sm:px-2 py-0.5 rounded-md bg-secondary font-mono text-xs sm:text-sm text-foreground">
            {roomId}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 sm:h-7 sm:w-7"
            onClick={copyRoomCode}
            title="Copy room code"
          >
            {copied ? (
              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-synapse-success" />
            ) : (
              <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Center: Online Users */}
      <div className="flex items-center gap-2 sm:gap-3 order-last sm:order-none w-full sm:w-auto justify-center">
        <div className="flex -space-x-2">
          {users.slice(0, 5).map((user, index) => (
            <div
              key={user.id}
              className={cn(
                "relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-background flex items-center justify-center text-[10px] sm:text-xs font-bold transition-transform hover:scale-110 hover:z-10",
                user.username === currentUser && "ring-2 ring-primary ring-offset-1 sm:ring-offset-2 ring-offset-background"
              )}
              style={{
                backgroundColor: user.color,
                zIndex: users.length - index
              }}
              title={`${user.username}${user.username === currentUser ? ' (you)' : ''}`}
            >
              {user.username.charAt(0).toUpperCase()}
              {user.isTyping && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-synapse-warning rounded-full border-2 border-background animate-pulse" />
              )}
            </div>
          ))}
          {users.length > 5 && (
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] sm:text-xs font-bold">
              +{users.length - 5}
            </div>
          )}
        </div>
        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
          {users.length} online
        </span>
      </div>

      {/* Right: Connection Status & Leave */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={cn(
          "flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full",
          isConnected ? "bg-synapse-success/10 text-synapse-success" : "bg-destructive/10 text-destructive"
        )}>
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3" />
              <span className="hidden sm:inline">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span className="hidden sm:inline">Disconnected</span>
            </>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={onLeave} className="text-muted-foreground hover:text-destructive h-8 px-2 sm:px-3">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Leave</span>
        </Button>
      </div>
    </header>
  );
}

