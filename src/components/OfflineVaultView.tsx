import React from 'react';
import { WifiOff, HardDrive, Trash2, ArrowLeft, Play, Disc } from 'lucide-react';
import { Track } from '../types';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { TrackListView } from './TrackListView';
import { formatFileSize } from '../utils/audioMetadata';

interface OfflineVaultViewProps {
  onBack: () => void;
  onOpenUpload: () => void;
  onEditTrack: (track: Track) => void;
}

export const OfflineVaultView: React.FC<OfflineVaultViewProps> = ({
  onBack,
  onOpenUpload,
  onEditTrack,
}) => {
  const { tracks, offlineTrackIds, playTrack, removeOfflineCache } = useAudioPlayer();

  const offlineTracks = tracks.filter((t) => offlineTrackIds.has(t.id));
  const totalCachedBytes = offlineTracks.reduce((acc, t) => acc + (t.fileSize || 0), 0);

  const [isConfirmingClear, setIsConfirmingClear] = React.useState(false);

  const handlePlayAllOffline = () => {
    if (offlineTracks.length > 0) {
      playTrack(offlineTracks[0], offlineTracks);
    }
  };

  const handleClearAllOfflineCache = async () => {
    for (const track of offlineTracks) {
      await removeOfflineCache(track.id);
    }
    setIsConfirmingClear(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-[#d4af37] hover:text-[#ffd700] hover:-translate-x-1 transition-transform"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </button>

      {/* Hero */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-8 bg-[#280a0a]/80 border-2 border-[#5c1f1f] rounded-2xl p-6 md:p-8 shadow-[0_0_40px_rgba(0,0,0,0.85)]">
        <div className="w-36 h-36 md:w-44 md:h-44 rounded-xl border-4 border-[#b38b4d] bg-[#190808] flex items-center justify-center shadow-[0_0_35px_rgba(212,175,55,0.4)] shrink-0">
          <WifiOff className="w-20 h-20 text-[#d4af37]" />
        </div>

        <div className="flex-1 text-center md:text-left space-y-3">
          <span className="text-xs uppercase tracking-widest font-semibold px-2.5 py-1 rounded bg-[#4a1f1f] text-[#ffd700] border border-[#b38b4d]/50">
            Offline Storage
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-[#f5c96a] drop-shadow-[0_0_20px_rgba(247,183,46,0.6)] leading-tight">
            Offline Audio Vault
          </h1>
          <p className="text-sm text-[#e8c88a] max-w-xl">
            Songs cached in browser IndexedDB storage for full playback without internet connectivity.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-[#d4af37]/80 pt-2">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-[#b38b4d]" />
              {offlineTracks.length} Cached Tracks
            </span>
            <span>•</span>
            <span className="font-mono text-[#ffd700]">
              {formatFileSize(totalCachedBytes)} Stored Locally
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4">
            <button
              onClick={handlePlayAllOffline}
              disabled={offlineTracks.length === 0}
              className="wav-button disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-current mr-1" />
              Play Offline Vault
            </button>

            {offlineTracks.length > 0 && !isConfirmingClear && (
              <button
                onClick={() => setIsConfirmingClear(true)}
                className="px-4 py-2.5 rounded-lg border border-[#5c1f1f] hover:border-red-500 bg-[#2d0a0a] text-red-400 hover:text-red-300 text-sm font-semibold transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Offline Cache
              </button>
            )}

            {isConfirmingClear && (
              <div className="flex items-center gap-2 bg-[#1f0505] p-1.5 rounded-lg border border-red-500">
                <span className="text-xs text-red-300 font-semibold px-2">Clear all cached audio?</span>
                <button
                  onClick={handleClearAllOfflineCache}
                  className="px-2.5 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-xs font-bold transition-colors"
                >
                  Yes, Clear
                </button>
                <button
                  onClick={() => setIsConfirmingClear(false)}
                  className="px-2.5 py-1 bg-[#3a0d0d] hover:bg-[#4d1212] text-[#ffd700] rounded text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div>
        <h3 className="text-xl font-bold text-[#cd900c] mb-4">Cached Offline Audio</h3>
        {offlineTracks.length === 0 ? (
          <div className="py-12 px-4 text-center gothic-card border border-[#5c1f1f]">
            <Disc className="w-12 h-12 mx-auto mb-3 text-[#d4af37] opacity-60" />
            <p className="text-sm text-[#e8c88a] mb-2">No tracks cached offline yet.</p>
            <p className="text-xs text-[#b38b4d] max-w-md mx-auto">
              Click the offline wifi icon on any track in your library or playback bar to save it for offline listening.
            </p>
          </div>
        ) : (
          <TrackListView
            tracks={offlineTracks}
            customQueue={offlineTracks}
            onOpenUpload={onOpenUpload}
            onEditTrack={onEditTrack}
          />
        )}
      </div>
    </div>
  );
};
