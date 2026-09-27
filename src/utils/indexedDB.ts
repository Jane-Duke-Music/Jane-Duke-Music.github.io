import { Track, Playlist, CustomTheme } from '../types';

const DB_NAME = 'SonoraNoirAudioDB';
const DB_VERSION = 1;

export interface StoredAudioBlob {
  trackId: string;
  blob: Blob;
  format: string;
  cachedAt: string;
}

export function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Local tracks created on device
      if (!db.objectStoreNames.contains('localTracks')) {
        db.createObjectStore('localTracks', { keyPath: 'id' });
      }

      // Binary audio Blobs for offline playback & local files
      if (!db.objectStoreNames.contains('audioBlobs')) {
        db.createObjectStore('audioBlobs', { keyPath: 'trackId' });
      }

      // Local playlists
      if (!db.objectStoreNames.contains('localPlaylists')) {
        db.createObjectStore('localPlaylists', { keyPath: 'id' });
      }

      // Favorite track IDs
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' });
      }

      // App settings / themes
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}


// Store binary audio blob for offline caching or local storage
export async function saveAudioBlobToDB(trackId: string, blob: Blob, format: string): Promise<void> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('audioBlobs', 'readwrite');
    const store = tx.objectStore('audioBlobs');
    const item: StoredAudioBlob = {
      trackId,
      blob,
      format,
      cachedAt: new Date().toISOString(),
    };
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Retrieve cached audio blob
export async function getAudioBlobFromDB(trackId: string): Promise<Blob | null> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('audioBlobs', 'readonly');
    const store = tx.objectStore('audioBlobs');
    const req = store.get(trackId);
    req.onsuccess = () => {
      const result = req.result as StoredAudioBlob | undefined;
      resolve(result ? result.blob : null);
    };
    req.onerror = () => reject(req.error);
  });
}

// Check which track IDs are cached offline
export async function getOfflineCachedTrackIds(): Promise<Set<string>> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('audioBlobs', 'readonly');
    const store = tx.objectStore('audioBlobs');
    const req = store.getAllKeys();
    req.onsuccess = () => {
      const keys = req.result as string[];
      resolve(new Set(keys));
    };
    req.onerror = () => reject(req.error);
  });
}

// Remove cached audio blob
export async function removeAudioBlobFromDB(trackId: string): Promise<void> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('audioBlobs', 'readwrite');
    const store = tx.objectStore('audioBlobs');
    const req = store.delete(trackId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Favorites management
export async function getFavoritesFromDB(): Promise<string[]> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('favorites', 'readonly');
    const store = tx.objectStore('favorites');
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result || []).map((item: { id: string }) => item.id));
    req.onerror = () => reject(req.error);
  });
}

export async function toggleFavoriteInDB(trackId: string, isFav: boolean): Promise<void> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');
    const req = isFav ? store.put({ id: trackId }) : store.delete(trackId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Theme settings persistence
export async function getStoredTheme(): Promise<CustomTheme | null> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get('theme');
      req.onsuccess = () => resolve(req.result?.value || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveStoredTheme(theme: CustomTheme): Promise<void> {
  try {
    const db = await openAudioDB();
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    store.put({ key: 'theme', value: theme });
  } catch {
    // ignore
  }
}

// Local Playlists
export async function getLocalPlaylistsFromDB(): Promise<Playlist[]> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('localPlaylists', 'readonly');
    const store = tx.objectStore('localPlaylists');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLocalPlaylistToDB(playlist: Playlist): Promise<void> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('localPlaylists', 'readwrite');
    const store = tx.objectStore('localPlaylists');
    const req = store.put(playlist);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteLocalPlaylistFromDB(id: string): Promise<void> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('localPlaylists', 'readwrite');
    const store = tx.objectStore('localPlaylists');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
