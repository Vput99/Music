import { Song, Playlist } from './types';

// Exporting samples
export const SAMPLE_AUDIO_1 = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

// YTM Style Mood Filters
export const MOOD_FILTERS = ["Energize", "Relax", "Workout", "Commute", "Focus"];

const DUMMY_LYRICS = `(Lyrics are loaded from AI...)`;

export const MOCK_SONGS: Song[] = [
  {
    id: '13',
    title: 'Sial',
    artist: 'Mahalini',
    album: 'Fabula',
    coverUrl: 'https://i.ytimg.com/vi/M-qW4-qO80k/maxresdefault.jpg',
    youtubeId: 'M-qW4-qO80k',
    duration: 243,
    color: '#fcd34d',
    genre: 'Pop Indo',
  },
  {
    id: '14',
    title: 'Komang',
    artist: 'Raim Laode',
    album: 'Komang',
    coverUrl: 'https://i.ytimg.com/vi/D6tJ95_WkGQ/maxresdefault.jpg',
    youtubeId: 'D6tJ95_WkGQ',
    duration: 222,
    color: '#a8a29e',
    genre: 'Pop Indo',
  },
  {
    id: '15',
    title: 'Cupid (Twin Ver.)',
    artist: 'Fifty Fifty',
    album: 'The Beginning',
    coverUrl: 'https://i.ytimg.com/vi/Qc7_zRjH808/maxresdefault.jpg',
    youtubeId: 'Qc7_zRjH808',
    duration: 174,
    color: '#f472b6',
    genre: 'K-Pop',
  },
  {
    id: '17',
    title: 'Flowers',
    artist: 'Miley Cyrus',
    album: 'Endless Summer',
    coverUrl: 'https://i.ytimg.com/vi/G7KNmW9a75Y/maxresdefault.jpg',
    youtubeId: 'G7KNmW9a75Y',
    duration: 200,
    color: '#db2777',
    genre: 'Pop',
  },
  {
    id: '20',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    coverUrl: 'https://i.ytimg.com/vi/H5v3kku3yIM/maxresdefault.jpg',
    youtubeId: 'H5v3kku3yIM',
    duration: 167,
    color: '#ef4444',
    genre: 'Pop',
  },
  {
    id: '21',
    title: 'Yellow',
    artist: 'Coldplay',
    album: 'Parachutes',
    coverUrl: 'https://i.ytimg.com/vi/yKNxeF4KMsY/maxresdefault.jpg',
    youtubeId: 'yKNxeF4KMsY',
    duration: 269,
    color: '#fbbf24',
    genre: 'Rock'
  },
  {
    id: '22',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    album: 'Single',
    coverUrl: 'https://i.ytimg.com/vi/kPa7bsKwL-c/maxresdefault.jpg',
    youtubeId: 'kPa7bsKwL-c',
    duration: 251,
    color: '#dc2626',
    genre: 'Pop'
  }
];

export const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: 'p4',
    name: 'TikTok FYP Viral',
    description: 'Hits paling rame yang sering lewat di scroll kamu.',
    coverUrl: 'https://i.ytimg.com/vi/Qc7_zRjH808/maxresdefault.jpg',
    songs: ['13', '14', '15', '17', '20']
  },
  {
    id: 'p1',
    name: 'Top Hits',
    description: 'Lagu terpopuler minggu ini.',
    coverUrl: 'https://i.ytimg.com/vi/kPa7bsKwL-c/maxresdefault.jpg',
    songs: ['22', '21', '17', '13']
  }
];