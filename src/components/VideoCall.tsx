import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorX,
  PhoneOff,
} from 'lucide-react';
import { useWebRTC, type RemotePeer } from '@/hooks/useWebRTC';
import { cn } from '@/lib/cn';

function Tile({
  stream,
  name,
  muted,
  highlight,
  badge,
}: {
  stream: MediaStream | null;
  name: string;
  muted?: boolean;
  highlight?: boolean;
  badge?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div
      className={cn(
        'relative aspect-video overflow-hidden rounded-xl border bg-black',
        highlight ? 'border-primary ring-2 ring-primary/40' : 'border-border'
      )}
    >
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className="h-full w-full object-cover"
      />
      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
        {name}
        {badge && <span className="rounded bg-primary px-1 text-[10px]">{badge}</span>}
      </div>
    </div>
  );
}

interface VideoCallProps {
  roomId: string;
  userName: string;
  onLeave: () => void;
}

export function VideoCall({ roomId, userName, onLeave }: VideoCallProps) {
  const {
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
  } = useWebRTC(roomId, userName, true);

  const remote = Object.values(peers) as RemotePeer[];

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="border-b border-border bg-surface/60 backdrop-blur"
    >
      <div className="p-3">
        {error && (
          <p className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {error} — check camera/mic permissions.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <Tile
            stream={selfStream}
            name={`${userName} (you)`}
            muted
            highlight
            badge={sharing ? 'Sharing' : undefined}
          />
          {remote.map((p) => (
            <Tile key={p.socketId} stream={p.stream} name={p.name} />
          ))}
        </div>

        {/* Controls */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={toggleMic}
            className={cn(
              'grid h-11 w-11 place-items-center rounded-full transition',
              micOn ? 'bg-surface text-fg hover:bg-border' : 'bg-red-500 text-white'
            )}
            title={micOn ? 'Mute' : 'Unmute'}
          >
            {micOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
          <button
            onClick={toggleCam}
            className={cn(
              'grid h-11 w-11 place-items-center rounded-full transition',
              camOn ? 'bg-surface text-fg hover:bg-border' : 'bg-red-500 text-white'
            )}
            title={camOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {camOn ? <Video size={18} /> : <VideoOff size={18} />}
          </button>
          <button
            onClick={sharing ? stopShare : shareScreen}
            className={cn(
              'grid h-11 w-11 place-items-center rounded-full transition',
              sharing ? 'bg-primary text-primary-fg' : 'bg-surface text-fg hover:bg-border'
            )}
            title={sharing ? 'Stop sharing' : 'Share screen'}
          >
            {sharing ? <MonitorX size={18} /> : <MonitorUp size={18} />}
          </button>
          <button
            onClick={onLeave}
            className="grid h-11 w-11 place-items-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
            title="Leave call"
          >
            <PhoneOff size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
