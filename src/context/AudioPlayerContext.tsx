import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Track, RepeatMode, Album, Playlist } from '../types';
import {
  saveAudioBlobToDB,
  getAudioBlobFromDB,
  getOfflineCachedTrackIds,
  removeAudioBlobFromDB,
  getFavoritesFromDB,
  toggleFavoriteInDB,
  getLocalPlaylistsFromDB,
  saveLocalPlaylistToDB,
  deleteLocalPlaylistFromDB,
} from '../utils/indexedDB';
import { useAuth } from './AuthContext';

interface AudioPlayerContextType {
  // Track lists & state
  tracks: Track[];
  albums: Album[];
  playlists: Playlist[];
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  isOnline: boolean;
  offlineTrackIds: Set<string>;
  favorites: Set<string>;

  // Queue
  queue: Track[];
  queueIndex: number;
  playTrack: (track: Track, customQueue?: Track[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  setVolumeLevel: (level: number) => void;
  toggleMute: () => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;

  // Track & Cache management
  refreshLibrary: () => Promise<void>;
  toggleFavorite: (trackId: string) => Promise<void>;
  cacheTrackOffline: (track: Track) => Promise<void>;
  removeOfflineCache: (trackId: string) => Promise<void>;
  downloadTrack: (track: Track) => Promise<void>;
  deleteTrack: (track: Track) => Promise<boolean>;
  updateTrackMetadata: (id: string, updates: Partial<Track> & { coverBase64?: string }) => Promise<boolean>;

  // Playlists
  createPlaylist: (name: string, description?: string) => Promise<Playlist | null>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;

  // Audio Visualizer data (for spectrum bars)
  audioAnalyser: AnalyserNode | null;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isOwner } = useAuth();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [buffered, setBuffered] = useState<number>(0);
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('sonora_volume');
    return saved !== null ? Number(saved) : 0.85;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(() => {
    return (localStorage.getItem('sonora_repeat') as RepeatMode) || 'off';
  });
  const [isShuffled, setIsShuffled] = useState<boolean>(() => {
    return localStorage.getItem('sonora_shuffle') === 'true';
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineTrackIds, setOfflineTrackIds] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Audio elements & Web Audio API
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);
  const playLoggedRef = useRef<boolean>(false);

  // Initialize Audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Log play count after 15 seconds
      if (audio.currentTime > 15 && !playLoggedRef.current && currentTrack) {
        playLoggedRef.current = true;
        fetch(`/api/tracks/${currentTrack.id}/played`, { method: 'POST' }).catch(() => {});
      }
    };

    const handleDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const handleProgress = () => {
      if (audio.buffered.length > 0 && audio.duration > 0) {
        const buffEnd = audio.buffered.end(audio.buffered.length - 1);
        setBuffered((buffEnd / audio.duration) * 100);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
    };
  }, []);

  // Web Audio Context setup (only on user interaction to comply with autoplay policy)
  const setupAudioContext = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
    } catch {
      // Audio context might fail on cross-origin without CORS, fallback silently
    }
  }, []);

  // Fetch library tracks strictly from server library (uploaded by admin)
  const refreshLibrary = useCallback(async () => {
    try {
      // 1. Get offline cached keys (for server tracks cached locally by user)
      const cachedIds = await getOfflineCachedTrackIds();
      setOfflineTrackIds(cachedIds);

      // 2. Get favorites
      const favs = await getFavoritesFromDB();
      setFavorites(new Set(favs));

      // 3. Get server tracks uploaded by admin
      let serverTracks: Track[] = [];
      try {
        const res = await fetch('/api/tracks');
        if (res.ok) {
          const data = await res.json();
          serverTracks = (data.tracks || []).map((t: Track) => ({
            ...t,
            audioUrl: `/api/tracks/${t.id}/audio`,
            coverUrl: t.coverFileName ? `/media/covers/${t.coverFileName}` : undefined,
            isOfflineCached: cachedIds.has(t.id),
          }));
        }
      } catch {
        // offline
      }

      setTracks(serverTracks);

      // 4. Get playlists (server + local listener playlists)
      let combinedPlaylists: Playlist[] = [];
      try {
        const pRes = await fetch('/api/playlists', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          combinedPlaylists = pData.playlists || [];
        }
      } catch {
        // offline
      }

      const localPlaylists = await getLocalPlaylistsFromDB();
      const sIds = new Set(combinedPlaylists.map((p) => p.id));
      const allPlaylists = [
        ...combinedPlaylists,
        ...localPlaylists.filter((p) => !sIds.has(p.id)),
      ];
      setPlaylists(allPlaylists);
    } catch (err) {
      console.error('Failed to refresh library:', err);
    }
  }, [token]);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Play track implementation
  const playTrack = useCallback(
    async (track: Track, customQueue?: Track[]) => {
      if (!audioRef.current) return;
      setupAudioContext();

      // Revoke prior blob URL if needed
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }

      playLoggedRef.current = false;
      setCurrentTrack(track);

      // Determine queue
      let newQueue = customQueue || (queue.length > 0 ? queue : tracks);
      if (!newQueue.some((t) => t.id === track.id)) {
        newQueue = [track, ...newQueue];
      }
      setQueue(newQueue);
      setQueueIndex(newQueue.findIndex((t) => t.id === track.id));

      // Resolve audio source: Check IndexedDB first for instant offline audio
      let sourceUrl = track.audioUrl;
      try {
        const cachedBlob = await getAudioBlobFromDB(track.id);
        if (cachedBlob) {
          sourceUrl = URL.createObjectURL(cachedBlob);
          activeBlobUrlRef.current = sourceUrl;
        }
      } catch {
        // fallback to server/original url
      }

      audioRef.current.src = sourceUrl;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Playback error or blocked by autoplay:', err);
          setIsPlaying(false);
        });
    },
    [queue, tracks, setupAudioContext]
  );

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!currentTrack && tracks.length > 0) {
        playTrack(tracks[0]);
      } else {
        setupAudioContext();
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  }, [isPlaying, currentTrack, tracks, playTrack, setupAudioContext]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      setupAudioContext();
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  }, [setupAudioContext]);

  const seek = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  }, []);

  const setVolumeLevel = useCallback((level: number) => {
    const val = Math.max(0, Math.min(1, level));
    setVolume(val);
    setIsMuted(false);
    localStorage.setItem('sonora_volume', String(val));
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const playNext = useCallback(() => {
    if (queue.length === 0) return;

    if (repeatMode === 'one' && currentTrack) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    let nextIdx: number;
    if (isShuffled) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = queueIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeatMode === 'all') {
          nextIdx = 0;
        } else {
          // End of queue
          setIsPlaying(false);
          return;
        }
      }
    }

    const nextTrack = queue[nextIdx];
    if (nextTrack) {
      playTrack(nextTrack, queue);
    }
  }, [queue, queueIndex, repeatMode, isShuffled, currentTrack, playTrack]);

  const playPrevious = useCallback(() => {
    if (queue.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = repeatMode === 'all' ? queue.length - 1 : 0;
    }
    const prevTrack = queue[prevIdx];
    if (prevTrack) {
      playTrack(prevTrack, queue);
    }
  }, [queue, queueIndex, repeatMode, playTrack]);

  // Handle track ended event automatically
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      playNext();
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [playNext]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      const next = !prev;
      localStorage.setItem('sonora_shuffle', String(next));
      return next;
    });
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      const next: RepeatMode = prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off';
      localStorage.setItem('sonora_repeat', next);
      return next;
    });
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setQueueIndex(-1);
  }, []);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  // Favorites
  const toggleFavorite = useCallback(async (trackId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      const isFav = !next.has(trackId);
      if (isFav) {
        next.add(trackId);
      } else {
        next.delete(trackId);
      }
      toggleFavoriteInDB(trackId, isFav);
      return next;
    });
  }, []);

  // Offline caching
  const cacheTrackOffline = useCallback(async (track: Track) => {
    try {
      const res = await fetch(track.audioUrl);
      const blob = await res.blob();
      await saveAudioBlobToDB(track.id, blob, track.format);
      setOfflineTrackIds((prev) => new Set(prev).add(track.id));
    } catch (err) {
      console.error('Failed to cache track offline:', err);
    }
  }, []);

  const removeOfflineCache = useCallback(async (trackId: string) => {
    try {
      await removeAudioBlobFromDB(trackId);
      setOfflineTrackIds((prev) => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
    } catch (err) {
      console.error('Failed to remove offline track:', err);
    }
  }, []);

  // Download track in MP3 format (Publicly available to all users: regular & admin)
  const downloadTrack = useCallback(async (track: Track) => {
    try {
      const sanitizedName = `${track.artist} - ${track.title}.mp3`.replace(/[^\w\s.-]/gi, '_');
      const a = document.createElement('a');
      a.href = `/api/tracks/${track.id}/download-mp3`;
      a.download = sanitizedName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, []);

  // Delete track (Strictly Logged In Admin Only)
  const deleteTrack = useCallback(
    async (track: Track): Promise<boolean> => {
      if (!isOwner || !token) {
        console.warn('Action Denied: Only the logged in admin can delete tracks.');
        return false;
      }

      try {
        const res = await fetch(`/api/tracks/${track.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setTracks((prev) => prev.filter((t) => t.id !== track.id));
          setQueue((prev) => prev.filter((t) => t.id !== track.id));
          if (currentTrack?.id === track.id) {
            pause();
            setCurrentTrack(null);
          }
          return true;
        }
      } catch {
        // ignore
      }
      return false;
    },
    [isOwner, token, currentTrack, pause]
  );

  // Update track metadata (Strictly Logged In Admin Only)
  const updateTrackMetadata = useCallback(
    async (id: string, updates: Partial<Track> & { coverBase64?: string }): Promise<boolean> => {
      if (!isOwner || !token) {
        console.warn('Action Denied: Only the logged in admin can edit track metadata.');
        return false;
      }

      try {
        const res = await fetch(`/api/tracks/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          refreshLibrary();
          return true;
        }
      } catch {
        // ignore
      }
      return false;
    },
    [isOwner, token, refreshLibrary]
  );

  // Playlists
  const createPlaylist = useCallback(
    async (name: string, description?: string): Promise<Playlist | null> => {
      try {
        // Try server first
        const res = await fetch('/api/playlists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ name, description }),
        });
        if (res.ok) {
          const data = await res.json();
          setPlaylists((prev) => [...prev, data.playlist]);
          return data.playlist;
        }
      } catch {
        // offline fallback
      }

      const localPl: Playlist = {
        id: 'pl_' + crypto.randomUUID(),
        name,
        description: description || '',
        trackIds: [],
        userId: 'local',
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveLocalPlaylistToDB(localPl);
      setPlaylists((prev) => [...prev, localPl]);
      return localPl;
    },
    [token]
  );

  const addTrackToPlaylist = useCallback(
    async (playlistId: string, trackId: string) => {
      const pl = playlists.find((p) => p.id === playlistId);
      if (!pl) return;
      if (pl.trackIds.includes(trackId)) return;

      const updatedTrackIds = [...pl.trackIds, trackId];

      try {
        await fetch(`/api/playlists/${playlistId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ trackIds: updatedTrackIds }),
        });
      } catch {
        // local
      }

      const updated = { ...pl, trackIds: updatedTrackIds, updatedAt: new Date().toISOString() };
      await saveLocalPlaylistToDB(updated);
      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
    },
    [playlists, token]
  );

  const removeTrackFromPlaylist = useCallback(
    async (playlistId: string, trackId: string) => {
      const pl = playlists.find((p) => p.id === playlistId);
      if (!pl) return;

      const updatedTrackIds = pl.trackIds.filter((id) => id !== trackId);

      try {
        await fetch(`/api/playlists/${playlistId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ trackIds: updatedTrackIds }),
        });
      } catch {
        // local
      }

      const updated = { ...pl, trackIds: updatedTrackIds, updatedAt: new Date().toISOString() };
      await saveLocalPlaylistToDB(updated);
      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
    },
    [playlists, token]
  );

  const deletePlaylist = useCallback(
    async (playlistId: string) => {
      try {
        await fetch(`/api/playlists/${playlistId}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch {
        // local
      }
      await deleteLocalPlaylistFromDB(playlistId);
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    },
    [token]
  );

  // Group tracks dynamically into Albums for the requested "album selector grid"
  const albums: Album[] = React.useMemo(() => {
    const map = new Map<string, Album>();
    tracks.forEach((track) => {
      const albumKey = `${track.album || 'Single'} - ${track.artist}`;
      if (!map.has(albumKey)) {
        map.set(albumKey, {
          title: track.album || 'Single',
          artist: track.artist,
          coverUrl: track.coverUrl,
          year: track.year,
          trackCount: 0,
          totalDuration: 0,
          tracks: [],
        });
      }
      const alb = map.get(albumKey)!;
      alb.tracks.push(track);
      alb.trackCount += 1;
      alb.totalDuration += track.duration || 0;
      if (!alb.coverUrl && track.coverUrl) {
        alb.coverUrl = track.coverUrl;
      }
    });
    return Array.from(map.values());
  }, [tracks]);

  return (
    <AudioPlayerContext.Provider
      value={{
        tracks,
        albums,
        playlists,
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        buffered,
        volume,
        isMuted,
        repeatMode,
        isShuffled,
        isOnline,
        offlineTrackIds,
        favorites,
        queue,
        queueIndex,
        playTrack,
        togglePlay,
        pause,
        resume,
        seek,
        setVolumeLevel,
        toggleMute,
        playNext,
        playPrevious,
        toggleShuffle,
        cycleRepeat,
        addToQueue,
        removeFromQueue,
        clearQueue,
        reorderQueue,
        refreshLibrary,
        toggleFavorite,
        cacheTrackOffline,
        removeOfflineCache,
        downloadTrack,
        deleteTrack,
        updateTrackMetadata,
        createPlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        deletePlaylist,
        audioAnalyser: analyserRef.current,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  return context;
};
