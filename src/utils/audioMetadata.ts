import { AudioFormat } from '../types';

export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getAudioFormatFromFilename(filename: string): AudioFormat {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'wav') return 'wav';
  if (ext === 'ogg') return 'ogg';
  if (ext === 'flac') return 'flac';
  return 'mp3';
}

export function parseFilenameMetadata(filename: string): { title: string; artist: string; album: string } {
  // Strip extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '').trim();

  // Strip leading track numbers like "01 - " or "1. "
  const cleanedName = nameWithoutExt.replace(/^(\d{1,3}[\s._-]+)/, '').trim();

  // Try split by " - "
  if (cleanedName.includes(' - ')) {
    const parts = cleanedName.split(' - ');
    if (parts.length >= 2) {
      return {
        artist: parts[0].trim(),
        title: parts.slice(1).join(' - ').trim(),
        album: 'Single / Self-Titled',
      };
    }
  }

  // Fallback
  return {
    title: cleanedName || 'Untitled Track',
    artist: 'Unknown Artist',
    album: 'Gothic Collection',
  };
}

export function getAudioDuration(file: File | Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(audio.duration || 0);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback estimate if browser metadata reader fails
      resolve(180);
    };

    audio.src = objectUrl;
  });
}

export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
