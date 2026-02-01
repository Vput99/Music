import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { 
  Home, 
  Search, 
  Library, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Sparkles, 
  Heart,
  ChevronDown, 
  MoreVertical,
  Repeat,
  Shuffle,
  Compass,
  MonitorPlay,
  Download,
  Clock,
  Music2,
  Settings,
  X,
  Key,
  Save,
  Plus,
  Trash2,
  Link as LinkIcon,
  Image as ImageIcon
} from 'lucide-react';
import { MOCK_SONGS, MOCK_PLAYLISTS, MOOD_FILTERS } from './constants';
import { Song, ViewState, PlayerMode, PlayerTab, MediaMode } from './types';
import { generateSmartPlaylist, generateLyrics } from './services/geminiService';

// --- Components ---

const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean, size?: number }> = ({ 
    children, className = '', active, size = 10, ...props 
}) => (
    <button 
        className={`rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${active ? 'text-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'text-neutral-400 hover:text-white hover:bg-white/5'} ${className}`} 
        style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
        {...props}
    >
        {children}
    </button>
);

const Chip: React.FC<{ label: string; onClick: () => void; isActive?: boolean }> = ({ label, onClick, isActive }) => (
    <button 
        onClick={onClick}
        className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 transform active:scale-95 ${
            isActive 
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-transparent' 
            : 'bg-white/5 text-neutral-300 border border-white/10 hover:bg-white/10'
        }`}
    >
        {label}
    </button>
);

const SongListItem: React.FC<{ song: Song; onClick: () => void; isPlaying: boolean; index?: number; onDelete?: (id: string) => void }> = ({ song, onClick, isPlaying, index, onDelete }) => (
    <div onClick={onClick} className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer group transition-all duration-200 active:scale-[0.98] ${isPlaying ? 'bg-white/10 border border-white/5' : 'hover:bg-white/5 border border-transparent'}`}>
        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
            <img src={song.coverUrl} className={`w-full h-full object-cover transition-opacity duration-500 ${isPlaying ? 'opacity-40' : ''}`} alt="" onError={(e) => e.currentTarget.src = 'https://placehold.co/100x100?text=Music'} />
            {isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center gap-1">
                    <div className="w-1 h-5 bg-green-400 rounded-full animate-[bounce_1s_infinite_0ms]" />
                    <div className="w-1 h-8 bg-green-400 rounded-full animate-[bounce_1s_infinite_200ms]" />
                    <div className="w-1 h-4 bg-green-400 rounded-full animate-[bounce_1s_infinite_400ms]" />
                </div>
            )}
        </div>
        <div className="flex-1 min-w-0">
            <h4 className={`font-semibold truncate text-[15px] ${isPlaying ? 'text-green-400' : 'text-white'}`}>{song.title}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
                {song.id.startsWith('ai_gen') && <Sparkles size={12} className="text-purple-400" />}
                <p className="text-sm text-neutral-400 truncate">{song.artist}</p>
            </div>
        </div>
        <div className="text-neutral-500 text-xs font-medium hidden sm:block">
            {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
        </div>
        
        {onDelete ? (
             <IconButton 
                className="hover:bg-red-500/20 hover:text-red-500" 
                size={8} 
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(song.id);
                }}
             >
                <Trash2 size={16} />
             </IconButton>
        ) : (
            <IconButton className="opacity-0 group-hover:opacity-100 sm:opacity-0" size={8}>
                <MoreVertical size={16} />
            </IconButton>
        )}
    </div>
);

// --- Modals ---

const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [apiKey, setApiKey] = useState(localStorage.getItem('VICKY_USER_API_KEY') || '');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        if (apiKey.trim()) {
            localStorage.setItem('VICKY_USER_API_KEY', apiKey.trim());
        } else {
            localStorage.removeItem('VICKY_USER_API_KEY');
        }
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            onClose();
            window.location.reload(); // Reload to apply new service instance
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white">
                    <X size={20} />
                </button>
                
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Settings size={20} className="text-purple-400" />
                    </div>
                    <h2 className="text-xl font-bold">Settings</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Google AI API Key</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Key size={16} className="text-neutral-500" />
                            </div>
                            <input 
                                type="password" 
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Paste your Gemini API Key here"
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                            />
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-2 leading-relaxed">
                            Jika Anda mengalami error "Quota", buat API Key gratis baru di <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-purple-400 hover:underline">Google AI Studio</a> dan tempelkan di sini.
                        </p>
                    </div>

                    <button 
                        onClick={handleSave}
                        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${saved ? 'bg-green-500 text-black' : 'bg-white text-black hover:bg-neutral-200'}`}
                    >
                        {saved ? 'Saved!' : <><Save size={16} /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AddSongModal: React.FC<{ onClose: () => void; onAdd: (url: string, title: string, artist: string) => void }> = ({ onClose, onAdd }) => {
    const [url, setUrl] = useState('');
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    
    // Helper to extract ID to show preview thumbnail
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };
    
    const videoId = getYouTubeId(url);

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white">
                    <X size={20} />
                </button>
                
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Plus size={20} className="text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold">Add Song</h2>
                </div>

                <div className="space-y-4">
                    {/* YouTube Link Input */}
                    <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">YouTube Link</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <LinkIcon size={16} className="text-neutral-500" />
                            </div>
                            <input 
                                type="text" 
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste YouTube URL here..."
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Preview Thumbnail */}
                    {videoId && (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10">
                            <img 
                                src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`} 
                                className="w-full h-full object-cover"
                                alt="Preview"
                                onError={(e) => e.currentTarget.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play size={24} className="text-white drop-shadow-md" />
                            </div>
                        </div>
                    )}

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Title</label>
                            <input 
                                type="text" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Song Title"
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-blue-500 focus:outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Artist</label>
                            <input 
                                type="text" 
                                value={artist}
                                onChange={(e) => setArtist(e.target.value)}
                                placeholder="Artist Name"
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-blue-500 focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            if(url && title && artist) onAdd(url, title, artist);
                        }}
                        disabled={!videoId || !title || !artist}
                        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${videoId && title && artist ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-white/10 text-neutral-500 cursor-not-allowed'}`}
                    >
                        <Plus size={16} /> Add to Library
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Views ---

const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

interface TopBarProps {
    currentView: ViewState;
    setCurrentView: (view: ViewState) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    handleAiSearch: (query: string) => void;
    isAiLoading: boolean;
    installPrompt: any;
    handleInstall: () => void;
    onOpenSettings: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ 
    setCurrentView, searchQuery, setSearchQuery, handleAiSearch, isAiLoading, installPrompt, handleInstall, onOpenSettings
}) => (
    <div className="sticky top-0 z-30 bg-black/50 backdrop-blur-md flex items-center gap-4 px-4 py-3 pt-safe border-b border-white/5 transition-all">
       <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('HOME')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
              <Music2 fill="white" size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">Vicky</span>
       </div>

       <div className="flex-1 max-w-xl mx-auto hidden sm:block relative group">
           <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
               <Search size={18} className="text-neutral-500 group-focus-within:text-purple-400 transition-colors" />
           </div>
           <input 
              type="text" 
              placeholder="Search songs, AI mood..." 
              className="w-full bg-[#1a1a1a] text-white rounded-full pl-10 pr-4 py-2.5 focus:outline-none focus:bg-[#2a2a2a] focus:ring-2 focus:ring-purple-500/50 transition-all text-sm font-medium border border-transparent focus:border-purple-500/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch(searchQuery)}
           />
           {isAiLoading && <Sparkles size={16} className="absolute right-3 top-3 text-purple-400 animate-pulse" />}
       </div>

       <div className="flex items-center gap-3">
           <IconButton className="sm:hidden" onClick={() => setCurrentView('SEARCH')}><Search size={22} /></IconButton>
           {installPrompt && (
               <button onClick={handleInstall} className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold transition-all animate-pulse">
                   <Download size={14} /> Install App
               </button>
           )}
           <IconButton onClick={onOpenSettings} size={9} className="mr-1">
               <Settings size={20} />
           </IconButton>
           <div className="w-9 h-9 rounded-full bg-gradient-to-b from-neutral-700 to-neutral-800 border border-white/10 flex items-center justify-center text-sm font-bold cursor-pointer hover:scale-105 transition-transform">
               V
           </div>
       </div>
    </div>
);

const Navigation: React.FC<{ currentView: ViewState, setCurrentView: (v: ViewState) => void }> = ({ currentView, setCurrentView }) => {
    const items = [
        { id: 'HOME', icon: Home, label: 'Home' },
        { id: 'EXPLORE', icon: Compass, label: 'Explore' },
        { id: 'LIBRARY', icon: Library, label: 'Library' }
    ];

    return (
        <>
          <div className="hidden md:flex flex-col w-[80px] bg-black border-r border-white/5 fixed left-0 top-0 bottom-0 z-20 items-center py-6 gap-8 pt-24">
              {items.map(item => (
                  <div 
                      key={item.id} 
                      onClick={() => setCurrentView(item.id as ViewState)}
                      className={`flex flex-col items-center gap-1.5 cursor-pointer group w-full py-2 border-l-2 transition-all ${currentView === item.id ? 'border-purple-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                  >
                      <div className={`p-2 rounded-xl transition-all ${currentView === item.id ? 'bg-purple-500/10' : 'group-hover:bg-white/5'}`}>
                           <item.icon size={26} strokeWidth={currentView === item.id ? 2.5 : 2} />
                      </div>
                      <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
                  </div>
              ))}
          </div>

          <div className="md:hidden fixed bottom-0 left-0 right-0 glass flex justify-around py-2 z-40 pb-safe">
              {items.map(item => (
                  <div 
                      key={item.id} 
                      onClick={() => setCurrentView(item.id as ViewState)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${currentView === item.id ? 'text-white' : 'text-neutral-500'}`}
                  >
                      <item.icon size={24} strokeWidth={currentView === item.id ? 2.5 : 2} className={`transition-transform duration-300 ${currentView === item.id ? '-translate-y-1' : ''}`} />
                      <span className={`text-[10px] font-semibold transition-opacity duration-300 ${currentView === item.id ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
                  </div>
              ))}
          </div>
        </>
    );
};

interface ExpandedPlayerProps {
    playerMode: PlayerMode;
    setPlayerMode: (mode: PlayerMode) => void;
    currentSong: Song;
    mediaMode: MediaMode;
    setMediaMode: (mode: MediaMode) => void;
    activeTab: PlayerTab;
    setActiveTab: (tab: PlayerTab) => void;
    queue: Song[];
    playSong: (song: Song) => void;
    fetchedLyrics: Record<string, string>;
    currentTime: number;
    setCurrentTime: (time: number) => void;
    duration: number;
    playerRef: any;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    skipPrev: () => void;
    skipNext: () => void;
    aiResult: { name: string; desc: string } | null;
}

const ExpandedPlayer: React.FC<ExpandedPlayerProps> = ({
    playerMode, setPlayerMode, currentSong, mediaMode, setMediaMode, activeTab, setActiveTab,
    queue, playSong, fetchedLyrics, currentTime, setCurrentTime, duration, playerRef,
    isPlaying, setIsPlaying, skipPrev, skipNext, aiResult
}) => {
    if(playerMode === 'MINI' || !currentSong) return null;

    const currentLyrics = currentSong.lyrics || fetchedLyrics[currentSong.id] || "Fetching lyrics...";
    const isVideoMode = mediaMode === 'VIDEO';

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black animate-slide-up">
            {/* Dynamic Blurred Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                 <img src={currentSong.coverUrl} className="w-full h-full object-cover opacity-30 blur-[80px] scale-125" alt="" />
                 <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl" />
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-4 pt-safe">
                <IconButton onClick={() => setPlayerMode('MINI')} size={12}><ChevronDown size={28} /></IconButton>
                
                <div className="flex bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/5">
                    <button 
                      onClick={() => setMediaMode('SONG')}
                      className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${!isVideoMode ? 'bg-white/20 text-white shadow-lg' : 'text-neutral-400'}`}
                    >
                        Audio
                    </button>
                    <button 
                      onClick={() => setMediaMode('VIDEO')}
                      className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${isVideoMode ? 'bg-white/20 text-white shadow-lg' : 'text-neutral-400'}`}
                    >
                        Video
                    </button>
                </div>

                <IconButton size={12}><MoreVertical size={24} /></IconButton>
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 overflow-hidden flex flex-col md:flex-row md:items-center md:justify-center md:gap-16 md:px-16">
                
                {/* Artwork / Video Area */}
                <div className={`w-full md:w-1/2 h-full flex flex-col items-center justify-center p-6 transition-all duration-500 ${activeTab !== 'UP_NEXT' && 'hidden md:flex'}`}>
                    <div className={`w-full max-w-[340px] md:max-w-md relative transition-all duration-500 ${isVideoMode ? 'aspect-video shadow-2xl rounded-xl' : 'aspect-square rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]'}`}>
                        
                        {!isVideoMode && (
                          <div className="absolute -inset-4 bg-gradient-to-tr from-purple-500/30 to-blue-500/30 blur-2xl rounded-full animate-pulse-slow -z-10" />
                        )}

                        <div className={`w-full h-full rounded-2xl md:rounded-3xl overflow-hidden bg-neutral-900 border border-white/10 relative z-20`}>
                           {!isVideoMode ? (
                              <img src={currentSong.coverUrl} className="w-full h-full object-cover" alt="" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center bg-black">
                                  <MonitorPlay size={48} className="text-white/20 animate-pulse" />
                              </div>
                           )}
                        </div>
                    </div>

                    {!isVideoMode && (
                      <div className="mt-8 text-center md:hidden w-full px-8 animate-fade-in">
                          <h2 className="text-2xl font-bold truncate mb-1">{currentSong.title}</h2>
                          <p className="text-lg text-neutral-400 truncate">{currentSong.artist}</p>
                      </div>
                    )}
                </div>

                {/* Lyrics / Queue / Controls Area */}
                <div className="w-full md:w-1/2 flex flex-col h-full md:h-auto md:max-h-[80vh]">
                    
                    {/* Desktop Tabs */}
                    <div className="hidden md:flex gap-8 mb-6 border-b border-white/10 pb-2">
                       {['UP_NEXT', 'LYRICS', 'RELATED'].map((tab) => (
                           <button 
                              key={tab} 
                              onClick={() => setActiveTab(tab as PlayerTab)}
                              className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === tab ? 'text-white border-white' : 'text-neutral-500 border-transparent hover:text-neutral-300'}`}
                           >
                              {tab.replace('_', ' ')}
                           </button>
                       ))}
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 md:px-0 no-scrollbar">
                        {activeTab === 'LYRICS' ? (
                            <div className="text-center md:text-left py-4">
                                <p className="whitespace-pre-wrap text-2xl font-bold leading-relaxed text-white/90 drop-shadow-md">
                                    {currentLyrics}
                                </p>
                            </div>
                        ) : activeTab === 'UP_NEXT' ? (
                            <div className="space-y-2 py-4">
                                <div className="flex items-center justify-between mb-4">
                                   <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Up Next</h3>
                                   <span className="text-xs font-bold text-neutral-500 border border-white/10 px-2 py-0.5 rounded-md">{aiResult ? "AI Mix" : "Queue"}</span>
                                </div>
                                {queue.map((s, i) => (
                                    <SongListItem 
                                      key={s.id} 
                                      song={s} 
                                      isPlaying={currentSong.id === s.id} 
                                      onClick={() => playSong(s)} 
                                      index={i}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-neutral-500">
                                <div className="text-center">
                                    <Compass size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>Recommendations coming soon</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Controls Area */}
                    <div className="p-6 pb-8 md:pb-0 bg-gradient-to-t from-black via-black to-transparent">
                         {/* Scrubber */}
                         <div className="group mb-6">
                             <input 
                                type="range" 
                                min={0} 
                                max={duration || 100} 
                                value={currentTime}
                                onChange={(e) => {
                                    const time = parseFloat(e.target.value);
                                    setCurrentTime(time);
                                    playerRef.current?.seekTo(time);
                                }}
                                className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white hover:h-2 transition-all"
                             />
                             <div className="flex justify-between text-xs text-neutral-400 mt-2 font-medium font-mono">
                                 <span>{formatTime(currentTime)}</span>
                                 <span>{formatTime(duration)}</span>
                             </div>
                         </div>

                         {/* Main Buttons */}
                         <div className="flex items-center justify-between px-2 sm:px-8 md:px-0">
                             <IconButton size={12}><Shuffle size={20} /></IconButton>
                             <div className="flex items-center gap-6 sm:gap-10">
                                 <IconButton onClick={skipPrev} size={14}><SkipBack size={28} fill="white" /></IconButton>
                                 <button 
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                                 >
                                    {isPlaying ? <Pause size={32} fill="black" /> : <Play size={32} fill="black" className="ml-1" />}
                                 </button>
                                 <IconButton onClick={skipNext} size={14}><SkipForward size={28} fill="white" /></IconButton>
                             </div>
                             <IconButton size={12}><Repeat size={20} /></IconButton>
                         </div>

                         {/* Mobile Bottom Tabs */}
                         <div className="md:hidden flex justify-around mt-8 bg-white/5 rounded-2xl py-3 backdrop-blur-md border border-white/5">
                             <button onClick={() => setActiveTab('UP_NEXT')} className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === 'UP_NEXT' ? 'text-white' : 'text-neutral-500'}`}>Queue</button>
                             <button onClick={() => setActiveTab('LYRICS')} className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === 'LYRICS' ? 'text-white' : 'text-neutral-500'}`}>Lyrics</button>
                             <button onClick={() => setActiveTab('RELATED')} className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === 'RELATED' ? 'text-white' : 'text-neutral-500'}`}>Related</button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface MiniPlayerProps {
    currentSong: Song | null;
    playerMode: PlayerMode;
    setPlayerMode: (mode: PlayerMode) => void;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    skipNext: () => void;
    currentTime: number;
    duration: number;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ 
    currentSong, playerMode, setPlayerMode, isPlaying, setIsPlaying, skipNext, currentTime, duration 
}) => {
    if(!currentSong) return null;
    return (
        <div className="fixed bottom-[68px] md:bottom-4 left-2 right-2 md:left-[96px] md:right-4 z-40 transition-all duration-500">
             <div 
               className={`glass rounded-2xl p-2 flex items-center shadow-2xl border border-white/10 relative overflow-hidden group cursor-pointer ${playerMode === 'FULL' ? 'translate-y-[200%] opacity-0' : 'translate-y-0 opacity-100'}`}
               onClick={(e) => {
                   if((e.target as HTMLElement).closest('button')) return;
                   setPlayerMode('FULL');
               }}
             >
                {/* Progress Bar Background */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-white/30 z-20 transition-all duration-300" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                
                {/* Spinning Art */}
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 relative flex-shrink-0 animate-[spin_10s_linear_infinite]" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
                     <img src={currentSong.coverUrl} className="w-full h-full object-cover" alt="" onError={(e) => e.currentTarget.src = 'https://placehold.co/100x100?text=Music'} />
                     <div className="absolute inset-0 rounded-full border border-black/10"></div>
                </div>
                
                <div className="flex-1 mx-3 min-w-0">
                    <h4 className="font-bold truncate text-sm text-white">{currentSong.title}</h4>
                    <p className="text-xs text-neutral-400 truncate">{currentSong.artist}</p>
                </div>

                <div className="flex items-center gap-1 pr-1">
                    <IconButton className="hidden sm:flex" size={10}><Heart size={18} /></IconButton>
                    <button 
                      onClick={(e) => {
                          e.stopPropagation();
                          setIsPlaying(!isPlaying);
                      }} 
                      className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition"
                    >
                        {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" className="ml-0.5" />}
                    </button>
                    <IconButton onClick={(e) => { e.stopPropagation(); skipNext(); }} size={10}><SkipForward size={20} fill="white" /></IconButton>
                </div>
             </div>
        </div>
    );
};

interface HomeViewProps {
    installPrompt: any;
    handleInstall: () => void;
    activeChip: string | null;
    setActiveChip: (chip: string | null) => void;
    handleAiSearch: (query: string) => void;
    aiResult: { name: string; desc: string } | null;
    queue: Song[];
    currentSong: Song | null;
    playSong: (song: Song) => void;
    setQueue: (songs: Song[]) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ 
    installPrompt, handleInstall, activeChip, setActiveChip, handleAiSearch, aiResult, queue, currentSong, playSong, setQueue 
}) => (
    <div className="pb-40 px-4 md:px-8 pt-4 animate-fade-in">
        <div className="mb-6 mt-2">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-neutral-500">
                {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
            </h1>
            <p className="text-neutral-400 text-sm font-medium">Ready to vibe?</p>
        </div>

        {installPrompt && (
            <div className="mb-8 p-4 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-white/10 rounded-2xl flex items-center justify-between shadow-lg shadow-purple-900/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <Download size={20} className="text-purple-300" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Install App</h3>
                        <p className="text-xs text-neutral-400">Get the best experience</p>
                    </div>
                </div>
                <button onClick={handleInstall} className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full hover:scale-105 active:scale-95 transition-all">Install</button>
            </div>
        )}

        <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar -mx-4 px-4 sticky top-[64px] z-20 bg-gradient-to-b from-black via-black to-transparent pt-2">
            {MOOD_FILTERS.map(m => (
                <Chip 
                  key={m} 
                  label={m} 
                  isActive={activeChip === m} 
                  onClick={() => {
                      setActiveChip(m);
                      handleAiSearch(`Play ${m} music`);
                  }} 
                />
            ))}
        </div>

        {aiResult && (
            <div className="mb-10 animate-slide-up">
                <div className="flex gap-5 items-center mb-6 p-6 rounded-3xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-white/5">
                   <div className="w-24 h-24 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl shadow-lg flex items-center justify-center flex-shrink-0 animate-glow">
                       <Sparkles size={40} className="text-white" />
                   </div>
                   <div>
                       <span className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1 block">AI Generated Mix</span>
                       <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-2">{aiResult.name}</h1>
                       <p className="text-neutral-400 text-sm line-clamp-2">{aiResult.desc}</p>
                   </div>
                </div>
            </div>
        )}

        <div className="space-y-10">
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Clock size={18} className="text-green-400" /> Listen Again
                    </h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
                    {MOCK_PLAYLISTS.map(p => (
                        <div key={p.id} className="min-w-[160px] cursor-pointer group" onClick={() => {
                            const songs = MOCK_SONGS.filter(s => p.songs.includes(s.id));
                            if(songs.length > 0) {
                                setQueue(songs);
                                playSong(songs[0]);
                            }
                        }}>
                            <div className="relative mb-3 aspect-square rounded-2xl overflow-hidden shadow-lg">
                              <img src={p.coverUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                              <div className="absolute bottom-3 right-3 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
                                  <Play size={20} fill="black" className="text-black ml-1" />
                              </div>
                            </div>
                            <h3 className="font-bold text-sm truncate">{p.name}</h3>
                            <p className="text-xs text-neutral-400 truncate">{p.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Music2 size={18} className="text-blue-400" /> Quick Picks
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {queue.slice(0, 12).map((s, i) => (
                        <SongListItem 
                          key={s.id} 
                          song={s} 
                          isPlaying={currentSong?.id === s.id} 
                          onClick={() => playSong(s)}
                        />
                    ))}
                </div>
            </section>
        </div>
    </div>
);

// --- Main App ---

const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddSong, setShowAddSong] = useState(false);
  
  // Player State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>(MOCK_SONGS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerMode, setPlayerMode] = useState<PlayerMode>('MINI');
  const [activeTab, setActiveTab] = useState<PlayerTab>('UP_NEXT');
  const [mediaMode, setMediaMode] = useState<MediaMode>('SONG');
  
  // Library State
  const [mySongs, setMySongs] = useState<Song[]>([]);

  // Audio State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [fetchedLyrics, setFetchedLyrics] = useState<Record<string, string>>({});
  
  // Search/AI State
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{name: string, desc: string} | null>(null);

  const playerRef = useRef<any>(null);

  // Cast ReactPlayer to any to handle type inconsistencies with 'url' prop
  const Player = ReactPlayer as any;

  // Load Custom Songs
  useEffect(() => {
    const saved = localStorage.getItem('VICKY_MY_SONGS');
    if (saved) {
        try {
            setMySongs(JSON.parse(saved));
        } catch(e) {
            console.error("Failed to parse songs", e);
        }
    }
  }, []);

  // Install PWA Logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log('Install prompt captured');
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
        console.log('No install prompt available');
        return;
    }
    try {
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        setInstallPrompt(null);
    } catch (err) {
        console.error('Error during installation:', err);
    }
  };

  const playSong = (song: Song) => {
      setCurrentSong(song);
      setIsPlaying(true);
      if (!song.lyrics && !fetchedLyrics[song.id] && song.id.startsWith('ai')) {
          generateLyrics(song.title, song.artist).then(l => {
              setFetchedLyrics(prev => ({...prev, [song.id]: l}));
          });
      }
  };

  const skipNext = useCallback(() => {
      if(!currentSong) return;
      // Combine queue for lookup
      const currentQueue = currentView === 'LIBRARY' ? mySongs : queue;
      const idx = currentQueue.findIndex(s => s.id === currentSong.id);
      
      // If found in current queue, play next
      if (idx !== -1) {
          playSong(currentQueue[(idx + 1) % currentQueue.length]);
      } else {
          // Fallback to main queue
          const qIdx = queue.findIndex(s => s.id === currentSong.id);
          playSong(queue[(qIdx + 1) % queue.length]);
      }
  }, [currentSong, queue, mySongs, currentView]);

  const skipPrev = useCallback(() => {
      if(!currentSong) return;
      const currentQueue = currentView === 'LIBRARY' ? mySongs : queue;
      const idx = currentQueue.findIndex(s => s.id === currentSong.id);
      
      if (idx !== -1) {
          playSong(currentQueue[(idx - 1 + currentQueue.length) % currentQueue.length]);
      } else {
          const qIdx = queue.findIndex(s => s.id === currentSong.id);
          playSong(queue[(qIdx - 1 + queue.length) % queue.length]);
      }
  }, [currentSong, queue, mySongs, currentView]);

  const handleAddSong = (url: string, title: string, artist: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      const yId = (match && match[2].length === 11) ? match[2] : null;
      
      if (!yId) {
          alert("Invalid YouTube URL");
          return;
      }

      const newSong: Song = {
          id: `custom_${Date.now()}`,
          title: title || 'Unknown',
          artist: artist || 'Unknown',
          album: 'My Uploads',
          coverUrl: `https://i.ytimg.com/vi/${yId}/maxresdefault.jpg`,
          youtubeId: yId,
          duration: 0, // Duration will be picked up by player
          genre: 'Custom',
      };

      const updatedSongs = [newSong, ...mySongs];
      setMySongs(updatedSongs);
      localStorage.setItem('VICKY_MY_SONGS', JSON.stringify(updatedSongs));
      setShowAddSong(false);
      
      // Auto play the new song
      setQueue(updatedSongs); // Update queue context to library
      setCurrentView('LIBRARY');
      playSong(newSong);
  };

  const handleDeleteSong = (id: string) => {
      if(confirm("Delete this song from library?")) {
          const updated = mySongs.filter(s => s.id !== id);
          setMySongs(updated);
          localStorage.setItem('VICKY_MY_SONGS', JSON.stringify(updated));
      }
  };

  // --- Background Play & Media Session API ---
  useEffect(() => {
    if (!currentSong) return;

    if ('mediaSession' in navigator) {
      // Set metadata for Lock Screen / Notification Center
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album || 'Vicky Music',
        artwork: [
          { src: currentSong.coverUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: currentSong.coverUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: currentSong.coverUrl, sizes: '192x192', type: 'image/jpeg' },
          { src: currentSong.coverUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: currentSong.coverUrl, sizes: '384x384', type: 'image/jpeg' },
          { src: currentSong.coverUrl, sizes: '512x512', type: 'image/jpeg' },
        ]
      });

      // Bind Lock Screen Actions
      navigator.mediaSession.setActionHandler('play', () => {
          setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
          setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', skipPrev);
      navigator.mediaSession.setActionHandler('nexttrack', skipNext);
    }
  }, [currentSong, skipNext, skipPrev]);

  const handleAiSearch = async (query: string) => {
      setIsAiLoading(true);
      setCurrentView('HOME'); 
      try {
          const res = await generateSmartPlaylist(query, MOCK_SONGS);
          setQueue(res.songs);
          setAiResult({ name: res.playlistName, desc: res.description });
          if(res.songs.length > 0) playSong(res.songs[0]);
      } catch(e: any) {
          console.error(e);
          alert(e.message || "Gagal memuat AI Mix");
      } finally {
          setIsAiLoading(false);
      }
  };

  // Determine actual YouTube URL
  const playerUrl = currentSong 
      ? (currentSong.youtubeId 
          ? `https://www.youtube.com/watch?v=${currentSong.youtubeId}` 
          : currentSong.audioUrl)
      : null;

  // Determine Player Styles for Visibility
  const isVideoVisible = playerMode === 'FULL' && mediaMode === 'VIDEO';
  const playerContainerClass = isVideoVisible
      ? "fixed z-[60] inset-x-0 top-24 md:top-32 mx-auto w-full max-w-2xl aspect-video transition-all duration-300 ease-in-out shadow-2xl rounded-2xl overflow-hidden border border-white/10"
      : "fixed top-0 left-0 w-1 h-1 -z-50 opacity-0 pointer-events-none"; // CRITICAL: Do not use display:none or -bottom-1000

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden selection:bg-purple-500 selection:text-white">
        
        {/* React Player Instance */}
        {playerUrl && (
            <div className={playerContainerClass}>
                <Player
                    ref={playerRef}
                    url={playerUrl}
                    playing={isPlaying}
                    volume={volume}
                    width="100%"
                    height="100%"
                    controls={false}
                    playsinline={true} // IMPORTANT for mobile
                    onProgress={(p: any) => setCurrentTime(p.playedSeconds)}
                    onDuration={(d: any) => setDuration(d)}
                    onEnded={skipNext}
                    onPause={() => {
                        // Only sync pause state if user is actually looking at the page.
                        // If page is hidden (background), we keep 'isPlaying' true so MediaSession 'Play' can resume it.
                        if (!document.hidden) {
                            setIsPlaying(false);
                        }
                    }}
                    onPlay={() => setIsPlaying(true)}
                    // playsinline: 1 is crucial for background playback potential on iOS
                    config={{ 
                        youtube: { 
                            playerVars: { 
                                showinfo: 0, 
                                controls: 0, 
                                playsinline: 1, 
                                autoplay: 1,
                                origin: window.location.origin 
                            } 
                        } 
                    } as any}
                />
            </div>
        )}
        
        <Navigation currentView={currentView} setCurrentView={setCurrentView} />

        <div className="flex-1 flex flex-col md:ml-[80px] relative">
            <TopBar 
                currentView={currentView} 
                setCurrentView={setCurrentView} 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleAiSearch={handleAiSearch}
                isAiLoading={isAiLoading}
                installPrompt={installPrompt}
                handleInstall={handleInstall}
                onOpenSettings={() => setShowSettings(true)}
            />
            
            <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                {currentView === 'HOME' && (
                    <HomeView 
                        installPrompt={installPrompt}
                        handleInstall={handleInstall}
                        activeChip={activeChip}
                        setActiveChip={setActiveChip}
                        handleAiSearch={handleAiSearch}
                        aiResult={aiResult}
                        queue={queue}
                        currentSong={currentSong}
                        playSong={playSong}
                        setQueue={setQueue}
                    />
                )}
                {currentView === 'SEARCH' && (
                    <div className="p-6 pt-safe">
                        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 animate-fade-in">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                                <Search size={32} className="text-neutral-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Find your vibe</h2>
                                <p className="text-neutral-400 max-w-xs mx-auto">Search for artists, songs, or type a mood to let AI create a playlist.</p>
                            </div>
                            <input 
                                type="text" 
                                className="w-full max-w-md bg-white/10 p-4 rounded-full text-white text-center focus:bg-white/20 outline-none transition-all" 
                                placeholder="Start typing..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAiSearch(searchQuery)}
                                autoFocus
                            />
                        </div>
                    </div>
                )}
                {currentView === 'LIBRARY' && (
                    <div className="p-6 pt-safe pb-40 animate-fade-in">
                        <div className="flex items-center justify-between mb-8">
                             <div>
                                 <h1 className="text-3xl font-bold flex items-center gap-3">
                                     <Library size={32} className="text-purple-400" />
                                     My Library
                                 </h1>
                                 <p className="text-neutral-400 text-sm mt-1">Your personal collection</p>
                             </div>
                             <button 
                                onClick={() => setShowAddSong(true)}
                                className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg"
                             >
                                 <Plus size={18} /> Add Song
                             </button>
                        </div>
                        
                        {mySongs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <ImageIcon size={32} />
                                </div>
                                <h3 className="text-lg font-bold mb-1">It's empty here</h3>
                                <p className="text-sm">Tap "Add Song" to build your collection.</p>
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                {mySongs.map((s, i) => (
                                    <SongListItem 
                                        key={s.id} 
                                        song={s} 
                                        isPlaying={currentSong?.id === s.id} 
                                        onClick={() => {
                                            // Update queue context only if different
                                            setQueue(mySongs);
                                            playSong(s);
                                        }}
                                        onDelete={handleDeleteSong}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {currentView === 'EXPLORE' && (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-500 animate-fade-in">
                        <Compass size={64} className="mb-4 text-purple-500/50" />
                        <h2 className="text-xl font-bold text-white">Explore</h2>
                        <p>Coming Soon</p>
                    </div>
                )}
            </main>

            <MiniPlayer 
                currentSong={currentSong}
                playerMode={playerMode}
                setPlayerMode={setPlayerMode}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                skipNext={skipNext}
                currentTime={currentTime}
                duration={duration}
            />
        </div>

        {/* Modals */}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        {showAddSong && <AddSongModal onClose={() => setShowAddSong(false)} onAdd={handleAddSong} />}

        {currentSong && (
            <ExpandedPlayer
                playerMode={playerMode}
                setPlayerMode={setPlayerMode}
                currentSong={currentSong}
                mediaMode={mediaMode}
                setMediaMode={setMediaMode}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                queue={queue}
                playSong={playSong}
                fetchedLyrics={fetchedLyrics}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                duration={duration}
                playerRef={playerRef}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                skipPrev={skipPrev}
                skipNext={skipNext}
                aiResult={aiResult}
            />
        )}
    </div>
  );
};

export default App;