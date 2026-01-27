import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    Video, VideoOff, Mic, MicOff, PhoneOff, Phone,
    Maximize2, Minimize2, MonitorUp, Users, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Peer from 'simple-peer';
import { Socket } from 'socket.io-client';

interface VideoUser {
    id: string;
    username: string;
}

interface PeerConnection {
    peerId: string;
    peer: Peer.Instance;
    stream?: MediaStream;
    username: string;
}

interface VideoPanelProps {
    socket: Socket | null;
    roomId: string | null;
    currentUser: string;
    onJoinVideo: () => void;
    onLeaveVideo: () => void;
    onSendSignal: (targetId: string, signal: unknown) => void;
}

export function VideoPanel({
    socket,
    roomId,
    currentUser,
    onJoinVideo,
    onLeaveVideo,
    onSendSignal,
}: VideoPanelProps) {
    const [isInCall, setIsInCall] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [videoUsers, setVideoUsers] = useState<VideoUser[]>([]);
    const [peers, setPeers] = useState<PeerConnection[]>([]);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<PeerConnection[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const isInCallRef = useRef(false); // Ref to track call state in closures

    // Get local media stream
    const getLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            localStreamRef.current = stream;
            return stream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            // Try video only if audio fails
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });
                localStreamRef.current = stream;
                setIsMicOn(false);
                return stream;
            } catch (e) {
                console.error('Error accessing camera:', e);
                return null;
            }
        }
    }, []);

    // Sync local video element with stream
    useEffect(() => {
        if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
        }
    });

    // Create peer connection
    const createPeer = useCallback((targetId: string, targetName: string, stream: MediaStream, initiator: boolean) => {
        console.log(`Creating peer for ${targetName}, initiator: ${initiator}`);
        const peer = new Peer({
            initiator,
            trickle: false,
            stream,
        });

        peer.on('signal', (signal) => {
            console.log(`Sending signal to ${targetId}`);
            onSendSignal(targetId, signal);
        });

        peer.on('stream', (remoteStream) => {
            console.log(`Received stream from ${targetName}`);
            setPeers(prev => prev.map(p =>
                p.peerId === targetId ? { ...p, stream: remoteStream } : p
            ));
        });

        peer.on('connect', () => {
            console.log(`Connected to ${targetName}`);
        });

        peer.on('error', (err) => {
            console.error('Peer error:', err);
        });

        return peer;
    }, [onSendSignal]);

    // Join video call
    const handleJoinCall = useCallback(async () => {
        console.log('Joining video call... socket:', socket ? 'exists' : 'null', 'roomId:', roomId);

        if (!socket) {
            console.error('Socket is null!');
            alert('Connection error - please refresh the page');
            return;
        }

        const stream = await getLocalStream();
        if (!stream) {
            console.error('Failed to get local stream - camera/mic permission denied?');
            alert('Camera access denied. Please allow camera permissions and try again.');
            return;
        }
        console.log('Got local stream, tracks:', stream.getTracks().map(t => t.kind).join(', '));

        // Set ref BEFORE calling onJoinVideo so socket handlers see it
        isInCallRef.current = true;
        setIsInCall(true);
        setIsExpanded(true);
        console.log('Calling onJoinVideo...');
        onJoinVideo();
        console.log('onJoinVideo called');
    }, [getLocalStream, onJoinVideo, socket, roomId]);

    // Leave video call
    const handleLeaveCall = useCallback(() => {
        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        // Close all peer connections
        peersRef.current.forEach(({ peer }) => peer.destroy());
        peersRef.current = [];
        setPeers([]);

        isInCallRef.current = false;
        setIsInCall(false);
        setIsExpanded(false);
        setIsFullscreen(false);
        setVideoUsers([]);
        onLeaveVideo();
    }, [onLeaveVideo]);

    // Toggle camera
    const toggleCamera = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOn(videoTrack.enabled);
            }
        }
    }, []);

    // Toggle microphone
    const toggleMic = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicOn(audioTrack.enabled);
            }
        }
    }, []);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        // Receive list of existing video users (when I join, I become initiator to all existing users)
        socket.on('video-users', ({ users }: { users: VideoUser[] }) => {
            console.log('Received video users:', users, 'isInCallRef:', isInCallRef.current);
            setVideoUsers(users);

            // I'm the new joiner - I initiate connections to all existing users
            if (isInCallRef.current && localStreamRef.current) {
                users.forEach(user => {
                    const existingPeer = peersRef.current.find(p => p.peerId === user.id);
                    if (!existingPeer) {
                        console.log(`I'm initiating connection to ${user.username}`);
                        const peer = createPeer(user.id, user.username, localStreamRef.current!, true);
                        const peerConnection = { peerId: user.id, peer, username: user.username };
                        peersRef.current.push(peerConnection);
                        setPeers(prev => [...prev, peerConnection]);
                    }
                });
            }
        });

        // New user joined video (they will initiate to me, so I don't create peer yet)
        socket.on('video-user-joined', ({ userId, username }: { userId: string; username: string }) => {
            console.log('New video user joined:', username, '- waiting for their signal');
            setVideoUsers(prev => [...prev.filter(u => u.id !== userId), { id: userId, username }]);
            // Don't create peer here - wait for their signal
        });

        // Receive WebRTC signal
        socket.on('video-signal', ({ callerId, callerName, signal }: { callerId: string; callerName: string; signal: unknown }) => {
            console.log(`Received signal from ${callerName}, isInCallRef:`, isInCallRef.current);
            const existingPeer = peersRef.current.find(p => p.peerId === callerId);

            if (existingPeer) {
                console.log(`Signaling existing peer ${callerName}`);
                existingPeer.peer.signal(signal as Peer.SignalData);
            } else if (isInCallRef.current && localStreamRef.current) {
                // Someone initiated to me - create peer and signal back
                console.log(`Creating peer for ${callerName} who initiated to me`);
                const peer = createPeer(callerId, callerName, localStreamRef.current!, false);
                peer.signal(signal as Peer.SignalData);
                const peerConnection = { peerId: callerId, peer, username: callerName };
                peersRef.current.push(peerConnection);
                setPeers(prev => [...prev, peerConnection]);
            } else {
                console.log(`Ignoring signal - not in call or no stream`);
            }
        });

        // User left video
        socket.on('video-user-left', ({ userId }: { userId: string }) => {
            console.log('Video user left:', userId);
            setVideoUsers(prev => prev.filter(u => u.id !== userId));

            // Remove peer connection
            const peerIndex = peersRef.current.findIndex(p => p.peerId === userId);
            if (peerIndex !== -1) {
                peersRef.current[peerIndex].peer.destroy();
                peersRef.current.splice(peerIndex, 1);
                setPeers(prev => prev.filter(p => p.peerId !== userId));
            }
        });

        return () => {
            socket.off('video-users');
            socket.off('video-user-joined');
            socket.off('video-signal');
            socket.off('video-user-left');
        };
    }, [socket, createPeer]); // Removed isInCall from deps - using ref instead

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            peersRef.current.forEach(({ peer }) => peer.destroy());
        };
    }, []);

    // Minimized card view
    if (!isExpanded) {
        return (
            <div className="bg-card/50 border-t border-border p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Video className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-medium text-sm">Video Call</h3>
                            <p className="text-xs text-muted-foreground">
                                {videoUsers.length > 0 ? `${videoUsers.length} in call` : 'No active call'}
                            </p>
                        </div>
                    </div>

                    {!isInCall ? (
                        <Button size="sm" onClick={handleJoinCall} className="gap-2">
                            <Phone className="w-4 h-4" />
                            Join Call
                        </Button>
                    ) : (
                        <Button size="sm" variant="ghost" onClick={() => setIsExpanded(true)}>
                            <Maximize2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    // Expanded view (inline or fullscreen)
    const videoContent = (
        <div
            ref={containerRef}
            className={cn(
                "bg-card/95 flex flex-col",
                isFullscreen
                    ? "fixed inset-0 z-50"
                    : "border-t border-border",
                !isFullscreen && "h-[300px]"
            )}
        >
            {/* Header */}
            <div className="p-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Video Call</span>
                    <span className="text-xs text-muted-foreground">
                        ({peers.length + 1} participants)
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                    {!isFullscreen && (
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsExpanded(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Video Grid */}
            <div className="flex-1 p-4 overflow-auto bg-background/50">
                <div className={cn(
                    "grid gap-3 h-full",
                    peers.length === 0 && "grid-cols-1",
                    peers.length === 1 && "grid-cols-2",
                    peers.length === 2 && "grid-cols-2 lg:grid-cols-3",
                    peers.length >= 3 && "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                )}>
                    {/* Local Video */}
                    <div className={cn(
                        "relative bg-secondary rounded-lg overflow-hidden",
                        isFullscreen ? "min-h-[200px]" : "min-h-[100px]"
                    )}>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className={cn(
                                "w-full h-full object-cover",
                                !isCameraOn && "hidden"
                            )}
                        />
                        {!isCameraOn && (
                            <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                                <div className={cn(
                                    "rounded-full bg-primary/20 flex items-center justify-center",
                                    isFullscreen ? "w-20 h-20" : "w-12 h-12"
                                )}>
                                    <span className={cn("font-bold", isFullscreen ? "text-3xl" : "text-lg")}>
                                        {currentUser.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className={cn(
                            "absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded",
                            isFullscreen ? "text-sm" : "text-xs"
                        )}>
                            You {!isMicOn && '🔇'}
                        </div>
                    </div>

                    {/* Remote Videos */}
                    {peers.map((peerConnection) => (
                        <div
                            key={peerConnection.peerId}
                            className={cn(
                                "relative bg-secondary rounded-lg overflow-hidden",
                                isFullscreen ? "min-h-[200px]" : "min-h-[100px]"
                            )}
                        >
                            <video
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                                ref={(video) => {
                                    if (video && peerConnection.stream) {
                                        video.srcObject = peerConnection.stream;
                                    }
                                }}
                            />
                            <div className={cn(
                                "absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded",
                                isFullscreen ? "text-sm" : "text-xs"
                            )}>
                                {peerConnection.username}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className={cn(
                "p-3 border-t border-border flex items-center justify-center gap-3",
                isFullscreen && "p-4 gap-4"
            )}>
                <Button
                    size={isFullscreen ? "default" : "icon"}
                    variant={isMicOn ? "secondary" : "destructive"}
                    onClick={toggleMic}
                    title={isMicOn ? "Mute" : "Unmute"}
                    className={isFullscreen ? "gap-2" : ""}
                >
                    {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    {isFullscreen && (isMicOn ? "Mute" : "Unmute")}
                </Button>

                <Button
                    size={isFullscreen ? "default" : "icon"}
                    variant={isCameraOn ? "secondary" : "destructive"}
                    onClick={toggleCamera}
                    title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                    className={isFullscreen ? "gap-2" : ""}
                >
                    {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    {isFullscreen && (isCameraOn ? "Stop Video" : "Start Video")}
                </Button>

                <Button
                    size={isFullscreen ? "default" : "icon"}
                    variant="destructive"
                    onClick={handleLeaveCall}
                    title="Leave call"
                    className={isFullscreen ? "gap-2" : ""}
                >
                    <PhoneOff className="w-4 h-4" />
                    {isFullscreen && "Leave Call"}
                </Button>
            </div>
        </div>
    );

    return videoContent;
}
