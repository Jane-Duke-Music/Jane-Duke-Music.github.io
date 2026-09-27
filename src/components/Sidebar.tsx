import React from 'react';
import {
  Disc,
  Library,
  ListMusic,
  Plus,
  Wifi,
  WifiOff,
  Upload,
  Crown,
  User,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useAuth } from '../context/AuthContext';
import { Playlist } from '../types';
import logoRRR from '../assets/img/logo-RRR.png';

export type MainNavView = 'library' | 'albums' | 'playlists' | 'offline' | 'upload';

interface SidebarProps {
  currentView: MainNavView;
  onSelectView: (view: MainNavView) => void;
  onOpenCreatePlaylist: () => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onOpenAuth: () => void;
  onOpenCustomizer: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onOpenCreatePlaylist,
  onSelectPlaylist,
  onOpenAuth,
  onOpenCustomizer,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { playlists, isOnline, offlineTrackIds } = useAudioPlayer();
  const { user, isOwner } = useAuth();

  const handleNavClick = (view: MainNavView) => {
    onSelectView(view);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-24 left-0 w-64 md:w-72 bg-[#120303]/95 border-r-2 border-[#5c1f1f] z-40 flex flex-col transition-transform duration-300 backdrop-blur-md ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo & Branding */}
        <div
          className="border-b border-[#5c1f1f] text-center flex flex-col items-center justify-center w-[244px] h-[67px] mx-auto overflow-hidden"
        >
          <img
            src={logoRRR}
            alt="RRR Logo"
            referrerPolicy="no-referrer"
            className="w-[150px] h-[100px] object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
          />
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          <button
            onClick={() => handleNavClick('albums')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              currentView === 'albums'
                ? 'bg-[#4a1f1f] text-[#ffd700] border border-[#b38b4d] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                : 'text-[#d4af37] hover:bg-[#280a0a] hover:text-[#ffd700]'
            }`}
          >
            <Disc className="w-4 h-4 text-[#ffd700]" />
            Discography & Albums
          </button>

          <button
            onClick={() => handleNavClick('playlists')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              currentView === 'playlists'
                ? 'bg-[#4a1f1f] text-[#ffd700] border border-[#b38b4d] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                : 'text-[#d4af37] hover:bg-[#280a0a] hover:text-[#ffd700]'
            }`}
          >
            <ListMusic className="w-4 h-4 text-[#ffd700]" />
            Playlists
          </button>

          {/* Admin Upload Studio (Strictly Logged In Admin Only) */}
          {isOwner && (
            <button
              onClick={() => handleNavClick('upload')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'upload'
                  ? 'bg-[#4a1f1f] text-[#ffd700] border border-[#ffd700] shadow-[0_0_15px_rgba(212,175,55,0.6)]'
                  : 'text-[#ffd700] hover:bg-[#280a0a] border border-[#ffd700]/50'
              }`}
            >
              <span className="flex items-center gap-3">
                <Upload className="w-4 h-4 text-[#ffd700]" />
                Upload Audio (Admin)
              </span>
              <Crown className="w-3.5 h-3.5 text-[#ffd700]" />
            </button>
          )}
        </nav>

        {/* Playlists Section */}
        <div className="px-4 py-3 flex-1 flex flex-col min-h-0 border-t border-[#5c1f1f]/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#b38b4d]">
              Playlists
            </span>
            <button
              onClick={onOpenCreatePlaylist}
              className="p-1 rounded text-[#ffd700] hover:bg-[#4a1f1f] transition-colors"
              title="Create new playlist"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {playlists.length === 0 ? (
              <p className="text-xs text-[#b38b4d]/70 italic py-2">No playlists yet</p>
            ) : (
              playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => {
                    onSelectPlaylist(pl);
                    onCloseMobile();
                  }}
                  className="w-full text-left px-3 py-1.5 rounded text-xs text-[#e8c88a] hover:text-[#ffd700] hover:bg-[#280a0a] truncate transition-colors flex items-center gap-2"
                >
                  <ListMusic className="w-3 h-3 text-[#b38b4d] shrink-0" />
                  <span className="truncate">{pl.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer: Network status */}
        <div className="p-3 border-t border-[#5c1f1f] bg-[#0c0202] flex items-center justify-between text-xs text-[#b38b4d]">
          <span className="text-[11px] uppercase tracking-wider font-medium">Network</span>
          <div className="flex items-center gap-1.5" title={isOnline ? 'Online Sync Active' : 'Offline Mode'}>
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[11px] text-green-400 font-mono">Online</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-[11px] text-amber-400 font-mono">Offline</span>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
