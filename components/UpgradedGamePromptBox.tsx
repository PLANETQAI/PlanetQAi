'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Cpu, WandSparkles, Zap, Play, ChevronRight,
  Gamepad2, Target, Car, Trophy, Compass, Swords, Shield,
  Footprints, Skull, Plane, Puzzle, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight as ChevronRightIcon, X, Plus, Code
} from 'lucide-react';

// ============================================
// UPGRADED GAME PROMPT BOX WITH PLAYABLE PREVIEW
// Replace your existing prompt box component with this
// ============================================

// Game Genres Configuration
const GENRES = [
  { id: 'action', name: 'Action Games', icon: Swords, color: 'from-red-500 to-orange-500', accent: '#FF4444' },
  { id: 'puzzle', name: 'Puzzle Games', icon: Target, color: 'from-purple-500 to-pink-500', accent: '#A855F7' },
  { id: 'adventure', name: 'Adventure', icon: Trophy, color: 'from-yellow-500 to-amber-500', accent: '#F59E0B' },
  { id: 'arcade', name: 'Arcade', icon: Gamepad2, color: 'from-cyan-500 to-blue-500', accent: '#06B6D4' },
  { id: 'racing', name: 'Racing', icon: Car, color: 'from-green-500 to-emerald-500', accent: '#10B981' },
  { id: 'rpg', name: 'RPG', icon: Shield, color: 'from-indigo-500 to-purple-500', accent: '#6366F1' },
  { id: 'platformer', name: 'Platformer', icon: Footprints, color: 'from-pink-500 to-rose-500', accent: '#EC4899' },
  { id: 'shooter', name: 'Shooter', icon: Target, color: 'from-red-600 to-red-500', accent: '#DC2626' },
  { id: 'horror', name: 'Horror', icon: Skull, color: 'from-gray-700 to-gray-900', accent: '#374151' },
  { id: 'simulation', name: 'Simulation', icon: Plane, color: 'from-sky-500 to-blue-500', accent: '#0EA5E9' },
];

// Genre-specific prompts
const GENRE_PROMPTS: Record<string, string[]> = {
  action: [
    'A space shooter where you defend Earth from alien invasion...',
    'A martial arts fighting game in neon-lit streets...',
    'A superhero action game saving the city from villains...',
  ],
  puzzle: [
    'A puzzle platformer with gravity manipulation...',
    'A mystery puzzle game solving ancient riddles...',
    'A physics-based puzzle with portals and lasers...',
  ],
  adventure: [
    'An epic quest through enchanted forests...',
    'A treasure hunting adventure on mysterious islands...',
    'A time-traveling adventure across different eras...',
  ],
  arcade: [
    'A retro-style space invaders with modern twist...',
    'A fast-paced brick breaker with power-ups...',
    'An endless runner through cyberpunk city...',
  ],
  racing: [
    'A street racing game in neon-lit Tokyo...',
    'A futuristic anti-gravity racing championship...',
    'An off-road rally through dangerous terrains...',
  ],
  rpg: [
    'A medieval knight quest to slay a dragon...',
    'A mage academy student mastering elemental magic...',
    'A cyberpunk RPG in a dystopian megacity...',
  ],
  platformer: [
    'A colorful world hopping adventure with collectibles...',
    'A robot running through futuristic floating cities...',
    'A magical forest platformer with elemental powers...',
  ],
  shooter: [
    'A military shooter in a war-torn city...',
    'A sci-fi shooter on a space station...',
    'A zombie apocalypse shooter in an abandoned mall...',
  ],
  horror: [
    'A haunted mansion exploration with supernatural enemies...',
    'A hospital survival horror escaping experiments...',
    'A dark forest survival against unknown creatures...',
  ],
  simulation: [
    'A commercial airline pilot simulator...',
    'A city builder creating a metropolis...',
    'A space station management simulation...',
  ],
};

const DEFAULT_PROMPTS = [
  'A space shooter where you defend Earth from alien invasion...',
  'A puzzle platformer with gravity manipulation...',
  'A retro-style racing game with modern graphics...',
  'An RPG adventure in a magical forest...',
];

// Playable Game Preview Component
const PlayableGamePreview = ({ genre, onClose }: { genre: string; onClose: () => void }) => {
  const [charX, setCharX] = useState(200);
  const [charY, setCharY] = useState(180);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [bullets, setBullets] = useState<{id: number, x: number, y: number}[]>([]);
  const [enemies, setEnemies] = useState<{id: number, x: number, y: number}[]>([
    { id: 1, x: 100, y: 50 },
    { id: 2, x: 280, y: 80 },
  ]);
  const [effects, setEffects] = useState<{id: number, x: number, y: number, type: string}[]>([]);
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const [activeDpad, setActiveDpad] = useState<string | null>(null);
  const [isBoosting, setIsBoosting] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [jumpY, setJumpY] = useState(0);
  
  const bulletIdRef = useRef(0);
  const GAME_WIDTH = 400;
  const GAME_HEIGHT = 260;
  const MOVE_SPEED = 15;
  const BOOST_SPEED = 28;

  const getColors = useCallback(() => {
    const genreConfig = GENRES.find(g => g.id === genre);
    return {
      primary: genreConfig?.accent || '#4ECDC4',
      accent: '#FFD700',
      bg1: '#0a0a1a',
      bg2: '#1a1a3a'
    };
  }, [genre]);

  const colors = getColors();

  // Enemy movement
  useEffect(() => {
    const enemyInterval = setInterval(() => {
      setEnemies(prev => prev.map(enemy => ({
        ...enemy,
        x: Math.max(20, Math.min(GAME_WIDTH - 60, enemy.x + (Math.sin(Date.now() / 500 + enemy.id) * 2))),
        y: Math.max(30, Math.min(120, enemy.y + (Math.cos(Date.now() / 700 + enemy.id) * 1))),
      })));
    }, 50);
    return () => clearInterval(enemyInterval);
  }, []);

  // Bullet movement and collision
  useEffect(() => {
    const bulletInterval = setInterval(() => {
      setBullets(prev => {
        const updated = prev.map(b => ({ ...b, y: b.y - 12 })).filter(b => b.y > -20);
        updated.forEach(bullet => {
          setEnemies(currentEnemies => {
            const hitEnemy = currentEnemies.find(e => 
              Math.abs(bullet.x - e.x) < 30 && Math.abs(bullet.y - e.y) < 30
            );
            if (hitEnemy) {
              setEffects(prev => [...prev, { id: Date.now(), x: hitEnemy.x, y: hitEnemy.y, type: 'explosion' }]);
              setScore(s => s + 100);
              return currentEnemies.filter(e => e.id !== hitEnemy.id);
            }
            return currentEnemies;
          });
        });
        return updated;
      });
    }, 30);
    return () => clearInterval(bulletInterval);
  }, []);

  // Respawn enemies
  useEffect(() => {
    const respawnInterval = setInterval(() => {
      setEnemies(prev => {
        if (prev.length < 3) {
          return [...prev, { id: Date.now(), x: Math.random() * (GAME_WIDTH - 60) + 30, y: Math.random() * 80 + 30 }];
        }
        return prev;
      });
    }, 3000);
    return () => clearInterval(respawnInterval);
  }, []);

  // Clear effects
  useEffect(() => {
    const effectInterval = setInterval(() => {
      setEffects(prev => prev.filter(e => Date.now() - e.id < 500));
    }, 100);
    return () => clearInterval(effectInterval);
  }, []);

  const handleDpadPress = (direction: string) => {
    setActiveDpad(direction);
    const speed = isBoosting ? BOOST_SPEED : MOVE_SPEED;
    switch (direction) {
      case 'up': setCharY(y => Math.max(50, y - speed)); break;
      case 'down': setCharY(y => Math.min(GAME_HEIGHT - 60, y + speed)); break;
      case 'left': setCharX(x => Math.max(20, x - speed)); break;
      case 'right': setCharX(x => Math.min(GAME_WIDTH - 40, x + speed)); break;
    }
  };

  const handleButtonPress = (button: string) => {
    setActiveBtn(button);
    switch (button) {
      case 'A':
        setEffects(prev => [...prev, { id: Date.now(), x: charX + 15, y: charY - 10, type: 'muzzle' }]);
        setBullets(prev => [...prev, { id: bulletIdRef.current++, x: charX + 12, y: charY - 10 }]);
        break;
      case 'B':
        if (!isJumping) {
          setIsJumping(true);
          let jumpProgress = 0;
          const jumpAnimation = () => {
            jumpProgress += 0.1;
            if (jumpProgress <= 1) {
              setJumpY(-Math.sin(jumpProgress * Math.PI) * 60);
              requestAnimationFrame(jumpAnimation);
            } else {
              setJumpY(0);
              setIsJumping(false);
            }
          };
          requestAnimationFrame(jumpAnimation);
        }
        break;
      case 'C':
        setEffects(prev => [...prev, { id: Date.now(), x: charX + 15, y: charY - 10, type: 'special' }]);
        [-20, 0, 20].forEach((offset, i) => {
          setTimeout(() => {
            setBullets(prev => [...prev, { id: bulletIdRef.current++, x: charX + 12 + offset, y: charY - 10 }]);
          }, i * 40);
        });
        break;
      case 'D':
        setIsBoosting(true);
        setTimeout(() => setIsBoosting(false), 1500);
        break;
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden bg-black border-2 border-gray-700/50">
      {/* Game Screen */}
      <div 
        className="relative overflow-hidden"
        style={{ 
          height: GAME_HEIGHT,
          background: `linear-gradient(180deg, ${colors.bg1} 0%, ${colors.bg2} 100%)`
        }}
      >
        {/* Stars */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
              opacity: Math.random() * 0.8 + 0.2,
            }}
          />
        ))}
        
        {/* Enemies */}
        {enemies.map(enemy => (
          <div key={enemy.id} className="absolute" style={{ left: enemy.x, top: enemy.y }}>
            <div className="absolute w-12 h-10 rounded-full opacity-30" style={{ backgroundColor: '#FF4444', top: -5, left: -5 }} />
            <div className="w-10 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FF4444' }}>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-white rounded-full" />
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
          </div>
        ))}
        
        {/* Bullets */}
        {bullets.map(bullet => (
          <div 
            key={bullet.id}
            className="absolute w-2 h-4 rounded-full"
            style={{ left: bullet.x, top: bullet.y, backgroundColor: colors.accent, boxShadow: `0 0 10px ${colors.accent}` }}
          />
        ))}
        
        {/* Effects */}
        {effects.map(effect => (
          <div 
            key={effect.id}
            className="absolute w-8 h-8 rounded-full animate-ping"
            style={{ left: effect.x - 15, top: effect.y - 15, backgroundColor: effect.type === 'explosion' ? '#FF6600' : colors.accent, opacity: 0.8 }}
          />
        ))}
        
        {/* Player */}
        <div className="absolute transition-all duration-75" style={{ left: charX, top: charY + jumpY }}>
          <div className="absolute w-12 h-14 rounded-full opacity-20" style={{ backgroundColor: colors.primary, top: -5, left: -5 }} />
          {isBoosting && <div className="absolute w-14 h-16 rounded-full border-2 animate-ping" style={{ borderColor: colors.accent, top: -10, left: -7 }} />}
          <div className="flex flex-col items-center">
            <div className="w-5 h-4 rounded-full mb-0.5" style={{ backgroundColor: colors.primary }} />
            <div className="w-6 h-7 rounded-md" style={{ backgroundColor: colors.primary }} />
          </div>
          {isBoosting && <div className="absolute w-3 h-5 rounded-full animate-pulse" style={{ backgroundColor: colors.accent, bottom: -15, left: '50%', transform: 'translateX(-50%)' }} />}
        </div>
        
        {/* HUD */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
          <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${health}%` }} />
          </div>
          <span className="font-mono font-bold text-sm" style={{ color: colors.accent }}>
            {score.toString().padStart(6, '0')}
          </span>
        </div>
        
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase" style={{ backgroundColor: colors.primary + '50', color: colors.primary }}>
          {genre}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center p-4 bg-gray-900/90">
        {/* D-Pad */}
        <div className="flex flex-col items-center">
          <button 
            className={`w-10 h-10 rounded-md flex items-center justify-center transition-all ${activeDpad === 'up' ? 'scale-95' : ''}`}
            style={{ backgroundColor: activeDpad === 'up' ? colors.primary : '#1f2937' }}
            onMouseDown={() => handleDpadPress('up')}
            onMouseUp={() => setActiveDpad(null)}
            onMouseLeave={() => setActiveDpad(null)}
            onTouchStart={() => handleDpadPress('up')}
            onTouchEnd={() => setActiveDpad(null)}
          >
            <ChevronUp className={`w-5 h-5 ${activeDpad === 'up' ? 'text-white' : 'text-gray-500'}`} />
          </button>
          <div className="flex">
            <button 
              className={`w-10 h-10 rounded-md flex items-center justify-center transition-all`}
              style={{ backgroundColor: activeDpad === 'left' ? colors.primary : '#1f2937' }}
              onMouseDown={() => handleDpadPress('left')}
              onMouseUp={() => setActiveDpad(null)}
              onMouseLeave={() => setActiveDpad(null)}
              onTouchStart={() => handleDpadPress('left')}
              onTouchEnd={() => setActiveDpad(null)}
            >
              <ChevronLeft className={`w-5 h-5 ${activeDpad === 'left' ? 'text-white' : 'text-gray-500'}`} />
            </button>
            <div className="w-10 h-10 bg-gray-900" />
            <button 
              className={`w-10 h-10 rounded-md flex items-center justify-center transition-all`}
              style={{ backgroundColor: activeDpad === 'right' ? colors.primary : '#1f2937' }}
              onMouseDown={() => handleDpadPress('right')}
              onMouseUp={() => setActiveDpad(null)}
              onMouseLeave={() => setActiveDpad(null)}
              onTouchStart={() => handleDpadPress('right')}
              onTouchEnd={() => setActiveDpad(null)}
            >
              <ChevronRightIcon className={`w-5 h-5 ${activeDpad === 'right' ? 'text-white' : 'text-gray-500'}`} />
            </button>
          </div>
          <button 
            className={`w-10 h-10 rounded-md flex items-center justify-center transition-all`}
            style={{ backgroundColor: activeDpad === 'down' ? colors.primary : '#1f2937' }}
            onMouseDown={() => handleDpadPress('down')}
            onMouseUp={() => setActiveDpad(null)}
            onMouseLeave={() => setActiveDpad(null)}
            onTouchStart={() => handleDpadPress('down')}
            onTouchEnd={() => setActiveDpad(null)}
          >
            <ChevronDown className={`w-5 h-5 ${activeDpad === 'down' ? 'text-white' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button 
              className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border-2 transition-all ${activeBtn === 'A' ? 'scale-90 border-white' : 'border-white/20'}`}
              style={{ backgroundColor: '#EF4444' }}
              onMouseDown={() => handleButtonPress('A')}
              onMouseUp={() => setActiveBtn(null)}
              onTouchStart={() => handleButtonPress('A')}
              onTouchEnd={() => setActiveBtn(null)}
            >
              <span className="text-white font-bold text-sm">A</span>
              <span className="text-white text-[8px] font-semibold">FIRE</span>
            </button>
            <button 
              className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border-2 transition-all ${activeBtn === 'B' ? 'scale-90 border-white' : 'border-white/20'}`}
              style={{ backgroundColor: '#06B6D4' }}
              onMouseDown={() => handleButtonPress('B')}
              onMouseUp={() => setActiveBtn(null)}
              onTouchStart={() => handleButtonPress('B')}
              onTouchEnd={() => setActiveBtn(null)}
            >
              <span className="text-white font-bold text-sm">B</span>
              <span className="text-white text-[8px] font-semibold">JUMP</span>
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border-2 transition-all ${activeBtn === 'C' ? 'scale-90 border-white' : 'border-white/20'}`}
              style={{ backgroundColor: '#EAB308' }}
              onMouseDown={() => handleButtonPress('C')}
              onMouseUp={() => setActiveBtn(null)}
              onTouchStart={() => handleButtonPress('C')}
              onTouchEnd={() => setActiveBtn(null)}
            >
              <span className="text-gray-900 font-bold text-sm">C</span>
              <span className="text-gray-900 text-[8px] font-semibold">SPECIAL</span>
            </button>
            <button 
              className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border-2 transition-all ${activeBtn === 'D' ? 'scale-90 border-white' : 'border-white/20'}`}
              style={{ backgroundColor: '#22C55E' }}
              onMouseDown={() => handleButtonPress('D')}
              onMouseUp={() => setActiveBtn(null)}
              onTouchStart={() => handleButtonPress('D')}
              onTouchEnd={() => setActiveBtn(null)}
            >
              <span className="text-gray-900 font-bold text-sm">D</span>
              <span className="text-gray-900 text-[8px] font-semibold">BOOST</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Upgraded Prompt Box Component
export default function UpgradedGamePromptBox() {
  const [selectedGenre, setSelectedGenre] = useState<string>('action');
  const [prompt, setPrompt] = useState('');
  const [characterDescription, setCharacterDescription] = useState('');
  const [controlScheme, setControlScheme] = useState<'dpad' | 'swipe'>('dpad');
  const [targetPlatform, setTargetPlatform] = useState<'javascript' | 'unity' | 'unreal'>('javascript');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedGame, setGeneratedGame] = useState<any>(null);

  const getExamplePrompts = () => {
    return GENRE_PROMPTS[selectedGenre] || DEFAULT_PROMPTS;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate generation - replace with your actual API call
    setTimeout(() => {
      setGeneratedGame({
        name: `${selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)} Adventure`,
        genre: selectedGenre,
        prompt: prompt,
      });
      setShowPreview(true);
      setIsGenerating(false);
    }, 2000);
  };

  const selectedGenreConfig = GENRES.find(g => g.id === selectedGenre);

  return (
    <div className="relative">
      {/* Glow Effect */}
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
              {GENRES.slice(0, 6).map((genre) => {
                const Icon = genre.icon;
                const isSelected = selectedGenre === genre.id;
                return (
                  <button
                    key={genre.id}
                    onClick={() => setSelectedGenre(genre.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
                      isSelected
                        ? `bg-gradient-to-r ${genre.color} border-transparent shadow-lg`
                        : 'bg-gray-900/50 border-gray-700/50 hover:border-purple-500/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                      {genre.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Describe Your Game</label>
            <div className="relative">
              <div className="absolute left-4 top-4 text-purple-400">
                <WandSparkles className="w-5 h-5" />
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your dream game... What's the genre? What makes it unique? What's the goal?"
                className="w-full h-32 sm:h-40 bg-gray-800/50 border border-gray-700/50 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                maxLength={500}
              />
              <div className="absolute right-4 bottom-4 text-xs text-gray-500">
                {prompt.length} / 500
              </div>
            </div>
            
            {/* Example Prompts */}
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Try an example:</p>
              <div className="flex flex-wrap gap-2">
                {getExamplePrompts().map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(example)}
                    className="text-xs px-3 py-1.5 bg-gray-800/50 hover:bg-purple-500/20 border border-gray-700/50 hover:border-purple-500/50 rounded-full text-gray-400 hover:text-purple-300 transition-all truncate max-w-[200px]"
                  >
                    {example.substring(0, 35)}...
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Character Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Character Description (Optional)</label>
            <input
              type="text"
              value={characterDescription}
              onChange={(e) => setCharacterDescription(e.target.value)}
              placeholder="Describe your main character..."
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
              maxLength={200}
            />
          </div>

          {/* Control Scheme */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Control Scheme</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setControlScheme('dpad')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  controlScheme === 'dpad'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  {/* Mini D-Pad */}
                  <div className="flex flex-col items-center scale-75">
                    <div className="w-4 h-4 bg-gray-600 rounded-sm" />
                    <div className="flex">
                      <div className="w-4 h-4 bg-gray-600 rounded-sm" />
                      <div className="w-4 h-4" />
                      <div className="w-4 h-4 bg-gray-600 rounded-sm" />
                    </div>
                    <div className="w-4 h-4 bg-gray-600 rounded-sm" />
                  </div>
                  {/* Mini Buttons */}
                  <div className="grid grid-cols-2 gap-1">
                    <div className="w-4 h-4 rounded-full bg-red-500" />
                    <div className="w-4 h-4 rounded-full bg-cyan-500" />
                    <div className="w-4 h-4 rounded-full bg-yellow-500" />
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                  </div>
                </div>
                <p className={`text-sm font-medium ${controlScheme === 'dpad' ? 'text-purple-400' : 'text-gray-400'}`}>
                  D-Pad + ABCD
                </p>
                <p className="text-xs text-gray-500 mt-1">Classic controller</p>
              </button>

              <button
                onClick={() => setControlScheme('swipe')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  controlScheme === 'swipe'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gamepad2 className="w-8 h-8 text-cyan-400" />
                  <div className="flex flex-col items-center text-gray-500">
                    <ChevronUp className="w-3 h-3" />
                    <div className="flex gap-1">
                      <ChevronLeft className="w-3 h-3" />
                      <ChevronRightIcon className="w-3 h-3" />
                    </div>
                    <ChevronDown className="w-3 h-3" />
                  </div>
                </div>
                <p className={`text-sm font-medium ${controlScheme === 'swipe' ? 'text-purple-400' : 'text-gray-400'}`}>
                  Swipe Controls
                </p>
                <p className="text-xs text-gray-500 mt-1">Touch-based</p>
              </button>
            </div>
          </div>

          {/* Platform Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Target Platform</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'javascript', name: 'JavaScript', icon: '🌐' },
                { id: 'unity', name: 'Unity', icon: '🎮' },
                { id: 'unreal', name: 'Unreal', icon: '⚡' },
              ].map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setTargetPlatform(platform.id as any)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    targetPlatform === platform.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
                  }`}
                >
                  <span className="text-xl mb-1 block">{platform.icon}</span>
                  <p className={`text-xs font-medium ${targetPlatform === platform.id ? 'text-purple-400' : 'text-gray-400'}`}>
                    {platform.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Instant Generation</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Play className="w-4 h-4 text-green-400" />
                <span>Play in Browser</span>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={`group relative flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 overflow-hidden ${
                isGenerating || !prompt.trim()
                  ? 'bg-gray-700 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105'
              }`}
            >
              <span className="relative z-10 text-white flex items-center gap-3">
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Game
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && generatedGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl border border-gray-700 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">{generatedGame.name}</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              
              <div className="p-4">
                <PlayableGamePreview genre={generatedGame.genre} onClose={() => setShowPreview(false)} />
                
                <div className="mt-4 p-4 bg-gray-800/50 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Game Details</h3>
                  <p className="text-sm text-gray-400">{generatedGame.prompt}</p>
                </div>
                
                <button className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-medium text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <Code className="w-4 h-4" />
                  Export {targetPlatform.toUpperCase()} Code
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
