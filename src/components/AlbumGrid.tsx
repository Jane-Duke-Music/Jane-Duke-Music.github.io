import React, { useState } from 'react';
import { Disc, Play, Music, Clock } from 'lucide-react';
import { Album, Track } from '../types';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useAuth } from '../context/AuthContext';
import { formatTime } from '../utils/audioMetadata';

interface AlbumGridProps {
  onSelectAlbum: (album: Album) => void;
  onOpenUpload: () => void;
}

export const AlbumGrid: React.FC<AlbumGridProps> = ({ onSelectAlbum, onOpenUpload }) => {
  const { albums, playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const { isOwner } = useAuth();
  const [filterText, setFilterText] = useState('');

  const filteredAlbums = albums.filter(
    (a) =>
      a.title.toLowerCase().includes(filterText.toLowerCase()) ||
      a.artist.toLowerCase().includes(filterText.toLowerCase())
  );

  const handlePlayAlbum = (e: React.MouseEvent, album: Album) => {
    e.stopPropagation();
    if (album.tracks.length > 0) {
      playTrack(album.tracks[0], album.tracks);
    }
  };

  if (albums.length === 0) {
    return (
      <div className="py-16 px-4 text-center max-w-xl mx-auto gothic-card p-10 border-2 border-[#5c1f1f]">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-[#b38b4d] bg-[#2a0505] flex items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.3)]">
          <Disc className="w-12 h-12 text-[#d4af37]" />
        </div>
        <h3 className="text-2xl font-bold text-[#f5c96a] mb-3">
          {isOwner ? 'No Albums in Vault Yet' : 'No Albums Available'}
        </h3>
        <p className="text-[#e8c88a] text-sm mb-6 leading-relaxed">
          {isOwner
            ? 'Your gothic audio repository is currently silent. As administrator, upload your master recordings (MP3, WAV, OGG, FLAC) to build the discography.'
            : 'No albums have been published by the administrator yet. Check back soon for new discography releases.'}
        </p>
        {isOwner && (
          <button onClick={onOpenUpload} className="wav-button">
            Upload Master Recordings
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid Sub-header & Quick Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#5c1f1f]/60">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#cd900c] drop-shadow-[0_0_15px_rgba(247,183,46,0.5)]">
            Discography & Albums
          </h2>
          <p className="text-xs text-[#d4bd0c] mt-1">
            {albums.length} {albums.length === 1 ? 'Album Collection' : 'Album Collections'} catalogued
          </p>
        </div>

        <input
          type="text"
          placeholder="Filter albums or artists..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 rounded-lg bg-[#250808] border border-[#5c1f1f] text-[#ffd700] placeholder-[#b38b4d]/60 text-sm focus:outline-none focus:border-[#d4af37]"
        />
      </div>

      {/* Grid conforming to style.css discography-grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredAlbums.map((album) => {
          const isCurrentAlbumPlaying =
            currentTrack && album.tracks.some((t: Track) => t.id === currentTrack.id);

          return (
            <div
              key={`${album.title}-${album.artist}`}
              onClick={() => onSelectAlbum(album)}
              className="group cursor-pointer text-center bg-[#280a0a]/70 hover:bg-[#340d0d]/90 border-2 border-[#5c1f1f] hover:border-[#d4af37] rounded-xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(212,175,55,0.35)] flex flex-col items-center"
            >
              {/* Circular Vinyl Album Cover (From style.css .album-cover) */}
              <div className="relative mb-5 group/cover">
                <div
                  className={`w-48 h-48 rounded-full border-4 border-[#b38b4d] group-hover:border-[#ffd700] overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.85)] bg-[#190808] flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${
                    isCurrentAlbumPlaying && isPlaying ? 'animate-spin-slow' : ''
                  }`}
                >
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Disc className="w-24 h-24 text-[#d4af37] opacity-60" />
                  )}
                </div>

                {/* Center vinyl spindle hole */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#190808] border-2 border-[#ffd700] shadow-inner pointer-events-none flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#5c1f1f]" />
                </div>

                {/* Hover Play Button Overlay */}
                <button
                  onClick={(e) => handlePlayAlbum(e, album)}
                  className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-[#4a1f1f] border-2 border-[#ffd700] text-[#ffd700] flex items-center justify-center opacity-0 group-hover/cover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300 shadow-[0_0_20px_rgba(255,215,0,0.8)] hover:scale-110 active:scale-95 z-10"
                  title="Play Album"
                >
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </button>
              </div>

              {/* Title & Artist */}
              <h3 className="text-xl font-bold text-[#f5c96a] group-hover:text-[#ffd700] transition-colors line-clamp-1 mb-1">
                {album.title}
              </h3>
              <h4 className="text-sm italic text-[#e8b55d] mb-3 line-clamp-1">
                {album.artist}
              </h4>

              {/* Meta details */}
              <div className="mt-auto w-full pt-3 border-t border-[#5c1f1f]/50 flex items-center justify-between text-xs text-[#d4af37]/80">
                <span className="flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-[#b38b4d]" />
                  {album.trackCount} {album.trackCount === 1 ? 'Track' : 'Tracks'}
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-[#b38b4d]" />
                  {formatTime(album.totalDuration)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
