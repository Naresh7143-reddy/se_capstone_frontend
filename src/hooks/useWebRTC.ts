import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';

export interface RemotePeer {
  socketId: string;
  name: string;
  stream: MediaStream;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/**
 * WebRTC mesh: every participant connects to every other participant.
 * Great for small classes; for large rooms an SFU/media server would be needed.
 */
export function useWebRTC(roomId: string, userName: string, enabled: boolean) {
  const socketRef = useRef(getSocket());
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const namesRef = useRef<Record<string, string>>({});
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const [selfStream, setSelfStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, RemotePeer>>({});
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');

  // Create or fetch a peer connection for a given remote socket id.
  const createPeer = useCallback((socketId: string, isInitiator: boolean) => {
    if (pcsRef.current[socketId]) return pcsRef.current[socketId];

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcsRef.current[socketId] = pc;

    // Add our current local tracks.
    const local = cameraStreamRef.current;
    if (local) local.getTracks().forEach((t) => pc.addTrack(t, local));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit('rtc:signal', {
          to: socketId,
          data: { candidate: e.candidate },
        });
      }
    };

    pc.ontrack = (e) => {
      const [stream] = e.streams;
      setPeers((prev) => ({
        ...prev,
        [socketId]: { socketId, name: namesRef.current[socketId] || 'Guest', stream },
      }));
    };

    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current.emit('rtc:signal', {
            to: socketId,
            data: { sdp: pc.localDescription },
          });
        } catch (err) {
          /* ignore transient negotiation errors */
        }
      };
    }

    return pc;
  }, []);

  // Main lifecycle: start media + signaling when enabled.
  useEffect(() => {
    if (!enabled) return;
    const socket = socketRef.current;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        cameraStreamRef.current = stream;
        setSelfStream(stream);

        socket.emit('rtc:join', { room_id: roomId, user_id: socket.id, user_name: userName });
      } catch (err: any) {
        setError(err?.message || 'Could not access camera/microphone');
      }
    })();

    // Existing peers (we wait for their offers, but pre-store names).
    const onPeers = (list: { socket_id: string; user_name: string }[]) => {
      list.forEach((p) => {
        namesRef.current[p.socket_id] = p.user_name;
      });
    };

    // A newcomer arrived -> we initiate an offer to them.
    const onPeerJoined = ({ socket_id, user_name }: { socket_id: string; user_name: string }) => {
      namesRef.current[socket_id] = user_name;
      createPeer(socket_id, true);
    };

    const onSignal = async ({ from, data }: { from: string; data: any }) => {
      let pc = pcsRef.current[from];
      if (!pc) pc = createPeer(from, false);

      if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('rtc:signal', { to: from, data: { sdp: pc.localDescription } });
        }
      } else if (data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch {
          /* ignore */
        }
      }
    };

    const onPeerLeft = ({ socket_id }: { socket_id: string }) => {
      pcsRef.current[socket_id]?.close();
      delete pcsRef.current[socket_id];
      setPeers((prev) => {
        const next = { ...prev };
        delete next[socket_id];
        return next;
      });
    };

    socket.on('rtc:peers', onPeers);
    socket.on('rtc:peer-joined', onPeerJoined);
    socket.on('rtc:signal', onSignal);
    socket.on('rtc:peer-left', onPeerLeft);

    return () => {
      cancelled = true;
      socket.emit('rtc:leave');
      socket.off('rtc:peers', onPeers);
      socket.off('rtc:peer-joined', onPeerJoined);
      socket.off('rtc:signal', onSignal);
      socket.off('rtc:peer-left', onPeerLeft);
      Object.values(pcsRef.current).forEach((pc) => pc.close());
      pcsRef.current = {};
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
      setPeers({});
      setSelfStream(null);
    };
  }, [enabled, roomId, userName, createPeer]);

  const toggleMic = useCallback(() => {
    const track = cameraStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  }, []);

  const toggleCam = useCallback(() => {
    const track = cameraStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  }, []);

  // Replace the outgoing video track on every peer connection.
  const replaceVideoTrack = useCallback((track: MediaStreamTrack) => {
    Object.values(pcsRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(track);
    });
  }, []);

  const shareScreen = useCallback(async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screen;
      const screenTrack = screen.getVideoTracks()[0];
      replaceVideoTrack(screenTrack);

      // Show screen in our own tile too.
      const preview = new MediaStream([
        screenTrack,
        ...(cameraStreamRef.current?.getAudioTracks() || []),
      ]);
      setSelfStream(preview);
      setSharing(true);

      screenTrack.onended = () => stopShare();
    } catch (err) {
      /* user cancelled the picker */
    }
  }, [replaceVideoTrack]);

  const stopShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    const camTrack = cameraStreamRef.current?.getVideoTracks()[0];
    if (camTrack) replaceVideoTrack(camTrack);
    setSelfStream(cameraStreamRef.current);
    setSharing(false);
  }, [replaceVideoTrack]);

  return {
    selfStream,
    peers,
    micOn,
    camOn,
    sharing,
    error,
    toggleMic,
    toggleCam,
    shareScreen,
    stopShare,
  };
}
