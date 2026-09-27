import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Disc, Check, Wand2 } from 'lucide-react';
import { Track } from '../types';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { fileToBase64 } from '../utils/audioMetadata';

interface MetadataEditModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MetadataEditModal: React.FC<MetadataEditModalProps> = ({
  track,
  isOpen,
  onClose,
}) => {
  const { updateTrackMetadata } = useAudioPlayer();

  const [title, setTitle] = useState(track?.title || '');
  const [artist, setArtist] = useState(track?.artist || '');
  const [album, setAlbum] = useState(track?.album || '');
  const [year, setYear] = useState(track?.year || '');
  const [genre, setGenre] = useState(track?.genre || '');
  const [coverBase64, setCoverBase64] = useState<string>(track?.coverUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when track changes
  React.useEffect(() => {
    if (track) {
      setTitle(track.title);
      setArtist(track.artist);
      setAlbum(track.album || '');
      setYear(track.year || '');
      setGenre(track.genre || '');
      setCoverBase64(track.coverUrl || '');
      setSuccess(false);
    }
  }, [track]);

  if (!isOpen || !track) return null;

  const handleCoverUpload = async (file: File) => {
    try {
      const b64 = await fileToBase64(file);
      setCoverBase64(b64);
    } catch {
      // ignore
    }
  };

  const generateGothicCover = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgGrad = ctx.createRadialGradient(200, 200, 20, 200, 200, 200);
    bgGrad.addColorStop(0, '#4a0808');
    bgGrad.addColorStop(0.5, '#200404');
    bgGrad.addColorStop(1, '#080101');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 400, 400);

    ctx.strokeStyle = '#b38b4d';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, 376, 376);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(200, 200, 160, 0, Math.PI * 2);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5c96a';
    ctx.font = 'bold 22px serif';
    ctx.fillText((title || 'SONORA NOIR').slice(0, 24), 200, 190);

    ctx.fillStyle = '#e8c88a';
    ctx.font = 'italic 16px serif';
    ctx.fillText((artist || 'Master Recording').slice(0, 28), 200, 225);

    setCoverBase64(canvas.toDataURL('image/png'));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const ok = await updateTrackMetadata(track.id, {
      title,
      artist,
      album,
      year,
      genre,
      coverBase64: coverBase64.startsWith('data:image') ? coverBase64 : undefined,
    });
    setIsSubmitting(false);

    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-[#1d0707] border-2 border-[#b38b4d] rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.4)] p-6 md:p-8 text-left">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#b38b4d] hover:text-[#ffd700] p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-[#f5c96a] mb-1">Edit Track Metadata</h2>
        <p className="text-xs text-[#e8c88a]/80 mb-6">
          Update display titles, artist attributions, album collections, and cover art.
        </p>

        {success && (
          <div className="mb-4 p-3 bg-green-950/70 border border-[#b38b4d] rounded text-xs text-[#ffd700] flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            Metadata saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            {/* Cover art preview & upload */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-xl border-2 border-[#b38b4d] overflow-hidden bg-[#100303] flex items-center justify-center shadow-lg mb-2">
                {coverBase64 ? (
                  <img src={coverBase64} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <Disc className="w-14 h-14 text-[#b38b4d]/60" />
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleCoverUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="flex-1 py-1 px-2 text-[11px] bg-[#2d0a0a] border border-[#5c1f1f] rounded text-[#ffd700] hover:bg-[#4a1f1f]"
                >
                  Browse
                </button>
                <button
                  type="button"
                  onClick={generateGothicCover}
                  className="flex-1 py-1 px-2 text-[11px] bg-[#4a1f1f] border border-[#b38b4d] rounded text-[#ffd700] hover:bg-[#6b2a2a]"
                >
                  Gen Art
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#b38b4d] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#120303] border border-[#5c1f1f] focus:border-[#d4af37] rounded text-sm text-[#ffd700] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#b38b4d] mb-1">Artist</label>
                <input
                  type="text"
                  required
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#120303] border border-[#5c1f1f] focus:border-[#d4af37] rounded text-sm text-[#ffd700] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#b38b4d] mb-1">Album</label>
                <input
                  type="text"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#120303] border border-[#5c1f1f] focus:border-[#d4af37] rounded text-sm text-[#ffd700] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#b38b4d] mb-1">Year</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#120303] border border-[#5c1f1f] focus:border-[#d4af37] rounded text-sm text-[#ffd700] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#b38b4d] mb-1">Genre</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#120303] border border-[#5c1f1f] focus:border-[#d4af37] rounded text-sm text-[#ffd700] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#5c1f1f] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#b38b4d] hover:text-[#ffd700]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="wav-button"
            >
              {isSubmitting ? 'Saving...' : 'Update Metadata'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
