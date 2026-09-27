import React, { useState } from 'react';
import { X, Lock, User, Crown, KeyRound, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, isOwner, login, register, logout } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    let res;
    if (mode === 'login') {
      res = await login(email, password);
    } else {
      res = await register(email, password, name);
    }

    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Authentication error');
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

        {user ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#4a1f1f] border-2 border-[#ffd700] flex items-center justify-center text-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.4)]">
                {isOwner ? <Crown className="w-6 h-6 text-[#ffd700]" /> : <User className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#f5c96a] text-lg">{user.name}</h3>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                    isOwner
                      ? 'bg-[#ffd700] text-black border-[#ffd700]'
                      : 'bg-[#350a0a] text-[#ffd700] border-[#b38b4d]'
                  }`}>
                    {isOwner ? 'Library Owner' : 'Listener'}
                  </span>
                </div>
                <p className="text-xs text-[#b38b4d]">{user.email}</p>
              </div>
            </div>

            <div className="p-3 bg-[#120303] border border-[#5c1f1f] rounded-lg text-xs space-y-1">
              <p className="text-[#ffd700] font-semibold">
                {isOwner ? '✓ Owner Access Active' : 'Listener Account'}
              </p>
              <p className="text-[#e8c88a]">
                {isOwner
                  ? 'You possess full authorization to upload audio, edit metadata, delete tracks, and sync files.'
                  : 'You can stream audio, create custom playlists, cache tracks offline, and download MP3s.'}
              </p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full py-2 bg-[#2d0a0a] hover:bg-[#4a1f1f] border border-[#b38b4d] rounded text-xs text-[#ffd700] font-semibold transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Lock className="w-5 h-5 text-[#ffd700]" />
              <h2 className="text-xl font-bold text-[#f5c96a]">
                {mode === 'login' ? 'Account Sign In' : 'Create User Account'}
              </h2>
            </div>
            <p className="text-xs text-[#e8c88a]/80 mb-6">
              Sign in to manage your library and cross-device sync.
            </p>

            {errorMsg && (
              <div className="mb-4 p-2.5 bg-red-950/70 border border-red-500 rounded text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-[#b38b4d] mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#120303] border border-[#5c1f1f] focus:border-[#d4af37] rounded text-sm text-[#ffd700] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#b38b4d] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#120303] border border-[#5c1f1f] focus:border-[#d4af37] rounded text-sm text-[#ffd700] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#b38b4d] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#120303] border border-[#5c1f1f] focus:border-[#d4af37] rounded text-sm text-[#ffd700] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full wav-button py-2.5 mt-2"
              >
                {isSubmitting
                  ? 'Verifying...'
                  : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setErrorMsg(null);
                }}
                className="text-xs text-[#b38b4d] hover:text-[#ffd700] underline"
              >
                {mode === 'login'
                  ? "Don't have an account? Register"
                  : 'Already have an account? Sign In'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
