// src/components/AudioPlayer.tsx
import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from './ui/Button';
import { supabase } from '@/lib/supabase';

interface AudioPlayerProps {
  filePath: string;
  callId: string; // Add callId prop
}

export default function AudioPlayer({ filePath, callId }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const durationUpdated = useRef(false);

  const fetchAudioUrl = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('call-recordings')
        .createSignedUrl(filePath, 900); // 15 minutes expiry

      if (error) throw error;
      if (data?.signedUrl) {
        setAudioUrl(data.signedUrl);
        setError(null);
      }
    } catch (error) {
      console.error('Error getting audio URL:', error);
      setError('Failed to load audio');
    }
  };

  useEffect(() => {
    fetchAudioUrl();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setAudioUrl('');
      durationUpdated.current = false;
    };
  }, [filePath]);

  const updateDurationInDB = async (duration: number) => {
    try {
      const { error } = await supabase
        .from('calls')
        .update({ duration: Math.round(duration) })
        .eq('id', callId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating duration:', error);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;
      setDuration(audioDuration);

      // Only update duration in DB once per component instance
      if (!durationUpdated.current) {
        updateDurationInDB(audioDuration);
        durationUpdated.current = true;
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleError = async () => {
    if (
      audioRef.current?.error?.code ===
        MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ||
      audioRef.current?.error?.code === MediaError.MEDIA_ERR_NETWORK
    ) {
      await fetchAudioUrl();
    }
  };

  const togglePlay = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          if (audioRef.current.error) {
            await fetchAudioUrl();
          }
          await audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      } catch (error) {
        console.error('Playback error:', error);
        await fetchAudioUrl();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  return (
    <div className="flex items-center space-x-2">
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onError={handleError}
      />
      <Button
        variant="ghost"
        size="sm"
        className="p-1"
        onClick={togglePlay}
        disabled={!audioUrl}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      <div className="flex-1 flex items-center space-x-2">
        <div className="text-xs text-gray-500 w-10">
          {formatTime(currentTime)}
        </div>
        <div className="flex-1 h-1 bg-gray-200 rounded-full">
          <div
            className="h-full bg-blue-600 rounded-full"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 w-10">{formatTime(duration)}</div>
      </div>
    </div>
  );
}
