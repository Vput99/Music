import { Song, Playlist } from './types';

// Exporting samples
export const SAMPLE_AUDIO_1 = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

// YTM Style Mood Filters
export const MOOD_FILTERS = ["Energize", "Relax", "Workout", "Commute", "Focus"];

export const GENRE_CATEGORIES = [
  { id: 'pop-indo', name: 'Pop Indo', color: 'from-red-500 to-pink-600', emoji: '🇮🇩' },
  { id: 'k-pop', name: 'K-Pop', color: 'from-pink-400 to-purple-500', emoji: '🫰' },
  { id: 'western', name: 'Western Pop', color: 'from-blue-500 to-cyan-500', emoji: '🌎' },
  { id: 'dangdut', name: 'Dangdut Koplo', color: 'from-yellow-500 to-orange-600', emoji: '💃' },
  { id: 'rock', name: 'Rock Hits', color: 'from-slate-700 to-black', emoji: '🎸' },
  { id: 'lofi', name: 'Lofi Study', color: 'from-indigo-400 to-blue-400', emoji: '☕' },
  { id: 'nasheed', name: 'Religi', color: 'from-emerald-500 to-teal-600', emoji: '🕌' },
  { id: '90s', name: '90s Nostalgia', color: 'from-orange-400 to-red-500', emoji: '📼' },
];

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
  },
  {
    id: '23',
    title: 'Sumpah Mati Padamu',
    artist: 'Rusdi',
    album: 'Single',
    coverUrl: 'https://i.ytimg.com/vi/XXmKK_5rAQU/maxresdefault.jpg',
    youtubeId: 'XXmKK_5rAQU',
    duration: 205,
    color: '#4b5563',
    genre: 'Pop Indo'
  }
];

export const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: 'p4',
    name: 'TikTok FYP Viral',
    description: 'Hits paling rame yang sering lewat di scroll kamu.',
    coverUrl: 'https://i.ytimg.com/vi/Qc7_zRjH808/maxresdefault.jpg',
    songs: ['13', '14', '15', '17', '20', '23']
  },
  {
    id: 'p1',
    name: 'Top Hits',
    description: 'Lagu terpopuler minggu ini.',
    coverUrl: 'https://i.ytimg.com/vi/kPa7bsKwL-c/maxresdefault.jpg',
    songs: ['22', '21', '17', '13', '23']
  }
];