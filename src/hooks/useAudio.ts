import { useState, useEffect, useRef } from 'react';
import { Song } from '../types';

export function useAudio(song: Song | null, volume: number, onEnded?: () => void) {
  const [audio] = useState(() => new Audio());
  const audioRef = useRef<HTMLAudioElement>(audio);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onTimeUpdate = () => setProgress(a.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onEndedRef.current) onEndedRef.current();
    };

    a.addEventListener('timeupdate', onTimeUpdate);
    a.addEventListener('ended', handleEnded);

    return () => {
      a.pause();
      a.src = '';
      a.removeEventListener('timeupdate', onTimeUpdate);
      a.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    if (!song || song.isExternal) {
      a.pause();
      return;
    }

    const loadAudio = async () => {
      let url = song.audioUrl;
      
      // Check Cache API for offline version
      try {
        const cache = await caches.open('melodify-audio-v1');
        const cachedResponse = await cache.match(url);
        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          url = URL.createObjectURL(blob);
        }
      } catch (e) {
        console.warn("Failed to check cache for audio:", e);
      }

      if (a.src !== url) {
        // Revoke old blob URL if it exists
        if (a.src.startsWith('blob:')) {
          URL.revokeObjectURL(a.src);
        }
        
        a.src = url;
        setProgress(0);
        if (isPlaying) {
          a.play().catch(err => console.error("Playback failed on src change:", err));
        }
      }
    };

    loadAudio();

    return () => {
      if (a.src.startsWith('blob:')) {
        URL.revokeObjectURL(a.src);
      }
    };
  }, [song]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !song || song.isExternal) return;

    if (isPlaying) {
      const playPromise = a.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Playback failed on state change:", error);
          setIsPlaying(false);
        });
      }
    } else {
      a.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggle = () => {
    setIsPlaying(prev => !prev);
  };

  const seek = (time: number) => {
    setProgress(time);
    if (!song?.isExternal && audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  return { isPlaying, progress, toggle, seek, setIsPlaying };
}
