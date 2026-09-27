import React, { useState, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AudioPlayerProvider, useAudioPlayer } from './context/AudioPlayerContext';
import { Sidebar, MainNavView } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { PersistentPlayerBar } from './components/PersistentPlayerBar';
import { AlbumGrid } from './components/AlbumGrid';
import { AlbumDetailView } from './components/AlbumDetailView';
import { TrackListView } from './components/TrackListView';
import { PlaylistDetailView } from './components/PlaylistDetailView';
import { OfflineVaultView } from './components/OfflineVaultView';
import { UploadStudioModal } from './components/UploadStudioModal';
import { MetadataEditModal } from './components/MetadataEditModal';
import { PlaylistModal } from './components/PlaylistModal';
import { CustomizerModal } from './components/CustomizerModal';
import { AuthModal } from './components/AuthModal';
import { QueueDrawer } from './components/QueueDrawer';
import { Album, Playlist, Track } from './types';
import {
  Disc,
  Play,
  Music,
  Clock,
  HardDrive,
  ListMusic,
  Plus,
  Upload,
  Crown,
  Sparkles,
} from 'lucide-react';
import { formatTime } from './utils/audioMetadata';

function MainPlayerApp() {
  const { tracks, albums, playlists, playTrack, isPlaying } = useAudioPlayer();
  const { isOwner, user } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState<MainNavView>('albums');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      const matchesSearch =
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.album.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (track.genre && track.genre.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [tracks, searchQuery]);

  const handleEditTrack = (track: Track) => {
    setEditingTrack(track);
    setIsEditModalOpen(true);
  };

  const totalVaultDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-serif selection:bg-[#5c1f1f] selection:text-[#ffd700]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => {
          setCurrentView(v);
          setSelectedAlbum(null);
          setSelectedPlaylist(null);
        }}
        onOpenCreatePlaylist={() => setIsPlaylistModalOpen(true)}
        onSelectPlaylist={(pl) => {
          setSelectedPlaylist(pl);
          setSelectedAlbum(null);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className="lg:pl-64 md:lg:pl-72 flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenCustomizer={() => setIsCustomizerOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Scrollable Viewport with extra bottom padding for the persistent playback bar */}
        <main className="flex-1 px-4 md:px-8 py-8 max-w-7xl mx-auto w-full pb-36">
          {/* View 1: Selected Album Detail */}
          {selectedAlbum ? (
            <AlbumDetailView
              album={selectedAlbum}
              onBack={() => setSelectedAlbum(null)}
              onOpenUpload={() => setIsUploadOpen(true)}
              onEditTrack={handleEditTrack}
            />
          ) : selectedPlaylist ? (
            /* View 2: Selected Playlist Detail */
            <PlaylistDetailView
              playlist={selectedPlaylist}
              onBack={() => setSelectedPlaylist(null)}
              onOpenUpload={() => setIsUploadOpen(true)}
              onEditTrack={handleEditTrack}
            />
          ) : currentView === 'albums' ? (
            /* View 3: Album Selector Grid */
            <AlbumGrid
              onSelectAlbum={(alb) => setSelectedAlbum(alb)}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          ) : currentView === 'library' ? (
            /* View 4: Library Master Tracks */
            <div className="space-y-6">
              {/* Vault Header Banner */}
              <div className="bg-[#280a0a]/80 border-2 border-[#5c1f1f] rounded-2xl p-6 md:p-8 shadow-[0_0_35px_rgba(0,0,0,0.85)] flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-[#4a1f1f] text-[#ffd700] border border-[#b38b4d]/50">
                      Master Vault
                    </span>
                    {isOwner && (
                      <span className="text-xs uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-[#ffd700] text-black border border-[#ffd700] flex items-center gap-1 font-sans">
                        <Crown className="w-3 h-3" /> Owner Active
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-4xl font-bold text-[#f5c96a] drop-shadow-[0_0_15px_rgba(247,183,46,0.5)]">
                    All Catalogued Master Tracks
                  </h2>
                  <p className="text-xs text-[#d4bd0c] mt-1 max-w-xl">
                    High-resolution audio streaming with local storage persistence, seamless scrubbing, and lossless downloads.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#d4af37]/80 pt-3">
                    <span className="flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-[#b38b4d]" />
                      {tracks.length} {tracks.length === 1 ? 'Track' : 'Tracks'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-[#b38b4d]" />
                      {formatTime(totalVaultDuration)} Total Runtime
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Disc className="w-3.5 h-3.5 text-[#b38b4d]" />
                      {albums.length} {albums.length === 1 ? 'Album' : 'Albums'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {tracks.length > 0 && (
                    <button
                      onClick={() => playTrack(tracks[0], tracks)}
                      className="wav-button"
                    >
                      <Play className="w-4 h-4 fill-current mr-1" />
                      Play All
                    </button>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => setIsUploadOpen(true)}
                      className="px-4 py-2.5 rounded-lg border border-[#ffd700] bg-[#2d0a0a] text-[#ffd700] hover:bg-[#4a1f1f] text-sm font-semibold transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Audio (Admin)
                    </button>
                  )}
                </div>
              </div>

              {/* Master Tracklist Table */}
              <TrackListView
                tracks={filteredTracks}
                customQueue={filteredTracks}
                onOpenUpload={() => setIsUploadOpen(true)}
                onEditTrack={handleEditTrack}
              />
            </div>
          ) : currentView === 'playlists' ? (
            /* View 5: Playlists Hub */
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#5c1f1f]/60">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-[#cd900c]">
                    Playlists Collection
                  </h2>
                  <p className="text-xs text-[#d4bd0c] mt-1">
                    Curate atmospheric sets and ritual listening flows
                  </p>
                </div>
                <button
                  onClick={() => setIsPlaylistModalOpen(true)}
                  className="wav-button py-2 text-xs"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New Playlist
                </button>
              </div>

              {playlists.length === 0 ? (
                <div className="py-16 text-center gothic-card p-10 border border-[#5c1f1f]">
                  <ListMusic className="w-16 h-16 mx-auto mb-4 text-[#d4af37] opacity-60" />
                  <h3 className="text-xl font-bold text-[#f5c96a] mb-2">No Playlists Created</h3>
                  <p className="text-[#e8c88a] text-xs max-w-sm mx-auto mb-6">
                    Organize your library into customized collections with offline sync support.
                  </p>
                  <button
                    onClick={() => setIsPlaylistModalOpen(true)}
                    className="wav-button"
                  >
                    Create Your First Playlist
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {playlists.map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => setSelectedPlaylist(pl)}
                      className="gothic-card p-6 cursor-pointer hover:-translate-y-1.5 transition-all text-left flex flex-col justify-between group"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-lg bg-[#3a0a0a] border border-[#b38b4d] flex items-center justify-center text-[#ffd700] shadow-[0_0_15px_rgba(179,139,77,0.3)] shrink-0">
                          <ListMusic className="w-7 h-7" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-[#f5c96a] group-hover:text-[#ffd700] transition-colors truncate text-lg">
                            {pl.name}
                          </h4>
                          <p className="text-xs text-[#b38b4d]">
                            {pl.trackIds.length} {pl.trackIds.length === 1 ? 'Track' : 'Tracks'}
                          </p>
                        </div>
                      </div>

                      {pl.description && (
                        <p className="text-xs text-[#e8c88a]/80 line-clamp-2 italic mb-4">
                          {pl.description}
                        </p>
                      )}

                      <div className="pt-3 border-t border-[#5c1f1f]/40 flex items-center justify-between text-xs text-[#ffd700]">
                        <span>Open Playlist</span>
                        <span>→</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : currentView === 'offline' ? (
            /* View 6: Offline Vault */
            <OfflineVaultView
              onBack={() => setCurrentView('albums')}
              onOpenUpload={() => setIsUploadOpen(true)}
              onEditTrack={handleEditTrack}
            />
          ) : currentView === 'upload' ? (
            /* View 7: Upload Studio inline redirect */
            <div className="py-12 text-center gothic-card p-10 border border-[#5c1f1f]">
              <Upload className="w-16 h-16 mx-auto mb-4 text-[#ffd700]" />
              <h3 className="text-2xl font-bold text-[#f5c96a] mb-2">
                {isOwner ? 'Master Audio Upload Studio' : 'Admin Area Restricted'}
              </h3>
              <p className="text-xs text-[#e8c88a] max-w-md mx-auto mb-6">
                {isOwner
                  ? 'Upload lossless MP3, WAV, OGG, or FLAC master files with custom artwork and metadata to the central player.'
                  : 'Only the logged in administrator can upload music to this player. Regular users can stream and download tracks in MP3 format.'}
              </p>
              {isOwner ? (
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="wav-button"
                >
                  Launch Upload Studio Modal
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="wav-button"
                >
                  Sign In as Administrator
                </button>
              )}
            </div>
          ) : null}
        </main>
      </div>

      {/* Persistent Bottom Playback Bar */}
      <PersistentPlayerBar
        onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
        isQueueOpen={isQueueOpen}
      />

      {/* Queue Drawer */}
      <QueueDrawer isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />

      {/* Upload Studio Modal */}
      <UploadStudioModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      {/* Metadata Edit Modal */}
      <MetadataEditModal
        track={editingTrack}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTrack(null);
        }}
      />

      {/* Playlist Create Modal */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        onPlaylistCreated={(id) => {
          const pl = playlists.find((p) => p.id === id);
          if (pl) setSelectedPlaylist(pl);
        }}
      />

      {/* Theme Customizer Modal */}
      <CustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
      />

      {/* Auth & Owner Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AudioPlayerProvider>
          <MainPlayerApp />
        </AudioPlayerProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
