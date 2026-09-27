export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  year?: string;
  genre?: string;
  duration: number; // in seconds
  format: AudioFormat;
  audioUrl: string; // server streaming URL
  coverUrl?: string; // image URL
  coverFileName?: string;
  audioFileName?: string;
  fileSize: number;
  uploadedBy?: string;
  createdAt: string;
  playCount: number;
  isOfflineCached?: boolean;
}

export interface Album {
  title: string;
  artist: string;
  coverUrl?: string;
  year?: string;
  trackCount: number;
  totalDuration: number;
  tracks: Track[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl?: string;
  trackIds: string[];
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'listener';
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface CustomTheme {
  accentColor: string; // hex
  fontFamily: 'serif' | 'sans' | 'cinzel';
  backgroundVibe: 'blood-noir' | 'obsidian' | 'crimson-abyss';
  visualizerType: 'bars' | 'wave' | 'off';
  uiDensity: 'compact' | 'comfortable';
}
