import React from 'react';
import { X, Play, Trash2, ChevronUp, ChevronDown, Disc, ListMusic } from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { formatTime } from '../utils/audioMetadata';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({ isOpen, onClose }) => {
  const {
    queue,
    queueIndex,
    currentTrack,
    playTrack,
    removeFromQueue,
    clearQueue,
    reorderQueue,
  } = useAudioPlayer();

  if (!isOpen) return null;

  return (
    <aside className="fixed top-0 right-0 bottom-24 w-80 md:w-96 bg-[#160404]/98 border-l-2 border-[#5c1f1f] shadow-[-10px_0_40px_rgba(0,0,0,0.95)] z-40 flex flex-col backdrop-blur-lg animate-slideLeft">
      {/* Header */}
      <div className="p-4 border-b border-[#5c1f1f] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-[#ffd700]" />
          <h3 className="font-bold text-[#f5c96a] text-lg">Playback Queue</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#4a1f1f] text-[#ffd700] border border-[#b38b4d]/50">
            {queue.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="text-xs text-red-400 hover:text-red-300 hover:underline px-2 py-1"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-[#b38b4d] hover:text-[#ffd700] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Now Playing Section */}
        {currentTrack && (
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#b38b4d]">
              Now Playing
            </span>
            <div className="mt-2 p-3 bg-[#2d0a0a] border border-[#b38b4d] rounded-xl flex items-center gap-3 shadow-[0_0_15px_rgba(179,139,77,0.3)]">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#150404] border border-[#b38b4d]/40 shrink-0 flex items-center justify-center">
                {currentTrack.coverUrl ? (
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Disc className="w-6 h-6 text-[#d4af37]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#ffd700] truncate">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-[#e8c88a] truncate">{currentTrack.artist}</p>
                <p className="text-[10px] text-[#b38b4d] truncate italic">
                  {currentTrack.album}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Up Next List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#b38b4d]">
              Next In Queue
            </span>
            <span className="text-[11px] text-[#b38b4d]">
              {queue.length > 0 ? `${queue.length} songs` : 'Empty'}
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#b38b4d] italic border border-dashed border-[#5c1f1f] rounded-lg p-4">
              Queue is empty. Select any song or album to populate the queue.
            </div>
          ) : (
            <div className="space-y-1.5">
              {queue.map((track, idx) => {
                const isCurrent = idx === queueIndex;

                return (
                  <div
                    key={`${track.id}-${idx}`}
                    className={`group p-2 rounded-lg border transition-all flex items-center justify-between gap-2 text-xs ${
                      isCurrent
                        ? 'bg-[#3e1313] border-[#ffd700] text-[#ffd700]'
                        : 'bg-[#220707]/80 hover:bg-[#2e0b0b] border-[#5c1f1f]/50 text-[#e8c88a]'
                    }`}
                  >
                    <div
                      onClick={() => playTrack(track, queue)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="font-mono text-[#b38b4d] text-[10px] w-4 text-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="w-8 h-8 rounded bg-[#150404] overflow-hidden shrink-0 flex items-center justify-center">
                        {track.coverUrl ? (
                          <img
                            src={track.coverUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Disc className="w-4 h-4 text-[#d4af37]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{track.title}</p>
                        <p className="text-[11px] text-[#b38b4d] truncate">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-mono text-[10px] text-[#b38b4d] mr-1">
                        {formatTime(track.duration)}
                      </span>

                      {/* Reorder Up/Down */}
                      <button
                        onClick={() => idx > 0 && reorderQueue(idx, idx - 1)}
                        disabled={idx === 0}
                        className="p-1 text-[#b38b4d] hover:text-[#ffd700] disabled:opacity-20"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => idx < queue.length - 1 && reorderQueue(idx, idx + 1)}
                        disabled={idx === queue.length - 1}
                        className="p-1 text-[#b38b4d] hover:text-[#ffd700] disabled:opacity-20"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromQueue(idx)}
                        className="p-1 text-[#b38b4d] hover:text-red-400"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
