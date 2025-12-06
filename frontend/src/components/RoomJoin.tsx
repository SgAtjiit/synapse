import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Users, FileText, Sparkles, LogOut, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface RoomJoinProps {
  onJoin: (roomId: string, username: string) => void;
  isConnected: boolean;
  defaultUsername?: string;
  userEmail?: string;
}

export function RoomJoin({ onJoin, isConnected, defaultUsername = '', userEmail = '' }: RoomJoinProps) {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState(defaultUsername);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Update username when defaultUsername changes (e.g., on initial auth load)
  useEffect(() => {
    if (defaultUsername && !username) {
      setUsername(defaultUsername);
    }
  }, [defaultUsername, username]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && username.trim()) {
      onJoin(roomId.trim(), username.trim());
    }
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
  };

  return (
    <div className="min-h-screen synapse-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden mb-4 synapse-glow">
            <img src="/logo.png" alt="Synapse" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-foreground synapse-glow-text">
            Synapse
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-Time Collaborative AI Workspace
          </p>
        </div>

        {/* User Info */}
        {userEmail && (
          <div className="flex items-center justify-between p-3 mb-6 rounded-xl bg-card/50 border border-border animate-fade-in">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary font-semibold">
                  {(defaultUsername || userEmail).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {defaultUsername || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userEmail}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout();
                navigate('/auth');
              }}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <Users className="w-5 h-5 text-primary mb-2" />
            <span className="text-xs text-muted-foreground text-center">Multi-User Chat</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <FileText className="w-5 h-5 text-primary mb-2" />
            <span className="text-xs text-muted-foreground text-center">Live Document</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Sparkles className="w-5 h-5 text-synapse-ai mb-2" />
            <span className="text-xs text-muted-foreground text-center">AI Assistant</span>
          </div>
        </div>

        {/* Join Form */}
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Your Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-secondary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Room ID
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    className="bg-secondary/50 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateRoomId}
                    className="shrink-0"
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="glow"
              className="w-full mt-6"
              disabled={!isConnected || !roomId.trim() || !username.trim()}
            >
              {isConnected ? (
                <>
                  <Zap className="w-4 h-4" />
                  Join Workspace
                </>
              ) : (
                'Connecting...'
              )}
            </Button>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-synapse-success' : 'bg-synapse-warning animate-pulse'}`} />
            <span className="text-muted-foreground">
              {isConnected ? 'Connected to server' : 'Connecting to server...'}
            </span>
          </div>
        </form>

        {/* Tip */}
        <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          💡 Tip: Use <code className="px-1.5 py-0.5 rounded bg-secondary font-mono">/ai</code> in chat to invoke AI assistance
        </p>

        {/* View History Button */}
        <Button
          type="button"
          variant="ghost"
          className="w-full mt-4 text-muted-foreground hover:text-foreground animate-fade-in"
          style={{ animationDelay: '0.6s' }}
          onClick={() => navigate('/history')}
        >
          <Clock className="w-4 h-4 mr-2" />
          View Room History
        </Button>
      </div>
    </div>
  );
}
