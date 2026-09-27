import React, { useState } from 'react';
import { X, ListMusic, Plus } from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistCreated?: (id: string) => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  onPlaylistCreated,
}) => {
  const { createPlaylist } = useAudioPlayer();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const pl = await createPlaylist(name.trim(), description.trim());
    setIsSubmitting(false);

    if (pl) {
      setName('');
      setDescription('');
      if (onPlaylistCreated) onPlaylistCreated(pl.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#1d0707] border-2 border-[#b38b4d] rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.4)] p-6 md:p-8 text-left">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#b38b4d] hover:text-[#ffd700] p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#4a1f1f] border border-[#b38b4d] flex items-center justify-center text-[#ffd700]">
            <ListMusic className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-[#f5c96a]">Create New Playlist</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#b38b4d] mb-1">
              Playlist Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Nocturnal Rituals"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#120303] border border-[#5c1f1f] focus:border-[#d4af37] rounded text-sm text-[#ffd700] focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#b38b4d] mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Atmospheric darkwave and gothic anthems..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#120303] border border-[#5c1f1f] focus:border-[#d4af37] rounded text-sm text-[#ffd700] focus:outline-none resize-none"
            />
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
              disabled={isSubmitting || !name.trim()}
              className="wav-button"
            >
              <Plus className="w-4 h-4 mr-1" />
              {isSubmitting ? 'Creating...' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
