export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  audioUrl?: string; // Optional now, as we prefer youtubeId
  youtubeId?: string; // New: For playing full songs
  duration: number; // in seconds
  color?: string; // Dominant color for UI accents
  genre: string;
  lyrics?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  songs: string[]; // Array of Song IDs
}

export type ViewState = 'HOME' | 'SEARCH' | 'LIBRARY' | 'EXPLORE' | 'PROFILE';

export type PlayerMode = 'MINI' | 'FULL';
export type PlayerTab = 'UP_NEXT' | 'LYRICS' | 'RELATED';
export type MediaMode = 'SONG' | 'VIDEO';

export interface AIPlaylistRequest {
  mood: string;
  activity?: string;
}