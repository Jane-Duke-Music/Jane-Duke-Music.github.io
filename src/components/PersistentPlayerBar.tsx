import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  ListMusic,
  Download,
  WifiOff,
  Disc,
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { formatTime } from '../utils/audioMetadata';
import { AudioVisualizer } from './AudioVisualizer';

interface PersistentPlayerBarProps {
  onToggleQueue: () => void;
  isQueueOpen: boolean;
}

export const PersistentPlayerBar: React.FC<PersistentPlayerBarProps> = ({
  onToggleQueue,
  isQueueOpen,
}) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    buffered,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    queue,
    togglePlay,
    seek,
    setVolumeLevel,
    toggleMute,
    playNext,
    playPrevious,
    toggleShuffle,
    cycleRepeat,
    favorites,
    toggleFavorite,
    downloadTrack,
    offlineTrackIds,
    cacheTrackOffline,
    removeOfflineCache,
  } = useAudioPlayer();

  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const isFav = currentTrack ? favorites.has(currentTrack.id) : false;
  const isOffline = currentTrack ? offlineTrackIds.has(currentTrack.id) : false;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(pos * duration);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(pos * duration);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 h-24 bg-[#140404]/95 backdrop-blur-md border-t-2 border-[#5c1f1f] shadow-[0_-10px_35px_rgba(0,0,0,0.85)] px-4 md:px-8 flex items-center justify-between">
      {/* Track Info (Left) */}
      <div className="flex items-center gap-3 w-1/4 min-w-[200px] max-w-[340px]">
        {currentTrack ? (
          <>
            <div className="relative group shrink-0">
              <div
                className={`w-14 h-14 rounded-full border-2 border-[#b38b4d] overflow-hidden bg-[#2a0505] shadow-[0_0_15px_rgba(179,139,77,0.4)] flex items-center justify-center ${
                  isPlaying ? 'animate-spin-slow' : ''
                }`}
              >
                {currentTrack.coverUrl ? (
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Disc className="w-8 h-8 text-[#d4af37]" />
                )}
              </div>
              <div className="absolute inset-0 rounded-full border border-[#ffd700]/30 pointer-events-none" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#f5c96a] truncate" title={currentTrack.title}>
                  {currentTrack.title}
                </span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#4a1f1f] text-[#ffd700] border border-[#b38b4d]/50 shrink-0">
                  {currentTrack.format}
                </span>
              </div>
              <p className="text-xs text-[#e8c88a] truncate" title={currentTrack.artist}>
                {currentTrack.artist}
              </p>
              <p className="text-[11px] text-[#b38b4d] truncate italic">
                {currentTrack.album}
              </p>
            </div>

            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className="p-1.5 text-[#b38b4d] hover:text-[#ffd700] hover:scale-110 transition-all shrink-0"
              title={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-4 h-4 ${isFav ? 'fill-[#e5cd15] text-[#ffd700]' : ''}`}
              />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 text-sm text-[#b38b4d]">
            <Disc className="w-8 h-8 opacity-40" />
            <span className="italic">No audio loaded</span>
          </div>
        )}
      </div>

      {/* Main Controls & Progress Bar (Center) */}
      <div className="flex flex-col items-center justify-center flex-1 max-w-2xl px-2 md:px-6">
        {/* Buttons */}
        <div className="flex items-center gap-4 md:gap-6 mb-2">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`p-1.5 transition-all ${
              isShuffled
                ? 'text-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]'
                : 'text-[#b38b4d] hover:text-[#f5c96a]'
            }`}
            title={`Shuffle: ${isShuffled ? 'On' : 'Off'}`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Previous */}
          <button
            onClick={playPrevious}
            disabled={!currentTrack}
            className="p-1.5 text-[#f5c96a] hover:text-[#ffd700] hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 transition-all"
            title="Previous (or restart)"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            disabled={!currentTrack}
            className="w-11 h-11 rounded-full bg-[#4a1f1f] border-2 border-[#b38b4d] text-[#f5c96a] flex items-center justify-center shadow-[0_0_20px_rgba(181,139,77,0.5)] hover:bg-[#6b2a2a] hover:border-[#ffd700] hover:text-[#ffd700] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={playNext}
            disabled={!currentTrack}
            className="p-1.5 text-[#f5c96a] hover:text-[#ffd700] hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 transition-all"
            title="Next Track"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Repeat */}
          <button
            onClick={cycleRepeat}
            className={`p-1.5 transition-all ${
              repeatMode !== 'off'
                ? 'text-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]'
                : 'text-[#b38b4d] hover:text-[#f5c96a]'
            }`}
            title={`Repeat mode: ${repeatMode.toUpperCase()}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Progress Bar & Timestamps */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#b38b4d] w-10 text-right shrink-0">
            {formatTime(currentTime)}
          </span>

          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            onMouseMove={handleProgressMouseMove}
            onMouseLeave={() => setHoverTime(null)}
            className="relative flex-1 h-2 bg-[#2d0a0a] rounded-full cursor-pointer group py-1"
          >
            {/* Buffer progress */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-[#4a1f1f] rounded-full pointer-events-none"
              style={{ width: `${buffered}%` }}
            />

            {/* Play progress */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-[#b38b4d] via-[#d4af37] to-[#ffd700] rounded-full group-hover:h-2 transition-all shadow-[0_0_8px_rgba(212,175,55,0.7)]"
              style={{ width: `${progressPercent}%` }}
            />

            {/* Scrub Knob */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#ffd700] border border-[#2a0000] rounded-full shadow-[0_0_10px_rgba(255,215,0,0.9)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${progressPercent}% - 7px)` }}
            />

            {/* Hover Tooltip */}
            {hoverTime !== null && (
              <div
                className="absolute -top-7 -translate-x-1/2 px-1.5 py-0.5 bg-[#250808] border border-[#b38b4d] rounded text-[10px] text-[#ffd700] font-mono shadow-md pointer-events-none"
                style={{
                  left: `${(hoverTime / (duration || 1)) * 100}%`,
                }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>

          <span className="text-[11px] font-mono text-[#b38b4d] w-10 shrink-0">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Auxiliary Tools (Right) */}
      <div className="flex items-center justify-end gap-2 md:gap-4 w-1/4 min-w-[200px] max-w-[340px]">
        {/* Spectrum Visualizer Mini Preview */}
        <AudioVisualizer className="hidden lg:flex" height={28} />

        {/* Download MP3/Native Track Button */}
        {currentTrack && (
          <button
            onClick={() => downloadTrack(currentTrack)}
            className="p-1.5 text-[#b38b4d] hover:text-[#ffd700] hover:scale-110 transition-all"
            title={`Download ${currentTrack.format.toUpperCase()} audio file`}
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Offline Cache Toggle */}
        {currentTrack && (
          <button
            onClick={() => {
              if (isOffline) {
                removeOfflineCache(currentTrack.id);
              } else {
                cacheTrackOffline(currentTrack);
              }
            }}
            className={`p-1.5 transition-all ${
              isOffline
                ? 'text-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]'
                : 'text-[#b38b4d] hover:text-[#f5c96a]'
            }`}
            title={isOffline ? 'Cached for offline listening (Click to remove)' : 'Save for offline listening'}
          >
            <WifiOff className="w-4 h-4" />
          </button>
        )}

        {/* Queue Toggle */}
        <button
          onClick={onToggleQueue}
          className={`relative p-1.5 transition-all ${
            isQueueOpen
              ? 'text-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]'
              : 'text-[#b38b4d] hover:text-[#f5c96a]'
          }`}
          title="Playback Queue"
        >
          <ListMusic className="w-5 h-5" />
          {queue.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#5c1f1f] border border-[#b38b4d] text-[9px] text-[#ffd700] flex items-center justify-center font-bold">
              {queue.length}
            </span>
          )}
        </button>

        {/* Volume Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className="p-1.5 text-[#b38b4d] hover:text-[#ffd700] transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
            className="w-16 md:w-24 h-1.5 bg-[#2d0a0a] rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />
        </div>
      </div>
    </footer>
  );
};
