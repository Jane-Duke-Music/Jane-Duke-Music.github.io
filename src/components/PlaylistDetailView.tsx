import React from 'react';
import { Play, ArrowLeft, Download, Trash2, ListMusic, Clock, Music } from 'lucide-react';
import { Playlist, Track } from '../types';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { formatTime } from '../utils/audioMetadata';
import { TrackListView } from './TrackListView';

interface PlaylistDetailViewProps {
  playlist: Playlist;
  onBack: () => void;
  onOpenUpload: () => void;
  onEditTrack: (track: Track) => void;
}

export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({
  playlist,
  onBack,
  onOpenUpload,
  onEditTrack,
}) => {
  const {
    tracks,
    playTrack,
    currentTrack,
    isPlaying,
    downloadTrack,
    deletePlaylist,
    removeTrackFromPlaylist,
  } = useAudioPlayer();

  // Resolve track objects from trackIds
  const playlistTracks = playlist.trackIds
    .map((id) => tracks.find((t) => t.id === id))
    .filter((t): t is Track => t !== undefined);

  const totalDuration = playlistTracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const isCurrentPlaylist =
    currentTrack && playlistTracks.some((t) => t.id === currentTrack.id);

  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

  const handlePlayAll = () => {
    if (playlistTracks.length > 0) {
      playTrack(playlistTracks[0], playlistTracks);
    }
  };

  const handleDownloadAll = () => {
    playlistTracks.forEach((t, i) => {
      setTimeout(() => downloadTrack(t), i * 350);
    });
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

      {/* Playlist Hero */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-8 bg-[#280a0a]/80 border-2 border-[#5c1f1f] rounded-2xl p-6 md:p-8 shadow-[0_0_40px_rgba(0,0,0,0.85)]">
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-xl border-4 border-[#b38b4d] bg-[#190808] flex items-center justify-center shadow-[0_0_35px_rgba(212,175,55,0.4)] shrink-0">
          <ListMusic className="w-24 h-24 text-[#d4af37]" />
        </div>

        <div className="flex-1 text-center md:text-left space-y-3">
          <span className="text-xs uppercase tracking-widest font-semibold px-2.5 py-1 rounded bg-[#4a1f1f] text-[#ffd700] border border-[#b38b4d]/50">
            Playlist
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-[#f5c96a] drop-shadow-[0_0_20px_rgba(247,183,46,0.6)] leading-tight">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-sm text-[#e8c88a] max-w-xl italic">
              {playlist.description}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-[#d4af37]/80 pt-2">
            <span className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-[#b38b4d]" />
              {playlistTracks.length} {playlistTracks.length === 1 ? 'Track' : 'Tracks'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-[#b38b4d]" />
              {formatTime(totalDuration)}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4">
            <button
              onClick={handlePlayAll}
              disabled={playlistTracks.length === 0}
              className="wav-button disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-current mr-1" />
              Play Playlist
            </button>

            {playlistTracks.length > 0 && (
              <button
                onClick={handleDownloadAll}
                className="px-4 py-2.5 rounded-lg border border-[#b38b4d] bg-[#2d0a0a] text-[#f5c96a] hover:text-[#ffd700] hover:border-[#ffd700] hover:bg-[#4a1f1f] text-sm font-semibold transition-all flex items-center gap-2"
                title="Download all playlist tracks"
              >
                <Download className="w-4 h-4" />
                Download All MP3s
              </button>
            )}

            {!isConfirmingDelete ? (
              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="p-2.5 rounded-lg border border-[#5c1f1f] hover:border-red-500 bg-[#2d0a0a] text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                title="Delete Playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-[#1f0505] p-1.5 rounded-lg border border-red-500">
                <span className="text-xs text-red-300 font-semibold px-2">Delete playlist?</span>
                <button
                  onClick={async () => {
                    await deletePlaylist(playlist.id);
                    onBack();
                  }}
                  className="px-2.5 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-xs font-bold transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2.5 py-1 bg-[#3a0d0d] hover:bg-[#4d1212] text-[#ffd700] rounded text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Playlist Tracks List */}
      <div>
        <h3 className="text-xl font-bold text-[#cd900c] mb-4">Tracks in Playlist</h3>
        {playlistTracks.length === 0 ? (
          <div className="py-12 px-4 text-center gothic-card border border-[#5c1f1f]">
            <p className="text-sm text-[#e8c88a] mb-4">This playlist has no tracks yet.</p>
            <p className="text-xs text-[#b38b4d]">
              Browse your Library or Albums, click the three-dots menu on any track, and select "Add to Playlist".
            </p>
          </div>
        ) : (
          <TrackListView
            tracks={playlistTracks}
            customQueue={playlistTracks}
            onOpenUpload={onOpenUpload}
            onEditTrack={onEditTrack}
          />
        )}
      </div>
    </div>
  );
};
