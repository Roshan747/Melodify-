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

    if (a.src !== song.audioUrl) {
      a.src = song.audioUrl;
      setProgress(0);
      if (isPlaying) {
        a.play().catch(err => console.error("Playback failed on src change:", err));
      }
    }
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
