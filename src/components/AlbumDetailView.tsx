import React from 'react';
import { Play, ArrowLeft, Download, Plus, Disc, Clock, Music } from 'lucide-react';
import { Album, Track } from '../types';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { formatTime } from '../utils/audioMetadata';
import { TrackListView } from './TrackListView';

interface AlbumDetailViewProps {
  album: Album;
  onBack: () => void;
  onOpenUpload: () => void;
  onEditTrack: (track: Track) => void;
}

export const AlbumDetailView: React.FC<AlbumDetailViewProps> = ({
  album,
  onBack,
  onOpenUpload,
  onEditTrack,
}) => {
  const { playTrack, currentTrack, isPlaying, downloadTrack } = useAudioPlayer();

  const isCurrentAlbum = currentTrack && album.tracks.some((t) => t.id === currentTrack.id);

  const handlePlayAll = () => {
    if (album.tracks.length > 0) {
      playTrack(album.tracks[0], album.tracks);
    }
  };

  const handleDownloadAll = () => {
    album.tracks.forEach((track, i) => {
      setTimeout(() => {
        downloadTrack(track);
      }, i * 350);
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
        Back to Discography
      </button>

      {/* Album Hero (matching style.css .album-hero) */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-8 bg-[#280a0a]/80 border-2 border-[#5c1f1f] rounded-2xl p-6 md:p-8 shadow-[0_0_40px_rgba(0,0,0,0.85)]">
        {/* Large Cover */}
        <div className="relative group shrink-0">
          <div
            className={`w-52 h-52 md:w-64 md:h-64 rounded-xl border-4 border-[#b38b4d] overflow-hidden shadow-[0_0_35px_rgba(212,175,55,0.4)] bg-[#190808] flex items-center justify-center ${
              isCurrentAlbum && isPlaying ? 'shadow-[0_0_45px_rgba(255,215,0,0.6)]' : ''
            }`}
          >
            {album.coverUrl ? (
              <img
                src={album.coverUrl}
                alt={album.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Disc className="w-28 h-28 text-[#d4af37] opacity-60" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left space-y-3">
          <span className="text-xs uppercase tracking-widest font-semibold px-2.5 py-1 rounded bg-[#4a1f1f] text-[#ffd700] border border-[#b38b4d]/50">
            Album Collection
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-[#f5c96a] drop-shadow-[0_0_20px_rgba(247,183,46,0.6)] leading-tight">
            {album.title}
          </h1>
          <p className="text-xl md:text-2xl italic text-[#e8b55d]">
            {album.artist}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-[#d4af37]/80 pt-2">
            <span className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-[#b38b4d]" />
              {album.trackCount} {album.trackCount === 1 ? 'Track' : 'Tracks'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-[#b38b4d]" />
              {formatTime(album.totalDuration)}
            </span>
            {album.year && (
              <>
                <span>•</span>
                <span>Released {album.year}</span>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4">
            <button onClick={handlePlayAll} className="wav-button">
              <Play className="w-4 h-4 fill-current mr-1" />
              Play Master
            </button>

            <button
              onClick={handleDownloadAll}
              className="px-4 py-2.5 rounded-lg border border-[#b38b4d] bg-[#2d0a0a] text-[#f5c96a] hover:text-[#ffd700] hover:border-[#ffd700] hover:bg-[#4a1f1f] text-sm font-semibold transition-all flex items-center gap-2"
              title="Download all tracks in album"
            >
              <Download className="w-4 h-4" />
              Download MP3s
            </button>
          </div>
        </div>
      </div>

      {/* Album Tracks List */}
      <div>
        <h3 className="text-xl font-bold text-[#cd900c] mb-4">Tracklist</h3>
        <TrackListView
          tracks={album.tracks}
          customQueue={album.tracks}
          onOpenUpload={onOpenUpload}
          onEditTrack={onEditTrack}
          showAlbumColumn={false}
        />
      </div>
    </div>
  );
};
