export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: number; // in seconds
  audioUrl: string;
  isOfflineAvailable?: boolean;
  isExternal?: boolean;
  reason?: string;
  releaseDate?: string;
  genre?: string;
}

export interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  ownerId: string;
  createdAt: number;
}

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  queue: Song[];
}
