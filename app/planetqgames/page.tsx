'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles, Cpu, WandSparkles, Zap, Play, ChevronRight,
  Gamepad2, Target, Car, Trophy, Swords, Shield,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight as ChevronRightIcon, 
  X, Code, Menu, User, Music, Video, Mic
} from 'lucide-react';

// ============================================
// PREVIEW OF HOW IT WILL LOOK ON YOUR WEBSITE
// ============================================

const GENRES = [
  { id: 'action', name: 'Action', icon: Swords, color: 'from-red-500 to-orange-500', accent: '#FF4444' },
  { id: 'puzzle', name: 'Puzzle', icon: Target, color: 'from-purple-500 to-pink-500', accent: '#A855F7' },
  { id: 'adventure', name: 'Adventure', icon: Trophy, color: 'from-yellow-500 to-amber-500', accent: '#F59E0B' },
  { id: 'arcade', name: 'Arcade', icon: Gamepad2, color: 'from-cyan-500 to-blue-500', accent: '#06B6D4' },
  { id: 'racing', name: 'Racing', icon: Car, color: 'from-green-500 to-emerald-500', accent: '#10B981' },
  { id: 'rpg', name: 'RPG', icon: Shield, color: 'from-indigo-500 to-purple-500', accent: '#6366F1' },
];

const GENRE_PROMPTS: Record<string, string[]> = {
  action: ['A space shooter defending Earth from aliens...', 'A martial arts fighting game...', 'A superhero action game...'],
  puzzle: ['A puzzle platformer with gravity manipulation...', 'A mystery puzzle with ancient riddles...', 'A physics puzzle with portals...'],
  adventure: ['An epic quest through enchanted forests...', 'A treasure hunt on mysterious islands...', 'A time-travel adventure...'],
  arcade: ['A retro space invaders with modern twist...', 'A fast-paced brick breaker...', 'An endless runner through cyberpunk city...'],
  racing: ['A street racing game in neon Tokyo...', 'A futuristic anti-gravity racing...', 'An off-road rally adventure...'],
  rpg: ['A medieval knight quest to slay a dragon...', 'A mage academy learning magic...', 'A cyberpunk RPG in a megacity...'],
};

// Playable Preview Component
const PlayablePreview = ({ genre, onClose }: { genre: string; onClose: () => void }) => {
  const [charX, setCharX] = useState(200);
  const [charY, setCharY] = useState(180);
  const [score, setScore] = useState(0);
  const [health] = useState(100);
  const [bullets, setBullets] = useState<{id: number, x: number, y: number}[]>([]);
  const [enemies, setEnemies] = useState<{id: number, x: number, y: number}[]>([{ id: 1, x: 100, y: 50 }, { id: 2, x: 280, y: 80 }]);
  const [effects, setEffects] = useState<{id: number, x: number, y: number}[]>([]);
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const [activeDpad, setActiveDpad] = useState<string | null>(null);
  const [isBoosting, setIsBoosting] = useState(false);
  
  const bulletIdRef = useRef(0);
  const GAME_W = 400, GAME_H = 260, SPEED = 15, BOOST = 28;

  const genreConfig = GENRES.find(g => g.id === genre);
  const accent = genreConfig?.accent || '#4ECDC4';

  useEffect(() => {
    const i = setInterval(() => {
      setEnemies(prev => prev.map(e => ({
        ...e,
        x: Math.max(20, Math.min(GAME_W - 60, e.x + Math.sin(Date.now() / 500 + e.id) * 2)),
        y: Math.max(30, Math.min(120, e.y + Math.cos(Date.now() / 700 + e.id))),
      })));
    }, 50);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const i = setInterval(() => {
      setBullets(prev => {
        const updated = prev.map(b => ({ ...b, y: b.y - 12 })).filter(b => b.y > -20);
        updated.forEach(bullet => {
          setEnemies(curr => {
            const hit = curr.find(e => Math.abs(bullet.x - e.x) < 30 && Math.abs(bullet.y - e.y) < 30);
            if (hit) {
              setEffects(p => [...p, { id: Date.now(), x: hit.x, y: hit.y }]);
              setScore(s => s + 100);
              return curr.filter(e => e.id !== hit.id);
            }
            return curr;
          });
        });
        return updated;
      });
    }, 30);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const i = setInterval(() => {
      setEnemies(prev => prev.length < 3 ? [...prev, { id: Date.now(), x: Math.random() * (GAME_W - 60) + 30, y: Math.random() * 80 + 30 }] : prev);
    }, 3000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const i = setInterval(() => setEffects(prev => prev.filter(e => Date.now() - e.id < 500)), 100);
    return () => clearInterval(i);
  }, []);

  const move = (dir: string) => {
    setActiveDpad(dir);
    const spd = isBoosting ? BOOST : SPEED;
    if (dir === 'up') setCharY(y => Math.max(50, y - spd));
    if (dir === 'down') setCharY(y => Math.min(GAME_H - 60, y + spd));
    if (dir === 'left') setCharX(x => Math.max(20, x - spd));
    if (dir === 'right') setCharX(x => Math.min(GAME_W - 40, x + spd));
  };

  const action = (btn: string) => {
    setActiveBtn(btn);
    if (btn === 'A') setBullets(prev => [...prev, { id: bulletIdRef.current++, x: charX + 12, y: charY - 10 }]);
    if (btn === 'C') [-20, 0, 20].forEach((off, i) => setTimeout(() => setBullets(prev => [...prev, { id: bulletIdRef.current++, x: charX + 12 + off, y: charY - 10 }]), i * 40));
    if (btn === 'D') { setIsBoosting(true); setTimeout(() => setIsBoosting(false), 1500); }
  };

  return (
    <div className="rounded-2xl overflow-hidden bg-black border-2 border-gray-700/50">
      <div className="relative overflow-hidden" style={{ height: GAME_H, background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 100%)' }}>
        {[...Array(20)].map((_, i) => <div key={i} className="absolute rounded-full bg-white animate-pulse" style={{ width: 2, height: 2, left: `${Math.random() * 100}%`, top: `${Math.random() * 60}%`, opacity: Math.random() * 0.5 + 0.3 }} />)}
        
        {enemies.map(e => (
          <div key={e.id} className="absolute" style={{ left: e.x, top: e.y }}>
            <div className="w-10 h-8 rounded-lg bg-red-500 flex items-center justify-center">
              <div className="flex gap-2"><div className="w-2 h-2 bg-white rounded-full" /><div className="w-2 h-2 bg-white rounded-full" /></div>
            </div>
          </div>
        ))}
        
        {bullets.map(b => <div key={b.id} className="absolute w-2 h-4 rounded-full" style={{ left: b.x, top: b.y, backgroundColor: '#FFD700', boxShadow: '0 0 10px #FFD700' }} />)}
        {effects.map(e => <div key={e.id} className="absolute w-8 h-8 rounded-full bg-orange-500 animate-ping" style={{ left: e.x - 15, top: e.y - 15, opacity: 0.8 }} />)}
        
        <div className="absolute transition-all duration-75" style={{ left: charX, top: charY }}>
          <div className="absolute w-12 h-14 rounded-full opacity-20" style={{ backgroundColor: accent, top: -5, left: -5 }} />
          {isBoosting && <div className="absolute w-14 h-16 rounded-full border-2 animate-ping" style={{ borderColor: '#FFD700', top: -10, left: -7 }} />}
          <div className="flex flex-col items-center">
            <div className="w-5 h-4 rounded-full mb-0.5" style={{ backgroundColor: accent }} />
            <div className="w-6 h-7 rounded-md" style={{ backgroundColor: accent }} />
          </div>
        </div>
        
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
          <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${health}%` }} /></div>
          <span className="font-mono font-bold text-sm text-yellow-400">{score.toString().padStart(6, '0')}</span>
        </div>
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase" style={{ backgroundColor: accent + '50', color: accent }}>{genre}</div>
      </div>

      <div className="flex justify-between items-center p-4 bg-gray-900/90">
        <div className="flex flex-col items-center">
          <button className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: activeDpad === 'up' ? accent : '#1f2937' }} onMouseDown={() => move('up')} onMouseUp={() => setActiveDpad(null)} onTouchStart={() => move('up')} onTouchEnd={() => setActiveDpad(null)}><ChevronUp className="w-5 h-5 text-gray-400" /></button>
          <div className="flex">
            <button className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: activeDpad === 'left' ? accent : '#1f2937' }} onMouseDown={() => move('left')} onMouseUp={() => setActiveDpad(null)} onTouchStart={() => move('left')} onTouchEnd={() => setActiveDpad(null)}><ChevronLeft className="w-5 h-5 text-gray-400" /></button>
            <div className="w-10 h-10" />
            <button className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: activeDpad === 'right' ? accent : '#1f2937' }} onMouseDown={() => move('right')} onMouseUp={() => setActiveDpad(null)} onTouchStart={() => move('right')} onTouchEnd={() => setActiveDpad(null)}><ChevronRightIcon className="w-5 h-5 text-gray-400" /></button>
          </div>
          <button className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: activeDpad === 'down' ? accent : '#1f2937' }} onMouseDown={() => move('down')} onMouseUp={() => setActiveDpad(null)} onTouchStart={() => move('down')} onTouchEnd={() => setActiveDpad(null)}><ChevronDown className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[{ id: 'A', label: 'FIRE', bg: '#EF4444' }, { id: 'B', label: 'JUMP', bg: '#06B6D4' }, { id: 'C', label: 'SPECIAL', bg: '#EAB308', dark: true }, { id: 'D', label: 'BOOST', bg: '#22C55E', dark: true }].map(btn => (
            <button key={btn.id} className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border-2 transition-all ${activeBtn === btn.id ? 'scale-90 border-white' : 'border-white/20'}`} style={{ backgroundColor: btn.bg }} onMouseDown={() => action(btn.id)} onMouseUp={() => setActiveBtn(null)} onTouchStart={() => action(btn.id)} onTouchEnd={() => setActiveBtn(null)}>
              <span className={`font-bold text-sm ${btn.dark ? 'text-gray-900' : 'text-white'}`}>{btn.id}</span>
              <span className={`text-[8px] font-semibold ${btn.dark ? 'text-gray-900' : 'text-white'}`}>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Page Component - Mimics your website design
export default function PlanetQGamesPreview() {
  const [selectedGenre, setSelectedGenre] = useState('action');
  const [prompt, setPrompt] = useState('');
  const [characterDesc, setCharacterDesc] = useState('');
  const [controlScheme, setControlScheme] = useState<'dpad' | 'swipe'>('dpad');
  const [platform, setPlatform] = useState<'javascript' | 'unity' | 'unreal'>('javascript');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [game, setGame] = useState<any>(null);

  const generate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setGame({ name: `${selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)} Adventure`, genre: selectedGenre, prompt });
      setShowPreview(true);
      setIsGenerating(false);
    }, 2000);
  };

  const examples = GENRE_PROMPTS[selectedGenre] || [];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navigation Bar - Mimics your website */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Planet Q Productions
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="#" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <Music className="w-4 h-4" /> Music
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <Video className="w-4 h-4" /> Videos
                </Link>
                <Link href="#" className="text-purple-400 font-medium flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" /> Games
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <Mic className="w-4 h-4" /> Radio
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full text-white text-sm font-medium hover:opacity-90 transition-opacity">
                <User className="w-4 h-4" /> Sign In
              </button>
              <button className="md:hidden text-white">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-8 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
          AI Game <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Generator</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Transform your imagination into playable games with the power of AI
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        {/* THE UPGRADED PROMPT BOX */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-40" />
          
          <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-700/50 bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="hidden sm:flex items-center gap-2 text-gray-400">
                  <Cpu className="w-4 h-4" />
                  <span className="text-sm font-medium">AI Game Engine v2.0</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                <span className="text-sm text-purple-400 font-medium">Powered by Planet Q AI</span>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Genre Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Select Game Genre</label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(g => {
                    const Icon = g.icon;
                    const sel = selectedGenre === g.id;
                    return (
                      <button key={g.id} onClick={() => setSelectedGenre(g.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${sel ? `bg-gradient-to-r ${g.color} border-transparent shadow-lg` : 'bg-gray-900/50 border-gray-700/50 hover:border-purple-500/50'}`}>
                        <Icon className={`w-4 h-4 ${sel ? 'text-white' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${sel ? 'text-white' : 'text-gray-400'}`}>{g.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Describe Your Game</label>
                <div className="relative">
                  <WandSparkles className="absolute left-4 top-4 w-5 h-5 text-purple-400" />
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe your dream game... What's the genre? What makes it unique? What's the goal?" className="w-full h-32 bg-gray-800/50 border border-gray-700/50 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20" maxLength={500} />
                  <span className="absolute right-4 bottom-4 text-xs text-gray-500">{prompt.length}/500</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {examples.map((ex, i) => <button key={i} onClick={() => setPrompt(ex)} className="text-xs px-3 py-1.5 bg-gray-800/50 hover:bg-purple-500/20 border border-gray-700/50 rounded-full text-gray-400 hover:text-purple-300 transition-all">{ex.substring(0, 30)}...</button>)}
                </div>
              </div>

              {/* Character Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Character Description (Optional)</label>
                <input type="text" value={characterDesc} onChange={(e) => setCharacterDesc(e.target.value)} placeholder="Describe your main character..." className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" maxLength={200} />
              </div>

              {/* Control Scheme */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Control Scheme</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setControlScheme('dpad')} className={`p-4 rounded-xl border-2 ${controlScheme === 'dpad' ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700/50 bg-gray-800/30'}`}>
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="grid grid-cols-2 gap-1"><div className="w-4 h-4 rounded-full bg-red-500" /><div className="w-4 h-4 rounded-full bg-cyan-500" /><div className="w-4 h-4 rounded-full bg-yellow-500" /><div className="w-4 h-4 rounded-full bg-green-500" /></div>
                    </div>
                    <p className={`text-sm font-medium ${controlScheme === 'dpad' ? 'text-purple-400' : 'text-gray-400'}`}>D-Pad + ABCD</p>
                    <p className="text-xs text-gray-500 mt-1">Classic controller</p>
                  </button>
                  <button onClick={() => setControlScheme('swipe')} className={`p-4 rounded-xl border-2 ${controlScheme === 'swipe' ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700/50 bg-gray-800/30'}`}>
                    <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
                    <p className={`text-sm font-medium ${controlScheme === 'swipe' ? 'text-purple-400' : 'text-gray-400'}`}>Swipe Controls</p>
                    <p className="text-xs text-gray-500 mt-1">Touch-based</p>
                  </button>
                </div>
              </div>

              {/* Platform Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Target Platform</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: 'javascript', icon: '🌐', name: 'JavaScript' }, { id: 'unity', icon: '🎮', name: 'Unity' }, { id: 'unreal', icon: '⚡', name: 'Unreal' }].map(p => (
                    <button key={p.id} onClick={() => setPlatform(p.id as any)} className={`p-3 rounded-xl border-2 ${platform === p.id ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700/50 bg-gray-800/30'}`}>
                      <span className="text-xl block">{p.icon}</span>
                      <p className={`text-xs font-medium ${platform === p.id ? 'text-purple-400' : 'text-gray-400'}`}>{p.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /><span>Instant Generation</span></div>
                  <div className="hidden sm:flex items-center gap-2"><Play className="w-4 h-4 text-green-400" /><span>Playable Preview</span></div>
                </div>
                <button onClick={generate} disabled={isGenerating || !prompt.trim()} className={`group relative flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all overflow-hidden ${isGenerating || !prompt.trim() ? 'bg-gray-700 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105'}`}>
                  <span className="relative z-10 text-white flex items-center gap-3">
                    {isGenerating ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5" />Generate Game<ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-3 gap-4 mt-12">
          <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-white font-semibold text-sm">AI-Powered</p>
            <p className="text-gray-500 text-xs mt-1">Neural networks create unique gameplay</p>
          </div>
          <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Play className="w-6 h-6 text-cyan-400" />
            </div>
            <p className="text-white font-semibold text-sm">Instant Play</p>
            <p className="text-gray-500 text-xs mt-1">Generate and play in seconds</p>
          </div>
          <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gamepad2 className="w-6 h-6 text-pink-400" />
            </div>
            <p className="text-white font-semibold text-sm">Full Controls</p>
            <p className="text-gray-500 text-xs mt-1">D-Pad + ABCD buttons</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-12">
          © 2025 Planet Q Productions • Powered by Planet Q AI
        </p>
      </div>

      {/* Preview Modal */}
      {showPreview && game && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">{game.name}</h2>
              <button onClick={() => setShowPreview(false)} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700"><X className="w-4 h-4 text-white" /></button>
            </div>
            <div className="p-4">
              <PlayablePreview genre={game.genre} onClose={() => setShowPreview(false)} />
              <div className="mt-4 p-4 bg-gray-800/50 rounded-xl">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Game Details</h3>
                <p className="text-sm text-gray-400">{game.prompt}</p>
              </div>
              <button className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-medium text-white flex items-center justify-center gap-2 hover:opacity-90"><Code className="w-4 h-4" />Export {platform.toUpperCase()} Code</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
