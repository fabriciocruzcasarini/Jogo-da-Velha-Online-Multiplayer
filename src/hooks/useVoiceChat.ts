import { useState, useRef, useEffect, useCallback } from 'react';

interface UseVoiceChatProps {
  roomId?: string;
  myPlayerId?: string | null;
  targetPlayerId?: string | null;
  isRoomActive: boolean;
  sendSignal: (targetPlayerId: string | null, signal: any) => void;
  sendVoiceStatus: (isMuted: boolean, isSpeaking: boolean) => void;
  onSignal: (callback: (data: { senderPlayerId: string; signal: any }) => void) => () => void;
  remoteVoiceStatus?: { isMuted: boolean; isSpeaking: boolean };
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useVoiceChat({
  roomId,
  myPlayerId,
  targetPlayerId,
  isRoomActive,
  sendSignal,
  sendVoiceStatus,
  onSignal,
  remoteVoiceStatus,
}: UseVoiceChatProps) {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);
  const [isSpeakingRemote, setIsSpeakingRemote] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Audio analysis for speech detection
  const audioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Synchronize remote speaking status
  useEffect(() => {
    if (remoteVoiceStatus) {
      if (remoteVoiceStatus.isSpeaking !== undefined) {
        setIsSpeakingRemote(remoteVoiceStatus.isSpeaking && !remoteVoiceStatus.isMuted);
      }
    }
  }, [remoteVoiceStatus]);

  // Clean up WebRTC peer connection and streams
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setIsVoiceActive(false);
    setIsSpeakingLocal(false);
    setIsSpeakingRemote(false);
  }, []);

  // Monitor speaking levels with AnalyserNode
  const startAudioAnalysis = useCallback(() => {
    const checkAudioLevel = () => {
      // Check local audio
      if (localAnalyserRef.current && localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack && audioTrack.enabled) {
          const buffer = new Uint8Array(localAnalyserRef.current.frequencyBinCount);
          localAnalyserRef.current.getByteFrequencyData(buffer);
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i];
          }
          const average = sum / buffer.length;
          const isSpeaking = average > 14;
          setIsSpeakingLocal((prev) => {
            if (prev !== isSpeaking) {
              sendVoiceStatus(isMuted, isSpeaking);
            }
            return isSpeaking;
          });
        } else {
          setIsSpeakingLocal(false);
        }
      }

      // Check remote audio directly if available
      if (remoteAnalyserRef.current && remoteAudioRef.current?.srcObject) {
        const buffer = new Uint8Array(remoteAnalyserRef.current.frequencyBinCount);
        remoteAnalyserRef.current.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const average = sum / buffer.length;
        if (average > 14) {
          setIsSpeakingRemote(true);
        } else if (!remoteVoiceStatus?.isSpeaking) {
          setIsSpeakingRemote(false);
        }
      }

      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };

    animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
  }, [isMuted, remoteVoiceStatus, sendVoiceStatus]);

  // Start voice chat session
  const startVoice = useCallback(async () => {
    setPermissionError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError('Navegador não suporta acesso ao microfone.');
        return;
      }

      // Request microphone with echo cancellation and noise suppression
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localStreamRef.current = stream;

      // Audio context for speech level detection
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      localAnalyserRef.current = analyser;

      // Create PeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add local stream tracks to PeerConnection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(targetPlayerId || null, {
            type: 'candidate',
            candidate: event.candidate,
          });
        }
      };

      // Handle remote audio stream
      pc.ontrack = (event) => {
        if (!remoteAudioRef.current) {
          const audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          (audioEl as any).playsInline = true;
          document.body.appendChild(audioEl);
          remoteAudioRef.current = audioEl;
        }

        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch(() => {
          // Auto-play policy on mobile may require tap
        });

        // Attach analyser to remote stream
        if (audioContextRef.current && event.streams[0]) {
          try {
            const remoteSource = audioContextRef.current.createMediaStreamSource(event.streams[0]);
            const remoteAnalyser = audioContextRef.current.createAnalyser();
            remoteAnalyser.fftSize = 128;
            remoteAnalyser.smoothingTimeConstant = 0.4;
            remoteSource.connect(remoteAnalyser);
            remoteAnalyserRef.current = remoteAnalyser;
          } catch {
            // ignore
          }
        }
      };

      // If we are initiator (target player is already in room), create offer
      if (targetPlayerId) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal(targetPlayerId, {
          type: 'offer',
          sdp: offer,
        });
      }

      setIsVoiceActive(true);
      setIsMuted(false);
      startAudioAnalysis();
    } catch (err: any) {
      console.error('Error starting voice chat:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Permissão de microfone negada. Habilite nas configurações do navegador.');
      } else {
        setPermissionError('Não foi possível conectar ao microfone.');
      }
    }
  }, [targetPlayerId, sendSignal, startAudioAnalysis]);

  // Handle incoming WebRTC signals
  useEffect(() => {
    const unsubscribe = onSignal(async ({ senderPlayerId, signal }) => {
      try {
        if (!peerConnectionRef.current && isVoiceActive) {
          return;
        }

        if (signal.type === 'offer') {
          // If receiver hasn't started voice yet, automatically answer if active
          let pc = peerConnectionRef.current;
          if (!pc) {
            // Need to initialize local stream first
            await startVoice();
            pc = peerConnectionRef.current;
          }

          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal(senderPlayerId, {
              type: 'answer',
              sdp: answer,
            });
          }
        } else if (signal.type === 'answer') {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          }
        } else if (signal.type === 'candidate') {
          if (peerConnectionRef.current && signal.candidate) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        }
      } catch (err) {
        console.error('Error processing WebRTC signal:', err);
      }
    });

    return unsubscribe;
  }, [onSignal, isVoiceActive, startVoice, sendSignal]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const nextMuted = !isMuted;
        audioTrack.enabled = !nextMuted;
        setIsMuted(nextMuted);
        setIsSpeakingLocal(false);
        sendVoiceStatus(nextMuted, false);
      }
    }
  }, [isMuted, sendVoiceStatus]);

  // Cleanup on room exit
  useEffect(() => {
    if (!isRoomActive) {
      cleanup();
    }
  }, [isRoomActive, cleanup]);

  // Destroy on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isVoiceActive,
    isMuted,
    isSpeakingLocal,
    isSpeakingRemote,
    permissionError,
    startVoice,
    toggleMute,
    leaveVoice: cleanup,
    clearPermissionError: () => setPermissionError(null),
  };
}
