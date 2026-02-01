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
  Volume2, 
  VolumeX, 
  Sparkles, 
  ListMusic, 
  Heart,
  Menu,
  ChevronDown, 
  MoreVertical,
  Cast,
  Repeat,
  Shuffle,
  Mic2,
  ListVideo,
  Info,
  Compass,
  MonitorPlay,
  Download,
  Share2,
  Clock,
  Music2
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

const SongListItem: React.FC<{ song: Song; onClick: () => void; isPlaying: boolean; index?: number }> = ({ song, onClick, isPlaying, index }) => (
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
        <IconButton className="opacity-0 group-hover:opacity-100 sm:opacity-0" size={8}>
            <MoreVertical size={16} />
        </IconButton>
    </div>
);

// --- Main App ---

const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  // Player State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>(MOCK_SONGS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerMode, setPlayerMode] = useState<PlayerMode>('MINI');
  const [activeTab, setActiveTab] = useState<PlayerTab>('UP_NEXT');
  const [mediaMode, setMediaMode] = useState<MediaMode>('SONG');
  
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

  // Install PWA Logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
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
    
    // Show the install prompt
    try {
        installPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await installPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        
        // We've used the prompt, and can't use it again, discard it
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

  const skipNext = () => {
      if(!currentSong) return;
      const idx = queue.findIndex(s => s.id === currentSong.id);
      playSong(queue[(idx + 1) % queue.length]);
  };

  const skipPrev = () => {
      if(!currentSong) return;
      const idx = queue.findIndex(s => s.id === currentSong.id);
      playSong(queue[(idx - 1 + queue.length) % queue.length]);
  };

  const handleAiSearch = async (query: string) => {
      setIsAiLoading(true);
      setCurrentView('HOME'); 
      try {
          const res = await generateSmartPlaylist(query, MOCK_SONGS);
          setQueue(res.songs);
          setAiResult({ name: res.playlistName, desc: res.description });
          if(res.songs.length > 0) playSong(res.songs[0]);
      } catch(e) {
          alert("Gagal memuat AI Mix");
      } finally {
          setIsAiLoading(false);
      }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- Views ---

  const TopBar = () => (
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
             <div className="w-9 h-9 rounded-full bg-gradient-to-b from-neutral-700 to-neutral-800 border border-white/10 flex items-center justify-center text-sm font-bold cursor-pointer hover:scale-105 transition-transform">
                 V
             </div>
         </div>
      </div>
  );

  const Navigation = () => {
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

  const ExpandedPlayer = () => {
      if(playerMode === 'MINI' || !currentSong) return null;

      const currentLyrics = songLyrics(currentSong);
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
                          
                          {/* Glow Effect Behind Artwork */}
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

                      {/* Title Info (Mobile only, below art) */}
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

  const MiniPlayer = () => {
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

  const HomeView = () => (
      <div className="pb-40 px-4 md:px-8 pt-4 animate-fade-in">
          {/* Greetings */}
          <div className="mb-6 mt-2">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-neutral-500">
                  {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
              </h1>
              <p className="text-neutral-400 text-sm font-medium">Ready to vibe?</p>
          </div>

          {/* Install Banner (If available) */}
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

          {/* Chips */}
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

  const songLyrics = (song: Song) => {
      if (song.lyrics) return song.lyrics;
      if (fetchedLyrics[song.id]) return fetchedLyrics[song.id];
      return "Fetching lyrics from the cloud...";
  };

  // Determine actual YouTube URL
  const playerUrl = currentSong 
      ? (currentSong.youtubeId 
          ? `https://www.youtube.com/watch?v=${currentSong.youtubeId}` 
          : currentSong.audioUrl)
      : null;

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden selection:bg-purple-500 selection:text-white">
        
        {/* Hidden YouTube Player */}
        {playerUrl && (
            <div className={`fixed z-[60] transition-all duration-300 ease-in-out shadow-2xl rounded-2xl overflow-hidden border border-white/10 ${playerMode === 'FULL' && mediaMode === 'VIDEO' ? 'inset-x-0 top-24 md:top-32 mx-auto w-full max-w-2xl aspect-video' : 'w-px h-px opacity-0 pointer-events-none -bottom-10'}`}>
                <Player
                    ref={playerRef}
                    url={playerUrl}
                    playing={isPlaying}
                    volume={volume}
                    width="100%"
                    height="100%"
                    controls={false}
                    onProgress={(p: any) => setCurrentTime(p.playedSeconds)}
                    onDuration={(d: any) => setDuration(d)}
                    onEnded={skipNext}
                    config={{ youtube: { playerVars: { showinfo: 0, controls: 0, playsinline: 1 } } } as any}
                />
            </div>
        )}
        
        <Navigation />

        <div className="flex-1 flex flex-col md:ml-[80px] relative">
            <TopBar />
            
            <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                {currentView === 'HOME' && <HomeView />}
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
                {(currentView === 'LIBRARY' || currentView === 'EXPLORE') && (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-500 animate-fade-in">
                        <Compass size={64} className="mb-4 text-purple-500/50" />
                        <h2 className="text-xl font-bold text-white">Coming Soon</h2>
                        <p>This section is under construction.</p>
                    </div>
                )}
            </main>

            <MiniPlayer />
        </div>

        <ExpandedPlayer />
    </div>
  );
};

export default App;