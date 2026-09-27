import React from 'react';
import {
  Menu,
  Search,
  Sliders,
  Upload,
  User,
  Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoRRR from '../assets/img/logo-RRR.png';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenUpload: () => void;
  onOpenAuth: () => void;
  onOpenCustomizer: () => void;
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenUpload,
  onOpenAuth,
  onOpenCustomizer,
  onToggleMobileMenu,
}) => {
  const { user, isOwner } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#160404]/90 backdrop-blur-md border-b border-[#5c1f1f] px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Mobile Toggle & Logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 text-[#ffd700] hover:bg-[#380c0c] rounded-lg"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img
          src={logoRRR}
          alt="RRR Logo"
          referrerPolicy="no-referrer"
          className="h-7 w-auto object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]"
        />
      </div>

      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-[#b38b4d] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search tracks, artists, albums, or genres..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-[#200505] border border-[#5c1f1f] focus:border-[#d4af37] rounded-full text-xs md:text-sm text-[#ffd700] placeholder-[#b38b4d]/70 focus:outline-none transition-colors shadow-inner"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Upload Audio button (Strictly Logged In Admin Only) */}
        {isOwner && (
          <button
            onClick={onOpenUpload}
            className="wav-button py-1.5 px-3 text-xs md:text-xs"
            title="Upload master recording (Admin Only)"
          >
            <Upload className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Upload Audio</span>
          </button>
        )}

        {/* Customizer */}
        <button
          onClick={onOpenCustomizer}
          className="p-2 text-[#b38b4d] hover:text-[#ffd700] hover:bg-[#340b0b] rounded-lg border border-transparent hover:border-[#5c1f1f] transition-all"
          title="Customize Theme"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* User Account / Admin Badge */}
        <button
          onClick={onOpenAuth}
          className="p-1.5 rounded-lg border border-[#5c1f1f] hover:border-[#ffd700] bg-[#220707] hover:bg-[#350d0d] flex items-center gap-1.5 text-xs text-[#ffd700] transition-all"
          title={user ? `Signed in as ${user.name}` : 'Sign In'}
        >
          {isOwner ? (
            <Crown className="w-4 h-4 text-[#ffd700]" />
          ) : (
            <User className="w-4 h-4 text-[#ffd700]" />
          )}
          <span className="hidden md:inline font-semibold">
            {user ? (isOwner ? 'Admin Active' : user.name.split(' ')[0]) : 'Sign In'}
          </span>
        </button>
      </div>
    </header>
  );
};
