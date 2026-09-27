import React from 'react';
import { X, Palette, Sparkles, Check, RotateCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface CustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomizerModal: React.FC<CustomizerModalProps> = ({ isOpen, onClose }) => {
  const { theme, updateTheme, resetTheme } = useTheme();

  if (!isOpen) return null;

  const accentColors = [
    { label: 'Regal Gold', value: '#d4af37' },
    { label: 'Radiant Amber', value: '#f5c96a' },
    { label: 'Antique Bronze', value: '#cd900c' },
    { label: 'Bright Gold', value: '#ffd700' },
    { label: 'Blood Ember', value: '#e5533d' },
  ];

  const backgrounds = [
    {
      id: 'blood-noir',
      label: 'Deep Blood Noir',
      description: 'Authentic style.css blood-red to black radial gradient',
    },
    {
      id: 'obsidian',
      label: 'Obsidian Crypt',
      description: 'Pitch black with faint crimson undertones',
    },
    {
      id: 'crimson-abyss',
      label: 'Crimson Abyss',
      description: 'Vibrant velvet wine with warm center',
    },
  ];

  const fonts = [
    { id: 'serif', label: 'Libre Baskerville (Original Serif)', fontClass: 'font-serif' },
    { id: 'cinzel', label: 'Cinzel (Gothic Display)', fontClass: 'font-cinzel' },
    { id: 'sans', label: 'Inter (Clean Modern Sans)', fontClass: 'font-sans' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#1a0505] border-2 border-[#b38b4d] rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.4)] p-6 md:p-8 text-left space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#5c1f1f]">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-[#ffd700]" />
            <h2 className="text-xl font-bold text-[#f5c96a]">Aesthetic Customizer</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#b38b4d] hover:text-[#ffd700] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Accent Color Palette */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#b38b4d] mb-3">
            Gold Accent Illumination
          </label>
          <div className="flex flex-wrap gap-3">
            {accentColors.map((color) => {
              const isSelected = theme.accentColor === color.value;
              return (
                <button
                  key={color.value}
                  onClick={() => updateTheme({ accentColor: color.value })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                    isSelected
                      ? 'border-[#ffd700] bg-[#4a1f1f] text-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.6)]'
                      : 'border-[#5c1f1f] bg-[#220707] text-[#e8c88a] hover:border-[#b38b4d]'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/40 shrink-0"
                    style={{ backgroundColor: color.value }}
                  />
                  <span>{color.label}</span>
                  {isSelected && <Check className="w-3 h-3 text-[#ffd700] ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Background Atmosphere */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#b38b4d] mb-3">
            Atmospheric Background
          </label>
          <div className="space-y-2">
            {backgrounds.map((bg) => {
              const isSelected = theme.backgroundVibe === bg.id;
              return (
                <button
                  key={bg.id}
                  onClick={() => updateTheme({ backgroundVibe: bg.id as 'blood-noir' | 'obsidian' | 'crimson-abyss' })}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-[#ffd700] bg-[#3a1010] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                      : 'border-[#5c1f1f] bg-[#1d0606] hover:bg-[#280909]'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${isSelected ? 'text-[#ffd700]' : 'text-[#f5c96a]'}`}>
                      {bg.label}
                    </p>
                    <p className="text-xs text-[#b38b4d]">{bg.description}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#ffd700] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Family Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#b38b4d] mb-3">
            Typography
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {fonts.map((f) => {
              const isSelected = theme.fontFamily === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => updateTheme({ fontFamily: f.id as 'serif' | 'cinzel' | 'sans' })}
                  className={`p-2.5 rounded-lg border text-xs text-center transition-all ${
                    isSelected
                      ? 'border-[#ffd700] bg-[#4a1f1f] text-[#ffd700]'
                      : 'border-[#5c1f1f] bg-[#220707] text-[#e8c88a] hover:border-[#b38b4d]'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Visualizer Mode */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#b38b4d] mb-3">
            Audio Spectrum Visualizer
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['bars', 'wave', 'off'] as const).map((type) => {
              const isSelected = theme.visualizerType === type;
              return (
                <button
                  key={type}
                  onClick={() => updateTheme({ visualizerType: type })}
                  className={`p-2.5 rounded-lg border text-xs capitalize text-center transition-all ${
                    isSelected
                      ? 'border-[#ffd700] bg-[#4a1f1f] text-[#ffd700]'
                      : 'border-[#5c1f1f] bg-[#220707] text-[#e8c88a] hover:border-[#b38b4d]'
                  }`}
                >
                  {type === 'bars' ? 'Frequency Bars' : type === 'wave' ? 'Golden Wave' : 'Disabled'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#5c1f1f] flex items-center justify-between">
          <button
            onClick={resetTheme}
            className="text-xs text-[#b38b4d] hover:text-[#ffd700] flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default
          </button>
          <button onClick={onClose} className="wav-button">
            Apply Styling
          </button>
        </div>
      </div>
    </div>
  );
};
