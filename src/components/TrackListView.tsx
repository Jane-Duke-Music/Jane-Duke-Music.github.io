import React, { useState } from 'react';
import {
  Play,
  Pause,
  Heart,
  Download,
  MoreVertical,
  WifiOff,
  Edit2,
  Trash2,
  Plus,
  Disc,
  Volume2,
} from 'lucide-react';
import { Track } from '../types';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useAuth } from '../context/AuthContext';
import { formatTime } from '../utils/audioMetadata';

interface TrackListViewProps {
  tracks: Track[];
  customQueue?: Track[];
  onOpenUpload: () => void;
  onEditTrack: (track: Track) => void;
  showAlbumColumn?: boolean;
}

export const TrackListView: React.FC<TrackListViewProps> = ({
  tracks,
  customQueue,
  onOpenUpload,
  onEditTrack,
  showAlbumColumn = true,
}) => {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    favorites,
    toggleFavorite,
    downloadTrack,
    offlineTrackIds,
    cacheTrackOffline,
    removeOfflineCache,
    deleteTrack,
    playlists,
    addTrackToPlaylist,
    addToQueue,
  } = useAudioPlayer();

  const { isOwner } = useAuth();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [playlistMenuTrackId, setPlaylistMenuTrackId] = useState<string | null>(null);
  const [confirmDeleteTrackId, setConfirmDeleteTrackId] = useState<string | null>(null);

  if (tracks.length === 0) {
    return (
      <div className="py-16 px-4 text-center max-w-lg mx-auto gothic-card p-10 border border-[#5c1f1f]">
        <Disc className="w-16 h-16 mx-auto mb-4 text-[#d4af37] opacity-60" />
        <h4 className="text-xl font-bold text-[#f5c96a] mb-2">
          {isOwner ? 'No Audio Tracks Uploaded Yet' : 'No Audio Tracks Available'}
        </h4>
        <p className="text-[#e8c88a] text-sm mb-6 leading-relaxed">
          {isOwner
            ? 'The music player is waiting for your master recordings. As administrator, click below to upload audio files (MP3, WAV, OGG, FLAC) with custom metadata.'
            : 'No music tracks have been published by the administrator yet. Check back soon for new releases!'}
        </p>
        {isOwner && (
          <button onClick={onOpenUpload} className="wav-button">
            Upload Master Audio
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#5c1f1f] bg-[#190808]/80 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#5c1f1f] text-xs font-semibold uppercase tracking-wider text-[#b38b4d] bg-[#220707]">
            <th className="py-3.5 px-4 w-12 text-center">#</th>
            <th className="py-3.5 px-4">Title & Artist</th>
            {showAlbumColumn && <th className="py-3.5 px-4 hidden md:table-cell">Album</th>}
            <th className="py-3.5 px-4 hidden sm:table-cell text-center">Format</th>
            <th className="py-3.5 px-4 text-right">Time</th>
            <th className="py-3.5 px-4 w-28 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#5c1f1f]/30">
          {tracks.map((track, index) => {
            const isCurrent = currentTrack?.id === track.id;
            const isFav = favorites.has(track.id);
            const isOffline = offlineTrackIds.has(track.id);
            const canManage = isOwner;

            return (
              <tr
                key={track.id}
                onMouseEnter={() => {}}
                className={`group transition-colors duration-150 ${
                  isCurrent
                    ? 'bg-[#3e1313]/90 text-[#ffd700]'
                    : 'hover:bg-[#2e0c0c]/80 text-[#d4af37]'
                }`}
              >
                {/* Number / Play Button */}
                <td className="py-3 px-4 text-center text-xs">
                  <div className="relative flex items-center justify-center w-6 h-6 mx-auto">
                    {isCurrent && isPlaying ? (
                      <div className="flex items-end justify-center gap-0.5 w-4 h-4">
                        <span className="w-1 bg-[#ffd700] animate-pulse h-3" />
                        <span className="w-1 bg-[#ffd700] animate-pulse delay-75 h-4" />
                        <span className="w-1 bg-[#ffd700] animate-pulse delay-150 h-2" />
                      </div>
                    ) : (
                      <span className="group-hover:hidden font-mono text-[#b38b4d]">
                        {index + 1}
                      </span>
                    )}

                    <button
                      onClick={() => {
                        if (isCurrent) {
                          togglePlay();
                        } else {
                          playTrack(track, customQueue || tracks);
                        }
                      }}
                      className={`${
                        isCurrent ? 'flex' : 'hidden group-hover:flex'
                      } absolute inset-0 items-center justify-center text-[#ffd700] hover:scale-125 transition-transform`}
                      title={isCurrent && isPlaying ? 'Pause' : 'Play'}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                    </button>
                  </div>
                </td>

                {/* Title & Artist & Artwork */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-[#2d0a0a] border border-[#b38b4d]/40 shrink-0 flex items-center justify-center">
                      {track.coverUrl ? (
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Disc className="w-6 h-6 text-[#d4af37] opacity-60" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`font-semibold truncate text-sm ${
                          isCurrent ? 'text-[#ffd700]' : 'text-[#f5c96a]'
                        }`}
                        title={track.title}
                      >
                        {track.title}
                      </p>
                      <p className="text-xs text-[#e8c88a]/80 truncate" title={track.artist}>
                        {track.artist}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Album */}
                {showAlbumColumn && (
                  <td className="py-3 px-4 hidden md:table-cell text-xs italic text-[#e8c88a]/70 truncate max-w-[180px]">
                    {track.album || 'Single'}
                  </td>
                )}

                {/* Format Badge */}
                <td className="py-3 px-4 hidden sm:table-cell text-center">
                  <span className="inline-block uppercase tracking-wider text-[10px] font-bold px-2 py-0.5 rounded bg-[#3b1212] border border-[#b38b4d]/40 text-[#ffd700]">
                    {track.format}
                  </span>
                </td>

                {/* Duration */}
                <td className="py-3 px-4 text-right font-mono text-xs text-[#b38b4d]">
                  {formatTime(track.duration)}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-center relative">
                  <div className="flex items-center justify-center gap-2">
                    {/* Favorite */}
                    <button
                      onClick={() => toggleFavorite(track.id)}
                      className="p-1 text-[#b38b4d] hover:text-[#ffd700] hover:scale-110 transition-all"
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart
                        className={`w-4 h-4 ${isFav ? 'fill-[#ffd700] text-[#ffd700]' : ''}`}
                      />
                    </button>

                    {/* Download MP3 */}
                    <button
                      onClick={() => downloadTrack(track)}
                      className="p-1 text-[#ffd700] hover:text-[#ffea75] hover:scale-110 transition-all flex items-center gap-1"
                      title="Download MP3"
                    >
                      <Download className="w-4 h-4 text-[#ffd700]" />
                    </button>

                    {/* Offline Cache Indicator */}
                    <button
                      onClick={() => {
                        if (isOffline) {
                          removeOfflineCache(track.id);
                        } else {
                          cacheTrackOffline(track);
                        }
                      }}
                      className={`p-1 transition-all ${
                        isOffline
                          ? 'text-[#ffd700]'
                          : 'text-[#b38b4d]/50 hover:text-[#ffd700]'
                      }`}
                      title={isOffline ? 'Cached offline (Click to delete)' : 'Cache offline'}
                    >
                      <WifiOff className="w-4 h-4" />
                    </button>

                    {/* More Menu Dropdown Toggle */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveMenuId(activeMenuId === track.id ? null : track.id)
                        }
                        className="p-1 text-[#b38b4d] hover:text-[#ffd700] transition-colors"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === track.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => {
                              setActiveMenuId(null);
                              setPlaylistMenuTrackId(null);
                            }}
                          />
                          <div className="absolute right-0 top-full mt-1 w-52 bg-[#250808] border border-[#b38b4d] rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.9)] z-50 py-1 text-left text-xs divide-y divide-[#5c1f1f]">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  downloadTrack(track);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-[#ffd700] hover:bg-[#4a1f1f] flex items-center gap-2 font-semibold"
                              >
                                <Download className="w-3.5 h-3.5 text-[#ffd700]" />
                                Download MP3
                              </button>

                              <button
                                onClick={() => {
                                  addToQueue(track);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-[#f5c96a] hover:bg-[#4a1f1f] hover:text-[#ffd700] flex items-center gap-2"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add to Queue
                              </button>

                              {/* Playlist Add */}
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setPlaylistMenuTrackId(
                                      playlistMenuTrackId === track.id ? null : track.id
                                    )
                                  }
                                  className="w-full px-3 py-2 text-[#f5c96a] hover:bg-[#4a1f1f] hover:text-[#ffd700] flex items-center justify-between"
                                >
                                  <span className="flex items-center gap-2">
                                    <Plus className="w-3.5 h-3.5" />
                                    Add to Playlist
                                  </span>
                                  <span>›</span>
                                </button>

                                {playlistMenuTrackId === track.id && (
                                  <div className="absolute right-full top-0 w-48 bg-[#2d0a0a] border border-[#b38b4d] rounded-lg shadow-xl py-1 max-h-48 overflow-y-auto">
                                    {playlists.length === 0 ? (
                                      <p className="px-3 py-2 text-xs text-[#b38b4d] italic">
                                        No playlists created yet
                                      </p>
                                    ) : (
                                      playlists.map((pl) => (
                                        <button
                                          key={pl.id}
                                          onClick={() => {
                                            addTrackToPlaylist(pl.id, track.id);
                                            setActiveMenuId(null);
                                            setPlaylistMenuTrackId(null);
                                          }}
                                          className="w-full px-3 py-1.5 text-left text-[#f5c96a] hover:bg-[#4a1f1f] truncate"
                                        >
                                          {pl.name}
                                        </button>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Owner Metadata Editing & Delete */}
                            {canManage && (
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    onEditTrack(track);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-[#ffd700] hover:bg-[#4a1f1f] flex items-center gap-2"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  Edit Metadata (Owner)
                                </button>
                                {!confirmDeleteTrackId || confirmDeleteTrackId !== track.id ? (
                                  <button
                                    onClick={() => setConfirmDeleteTrackId(track.id)}
                                    className="w-full px-3 py-2 text-red-400 hover:bg-[#4a1f1f] hover:text-red-300 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Audio (Owner)
                                  </button>
                                ) : (
                                  <div className="px-3 py-2 bg-[#1a0505] border border-red-500 rounded my-1 text-left space-y-1.5">
                                    <p className="text-[11px] text-red-300 font-semibold">Delete "{track.title}"?</p>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={async () => {
                                          await deleteTrack(track);
                                          setConfirmDeleteTrackId(null);
                                          setActiveMenuId(null);
                                        }}
                                        className="px-2 py-0.5 bg-red-700 hover:bg-red-600 text-white rounded text-[10px] font-bold"
                                      >
                                        Delete
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteTrackId(null)}
                                        className="px-2 py-0.5 bg-[#3a0d0d] hover:bg-[#4d1212] text-[#ffd700] rounded text-[10px]"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
