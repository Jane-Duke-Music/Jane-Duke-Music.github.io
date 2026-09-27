import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Ensure data directories exist
const DATA_DIR = path.join(__dirname, 'data');
const AUDIO_DIR = path.join(DATA_DIR, 'audio');
const COVERS_DIR = path.join(DATA_DIR, 'covers');
const DB_PATH = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR, { recursive: true });

interface TrackRecord {
  id: string;
  title: string;
  artist: string;
  album: string;
  year?: string;
  genre?: string;
  duration: number;
  format: 'mp3' | 'wav' | 'ogg' | 'flac';
  audioFileName: string;
  coverFileName?: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
  playCount: number;
}

interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'owner' | 'admin' | 'listener';
  createdAt: string;
}

interface PlaylistRecord {
  id: string;
  name: string;
  description: string;
  coverUrl?: string;
  trackIds: string[];
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  tracks: TrackRecord[];
  playlists: PlaylistRecord[];
}

function loadDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    } catch {
      // ignore
    }
  }
  const initialDb: DatabaseSchema = {
    users: [],
    tracks: [],
    playlists: [],
  };
  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: DatabaseSchema) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function hashPassword(pass: string): string {
  return crypto.createHash('sha256').update(pass).digest('hex');
}

// In-memory token storage for sessions
const sessions = new Map<string, { userId: string; role: 'owner' | 'admin' | 'listener'; email: string; name: string }>();

function getSessionUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  return sessions.get(token) || null;
}

async function startServer() {
  const app = express();

  // JSON payload parser for large base64 audio/cover uploads
  app.use(express.json({ limit: '150mb' }));
  app.use(express.urlencoded({ limit: '150mb', extended: true }));

  // Static directory for covers
  app.use('/media/covers', express.static(COVERS_DIR));

  // --- Auth Routes ---
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const db = loadDatabase();
    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Owner assignment: first registered user is owner if no other owner exists
    const isOwner = db.users.filter((u) => u.role === 'owner').length === 0;
    const newUser: UserRecord = {
      id: 'usr_' + crypto.randomUUID(),
      email: email.trim(),
      name: name?.trim() || email.split('@')[0],
      passwordHash: hashPassword(password),
      role: isOwner ? 'owner' : 'listener',
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDatabase(db);

    const token = 'token_' + crypto.randomUUID();
    sessions.set(token, {
      userId: newUser.id,
      role: newUser.role,
      email: newUser.email,
      name: newUser.name,
    });

    return res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const db = loadDatabase();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === hashPassword(password)
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = 'token_' + crypto.randomUUID();
    sessions.set(token, {
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const session = getSessionUser(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    return res.json({ user: session });
  });

  // Owner access check
  app.post('/api/auth/owner-access', (req: Request, res: Response) => {
    const db = loadDatabase();
    const owner = db.users.find((u) => u.role === 'owner');
    if (!owner) {
      return res.status(404).json({ error: 'No administrator account configured.' });
    }

    const token = 'token_' + crypto.randomUUID();
    sessions.set(token, {
      userId: owner.id,
      role: 'owner',
      email: owner.email,
      name: owner.name,
    });

    return res.json({
      token,
      user: {
        id: owner.id,
        email: owner.email,
        name: owner.name,
        role: owner.role,
      },
    });
  });

  // --- Track Routes ---
  app.get('/api/tracks', (_req: Request, res: Response) => {
    const db = loadDatabase();
    return res.json({ tracks: db.tracks });
  });

  // Upload new track (Strictly Logged In Admin / Owner Only)
  app.post('/api/tracks', (req: Request, res: Response) => {
    const session = getSessionUser(req);
    if (!session || (session.role !== 'owner' && session.role !== 'admin')) {
      return res.status(403).json({ error: 'Access Denied: Only the logged in admin can upload music.' });
    }

    const {
      title,
      artist,
      album,
      year,
      genre,
      duration,
      format,
      audioBase64,
      coverBase64,
    } = req.body;

    if (!audioBase64 || !title || !artist) {
      return res.status(400).json({ error: 'Audio data, title, and artist are required' });
    }

    const supportedFormats = ['mp3', 'wav', 'ogg', 'flac'];
    const trackFormat = (format || 'mp3').toLowerCase();
    if (!supportedFormats.includes(trackFormat)) {
      return res.status(400).json({ error: 'Unsupported format. Allowed: MP3, WAV, OGG, FLAC' });
    }

    const trackId = 'trk_' + crypto.randomUUID();
    const audioFileName = `${trackId}.${trackFormat}`;
    const audioFilePath = path.join(AUDIO_DIR, audioFileName);

    // Write binary audio file from base64
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    fs.writeFileSync(audioFilePath, audioBuffer);

    let coverFileName: string | undefined;
    if (coverBase64) {
      coverFileName = `${trackId}.png`;
      const coverBuffer = Buffer.from(coverBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      fs.writeFileSync(path.join(COVERS_DIR, coverFileName), coverBuffer);
    }

    const db = loadDatabase();
    const newTrack: TrackRecord = {
      id: trackId,
      title: title.trim(),
      artist: artist.trim(),
      album: album?.trim() || 'Single',
      year: year ? String(year).trim() : undefined,
      genre: genre?.trim() || 'Gothic / Darkwave',
      duration: Number(duration) || 0,
      format: trackFormat as 'mp3' | 'wav' | 'ogg' | 'flac',
      audioFileName,
      coverFileName,
      fileSize: audioBuffer.length,
      uploadedBy: session.name || 'Admin',
      createdAt: new Date().toISOString(),
      playCount: 0,
    };

    db.tracks.unshift(newTrack);
    saveDatabase(db);

    return res.status(201).json({ track: newTrack });
  });

  // Edit track metadata (Strictly Logged In Admin / Owner Only)
  app.put('/api/tracks/:id', (req: Request, res: Response) => {
    const session = getSessionUser(req);
    if (!session || (session.role !== 'owner' && session.role !== 'admin')) {
      return res.status(403).json({ error: 'Access Denied: Only the logged in admin can edit track metadata.' });
    }

    const { id } = req.params;
    const { title, artist, album, year, genre, coverBase64 } = req.body;

    const db = loadDatabase();
    const trackIndex = db.tracks.findIndex((t) => t.id === id);
    if (trackIndex === -1) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const track = db.tracks[trackIndex];
    if (title) track.title = title.trim();
    if (artist) track.artist = artist.trim();
    if (album) track.album = album.trim();
    if (year !== undefined) track.year = String(year).trim();
    if (genre !== undefined) track.genre = genre.trim();

    if (coverBase64) {
      const coverFileName = `${track.id}.png`;
      const coverBuffer = Buffer.from(coverBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      fs.writeFileSync(path.join(COVERS_DIR, coverFileName), coverBuffer);
      track.coverFileName = coverFileName;
    }

    saveDatabase(db);
    return res.json({ track });
  });

  // Delete track (Strictly Logged In Admin / Owner Only)
  app.delete('/api/tracks/:id', (req: Request, res: Response) => {
    const session = getSessionUser(req);
    if (!session || (session.role !== 'owner' && session.role !== 'admin')) {
      return res.status(403).json({ error: 'Access Denied: Only the logged in admin can delete tracks.' });
    }

    const { id } = req.params;
    const db = loadDatabase();
    const track = db.tracks.find((t) => t.id === id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Delete audio, cached mp3, and cover files
    try {
      const audioPath = path.join(AUDIO_DIR, track.audioFileName);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      const cachedMp3Path = path.join(AUDIO_DIR, `${track.id}.mp3`);
      if (fs.existsSync(cachedMp3Path)) fs.unlinkSync(cachedMp3Path);
      if (track.coverFileName) {
        const coverPath = path.join(COVERS_DIR, track.coverFileName);
        if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
      }
    } catch {
      // ignore
    }

    db.tracks = db.tracks.filter((t) => t.id !== id);
    db.playlists.forEach((p) => {
      p.trackIds = p.trackIds.filter((tId) => tId !== id);
    });

    saveDatabase(db);
    return res.json({ success: true, deletedId: id });
  });

  // Stream Audio with HTTP Range Support for smooth scrubbing/seeking
  app.get('/api/tracks/:id/audio', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    const track = db.tracks.find((t) => t.id === id);
    if (!track) {
      return res.status(404).send('Track not found');
    }

    const audioFilePath = path.join(AUDIO_DIR, track.audioFileName);
    if (!fs.existsSync(audioFilePath)) {
      return res.status(404).send('Audio file missing');
    }

    const stat = fs.statSync(audioFilePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const mimeTypes: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      flac: 'audio/flac',
    };
    const contentType = mimeTypes[track.format] || 'audio/mpeg';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send(`Requested range not satisfiable: ${start} >= ${fileSize}`);
        return;
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(audioFilePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      };
      res.writeHead(200, head);
      fs.createReadStream(audioFilePath).pipe(res);
    }
  });

  // Download track in MP3 format (Publicly Available to All Users: Regular & Admin)
  app.get(['/api/tracks/:id/download-mp3', '/api/tracks/:id/download'], async (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    const track = db.tracks.find((t) => t.id === id);
    if (!track) {
      return res.status(404).send('Track not found');
    }

    const audioFilePath = path.join(AUDIO_DIR, track.audioFileName);
    if (!fs.existsSync(audioFilePath)) {
      return res.status(404).send('Audio file not found on disk');
    }

    const sanitizedFilename = `${track.artist} - ${track.title}.mp3`.replace(/[^\w\s.-]/gi, '_');

    // If native format is already MP3, send directly
    if (track.format === 'mp3') {
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.download(audioFilePath, sanitizedFilename);
    }

    // Check if transcoded MP3 is already cached
    const cachedMp3Path = path.join(AUDIO_DIR, `${track.id}.mp3`);
    if (fs.existsSync(cachedMp3Path)) {
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.download(cachedMp3Path, sanitizedFilename);
    }

    // Convert WAV, OGG, or FLAC to MP3 via ffmpeg
    try {
      const { execFile } = await import('child_process');
      execFile(
        'ffmpeg',
        ['-i', audioFilePath, '-vn', '-ar', '44100', '-ac', '2', '-b:a', '320k', cachedMp3Path],
        (error) => {
          if (error) {
            console.error('FFmpeg transcoding error:', error);
            // Fallback to original file with appropriate filename
            return res.download(audioFilePath, `${track.artist} - ${track.title}.${track.format}`);
          }
          res.setHeader('Content-Type', 'audio/mpeg');
          res.download(cachedMp3Path, sanitizedFilename);
        }
      );
    } catch (err) {
      console.error('Failed to execute ffmpeg transcoding:', err);
      res.download(audioFilePath, `${track.artist} - ${track.title}.${track.format}`);
    }
  });

  // Track Play Counter
  app.post('/api/tracks/:id/played', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    const track = db.tracks.find((t) => t.id === id);
    if (track) {
      track.playCount = (track.playCount || 0) + 1;
      saveDatabase(db);
      return res.json({ playCount: track.playCount });
    }
    return res.status(404).json({ error: 'Track not found' });
  });

  // --- Playlist Routes ---
  app.get('/api/playlists', (req: Request, res: Response) => {
    const session = getSessionUser(req);
    const db = loadDatabase();
    // Return all public playlists plus user's playlists
    const playlists = db.playlists.filter(
      (p) => p.isPublic || (session && p.userId === session.userId)
    );
    return res.json({ playlists });
  });

  app.post('/api/playlists', (req: Request, res: Response) => {
    const session = getSessionUser(req);
    const { name, description, coverUrl, trackIds, isPublic } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Playlist name required' });
    }

    const db = loadDatabase();
    const newPlaylist: PlaylistRecord = {
      id: 'pl_' + crypto.randomUUID(),
      name: name.trim(),
      description: description?.trim() || '',
      coverUrl: coverUrl || '',
      trackIds: Array.isArray(trackIds) ? trackIds : [],
      userId: session?.userId || 'guest',
      isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.playlists.push(newPlaylist);
    saveDatabase(db);
    return res.status(201).json({ playlist: newPlaylist });
  });

  app.put('/api/playlists/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, coverUrl, trackIds, isPublic } = req.body;
    const db = loadDatabase();
    const playlist = db.playlists.find((p) => p.id === id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (name) playlist.name = name.trim();
    if (description !== undefined) playlist.description = description.trim();
    if (coverUrl !== undefined) playlist.coverUrl = coverUrl;
    if (trackIds && Array.isArray(trackIds)) playlist.trackIds = trackIds;
    if (isPublic !== undefined) playlist.isPublic = Boolean(isPublic);
    playlist.updatedAt = new Date().toISOString();

    saveDatabase(db);
    return res.json({ playlist });
  });

  app.delete('/api/playlists/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    db.playlists = db.playlists.filter((p) => p.id !== id);
    saveDatabase(db);
    return res.json({ success: true, deletedId: id });
  });

  // Cross-device sync export/import backup
  app.get('/api/sync/export', (_req: Request, res: Response) => {
    const db = loadDatabase();
    return res.json({
      exportedAt: new Date().toISOString(),
      tracks: db.tracks,
      playlists: db.playlists,
    });
  });

  // Vite Integration: in development mount Vite middlewares
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sonora Noir server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
