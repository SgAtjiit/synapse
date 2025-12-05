import { LogOut, Zap, Wifi, WifiOff, PanelLeft, PanelRight, FileText, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PresenceUser } from '@/types';
import { cn } from '@/lib/utils';

interface PresenceBarProps {
  roomId: string;
  users: PresenceUser[];
  currentUser: string;
  isConnected: boolean;
  onLeave: () => void;
  showChat: boolean;
  onToggleChat: () => void;
  showDocuments: boolean;
  onToggleDocuments: () => void;
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
  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4">
      {/* Left: Logo & Room */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground hidden sm:inline">Synapse</span>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
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

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Room:</span>
          <code className="px-2 py-0.5 rounded-md bg-secondary font-mono text-sm text-foreground">
            {roomId}
          </code>
        </div>
      </div>

      {/* Center: Online Users */}
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {users.map((user, index) => (
            <div
              key={user.id}
              className={cn(
                "relative w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 hover:z-10",
                user.username === currentUser && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
              style={{
                backgroundColor: user.color,
                zIndex: users.length - index
              }}
              title={`${user.username}${user.username === currentUser ? ' (you)' : ''}`}
            >
              {user.username.charAt(0).toUpperCase()}
              {user.isTyping && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-synapse-warning rounded-full border-2 border-background animate-pulse" />
              )}
            </div>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {users.length} {users.length === 1 ? 'user' : 'users'} online
        </span>
      </div>

      {/* Right: Connection Status & Leave */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full",
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

        <Button variant="ghost" size="sm" onClick={onLeave} className="text-muted-foreground hover:text-destructive">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Leave</span>
        </Button>
      </div>
    </header>
  );
}
