import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Users, FileText, Sparkles } from 'lucide-react';

interface RoomJoinProps {
  onJoin: (roomId: string, username: string) => void;
  isConnected: boolean;
}

export function RoomJoin({ onJoin, isConnected }: RoomJoinProps) {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');

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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4 synapse-glow">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground synapse-glow-text">
            Synapse
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-Time Collaborative AI Workspace
          </p>
        </div>

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
      </div>
    </div>
  );
}
