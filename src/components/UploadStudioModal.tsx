import React, { useState, useRef } from 'react';
import { Upload, X, Disc, AlertCircle, Check, Wand2, Image as ImageIcon, ShieldAlert, Crown } from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useAuth } from '../context/AuthContext';
import {
  getAudioFormatFromFilename,
  parseFilenameMetadata,
  getAudioDuration,
  fileToBase64,
} from '../utils/audioMetadata';

interface UploadStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export const UploadStudioModal: React.FC<UploadStudioModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
}) => {
  const { refreshLibrary } = useAudioPlayer();
  const { isAdmin, token, user } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [format, setFormat] = useState<string>('mp3');
  const [duration, setDuration] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [genre, setGenre] = useState('Gothic / Darkwave');
  const [coverBase64, setCoverBase64] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Strict check: Only logged in admin can upload music
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <div className="relative w-full max-w-md bg-[#1d0707] border-2 border-[#5c1f1f] rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.3)] p-6 md:p-8 text-center">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-[#b38b4d] hover:text-[#ffd700] p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-full bg-[#350a0a] border-2 border-red-500/80 flex items-center justify-center text-red-400 mx-auto mb-4 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-[#f5c96a] mb-2">Admin Authorization Required</h3>
          <p className="text-xs text-[#e8c88a] leading-relaxed mb-6">
            Only the logged in site administrator can upload music to this player. Regular users and listeners cannot upload files, but can listen to all published music, build playlists, and download tracks in high-quality MP3 format.
          </p>

          <div className="flex flex-col gap-3">
            {onOpenAuth && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="wav-button w-full py-2.5 text-xs flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4 text-[#ffd700]" />
                Sign In as Admin
              </button>
            )}
            <button
              onClick={onClose}
              className="text-xs text-[#b38b4d] hover:text-[#ffd700] py-1"
            >
              Return to Music Player
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleAudioFileSelection = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const detectedFormat = getAudioFormatFromFilename(file.name);
    setSelectedFile(file);
    setFormat(detectedFormat);

    // Auto extract title/artist
    const parsed = parseFilenameMetadata(file.name);
    setTitle(parsed.title);
    setArtist(parsed.artist);
    setAlbum(parsed.album);

    // Calculate duration
    try {
      const dur = await getAudioDuration(file);
      setDuration(Math.round(dur));
    } catch {
      setDuration(180);
    }
  };

  const handleCoverImageSelection = async (file: File) => {
    try {
      const b64 = await fileToBase64(file);
      setCoverBase64(b64);
    } catch {
      setErrorMsg('Failed to read cover image');
    }
  };

  // Generate artistic gothic vinyl cover on the fly
  const generateGothicCover = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark wine radial background
    const bgGrad = ctx.createRadialGradient(200, 200, 20, 200, 200, 200);
    bgGrad.addColorStop(0, '#4a0808');
    bgGrad.addColorStop(0.5, '#200404');
    bgGrad.addColorStop(1, '#080101');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 400, 400);

    // Gold borders & concentric rings
    ctx.strokeStyle = '#b38b4d';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, 376, 376);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(200, 200, 160, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#5c1f1f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(200, 200, 110, 0, Math.PI * 2);
    ctx.stroke();

    // Text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5c96a';
    ctx.font = 'bold 22px serif';
    ctx.fillText((title || 'SONORA MASTER').slice(0, 24), 200, 190);

    ctx.fillStyle = '#e8c88a';
    ctx.font = 'italic 16px serif';
    ctx.fillText((artist || 'Admin Upload').slice(0, 28), 200, 225);

    setCoverBase64(canvas.toDataURL('image/png'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select an audio file (MP3, WAV, OGG, or FLAC).');
      return;
    }
    if (!title.trim() || !artist.trim()) {
      setErrorMsg('Title and Artist are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const b64 = await fileToBase64(selectedFile);
      const base64Data = b64.replace(/^data:audio\/\w+;base64,/, '');

      const res = await fetch('/api/tracks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          artist,
          album,
          year,
          genre,
          duration,
          format,
          audioBase64: base64Data,
          coverBase64: coverBase64 || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Server rejected track upload');
      }

      await refreshLibrary();
      setSuccessMsg(`"${title}" successfully uploaded and catalogued into library!`);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1200);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Failed to upload audio file');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setArtist('');
    setAlbum('');
    setCoverBase64('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#1d0707] border-2 border-[#b38b4d] rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.4)] p-6 md:p-8 my-8 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#b38b4d] hover:text-[#ffd700] p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-[#ffd700] text-black border border-[#ffd700] flex items-center gap-1">
              <Crown className="w-3 h-3" /> Admin Only Studio
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#f5c96a]">
            Master Audio Upload & Metadata Studio
          </h2>
          <p className="text-xs text-[#e8c88a]/80 mt-1">
            Files uploaded here become the exclusive streamable catalog for all listeners across devices.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/70 border border-red-500 rounded-lg text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-950/70 border border-[#b38b4d] rounded-lg text-[#ffd700] text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-green-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Drag & Drop Audio Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleAudioFileSelection(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-[#b38b4d]/70 hover:border-[#ffd700] bg-[#270909]/70 hover:bg-[#340b0b] rounded-xl p-6 text-center cursor-pointer transition-all duration-200 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.ogg,.flac,audio/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleAudioFileSelection(e.target.files[0]);
                }
              }}
            />

            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#4a1f1f] border border-[#b38b4d] flex items-center justify-center text-[#ffd700] group-hover:scale-110 shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-transform">
              <Upload className="w-6 h-6" />
            </div>

            {selectedFile ? (
              <div>
                <p className="text-sm font-semibold text-[#ffd700]">{selectedFile.name}</p>
                <p className="text-xs text-[#b38b4d] mt-1">
                  Format: <span className="uppercase text-[#f5c96a] font-bold">{format}</span> • Size:{' '}
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-[#f5c96a]">
                  Click or drag audio file to upload (MP3, WAV, OGG, FLAC)
                </p>
                <p className="text-xs text-[#b38b4d] mt-1">Audio will be saved to server and ready for MP3 download</p>
              </div>
            )}
          </div>

          {/* Metadata Fields & Artwork */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Artwork Cover Preview & Controls */}
            <div className="flex flex-col items-center">
              <div className="relative group w-36 h-36 rounded-xl border-2 border-[#b38b4d] overflow-hidden bg-[#100303] shadow-[0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-center mb-3">
                {coverBase64 ? (
                  <img src={coverBase64} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <Disc className="w-16 h-16 text-[#b38b4d]/60" />
                )}
              </div>

              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleCoverImageSelection(e.target.files[0]);
                  }
                }}
              />

              <div className="flex flex-col gap-2 w-full">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full py-1.5 px-2 bg-[#2d0a0a] border border-[#5c1f1f] hover:border-[#b38b4d] rounded text-xs text-[#e8c88a] hover:text-[#ffd700] flex items-center justify-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Upload Artwork
                </button>
                <button
                  type="button"
                  onClick={generateGothicCover}
                  className="w-full py-1.5 px-2 bg-[#4a1f1f] border border-[#b38b4d] rounded text-xs text-[#ffd700] hover:bg-[#6b2a2a] flex items-center justify-center gap-1.5"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Auto-Gen Cover
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#b38b4d] mb-1">
                  Track Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Black Celebration"
                  className="w-full px-3 py-2 bg-[#120303] border border-[#5c1f1f] focus:border-[#d4af37] rounded-lg text-sm text-[#ffd700] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#b38b4d] mb-1">
                    Artist Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="e.g. Depeche Mode"
                    className="w-full px-3 py-2 bg-[#120303] border border-[#5c1f1f] focus:border-[#d4af37] rounded-lg text-sm text-[#ffd700] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#b38b4d] mb-1">
                    Album Name
                  </label>
                  <input
                    type="text"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    placeholder="e.g. Master Vault 1"
                    className="w-full px-3 py-2 bg-[#120303] border border-[#5c1f1f] focus:border-[#d4af37] rounded-lg text-sm text-[#ffd700] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#b38b4d] mb-1">
                    Release Year
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2026"
                    className="w-full px-3 py-2 bg-[#120303] border border-[#5c1f1f] focus:border-[#d4af37] rounded-lg text-sm text-[#ffd700] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#b38b4d] mb-1">Genre</label>
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="Gothic / Dark Ambient"
                    className="w-full px-3 py-2 bg-[#120303] border border-[#5c1f1f] focus:border-[#d4af37] rounded-lg text-sm text-[#ffd700] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#5c1f1f] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#b38b4d] hover:text-[#ffd700]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="wav-button"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#ffd700] border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading to Server...
                </>
              ) : (
                'Upload Track to Player'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
