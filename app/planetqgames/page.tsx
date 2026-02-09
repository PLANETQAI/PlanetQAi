'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Sparkles, Target, Car, Trophy, Compass, Swords, Shield, 
  Footprints, Skull, Plane, Puzzle, ChevronUp, ChevronDown, 
  ChevronLeft, ChevronRight, Gamepad2, Zap, Play, Infinity,
  Code, X, Plus
} from 'lucide-react'

// Game Genres with icons and colors
const GENRES = [
  { id: 'shooter', name: '3D Shooter', icon: Target, color: '#FF4444', description: 'FPS/TPS Action' },
  { id: 'racing', name: '3D Racing', icon: Car, color: '#FFEAA7', description: 'High Speed' },
  { id: 'sports', name: '3D Sports', icon: Trophy, color: '#44FF44', description: 'Pro Sports' },
  { id: 'adventure', name: '3D Adventure', icon: Compass, color: '#45B7D1', description: 'Open World' },
  { id: 'fighting', name: '3D Fighting', icon: Swords, color: '#FF6B6B', description: 'Combat' },
  { id: 'rpg', name: '3D RPG', icon: Shield, color: '#DDA0DD', description: 'Fantasy' },
  { id: 'platformer', name: '3D Platformer', icon: Footprints, color: '#96CEB4', description: 'Jump & Run' },
  { id: 'horror', name: '3D Horror', icon: Skull, color: '#8B0000', description: 'Survival' },
  { id: 'simulation', name: '3D Simulation', icon: Plane, color: '#87CEEB', description: 'Realistic' },
  { id: 'puzzle', name: '3D Puzzle', icon: Puzzle, color: '#4ECDC4', description: 'Brain Teaser' },
]

const PLATFORMS = [
  { id: 'javascript', name: 'JavaScript/HTML5', icon: '🌐' },
  { id: 'unity', name: 'Unity C#', icon: '🎮' },
  { id: 'unreal', name: 'Unreal C++', icon: '⚡' },
]

// Genre-specific example prompts
const GENRE_PROMPTS: { [key: string]: string[] } = {
  shooter: [
    'A military shooter in a war-torn city with tactical combat...',
    'A sci-fi shooter on a space station fighting alien invaders...',
    'A zombie apocalypse shooter in an abandoned mall...',
  ],
  racing: [
    'A street racing game in neon-lit Tokyo at night...',
    'A Formula 1 simulator on famous world circuits...',
    'An off-road rally racing through muddy jungle trails...',
  ],
  sports: [
    'A professional football game in a packed stadium...',
    'A basketball street court 3v3 competition...',
    'A soccer World Cup final match experience...',
  ],
  adventure: [
    'An ancient ruins explorer discovering lost civilizations...',
    'A jungle adventure searching for hidden treasure...',
    'A mountaineering expedition to reach the summit...',
  ],
  fighting: [
    'A martial arts tournament with diverse fighting styles...',
    'A street fighting game in urban environments...',
    'A fantasy combat game with magical abilities...',
  ],
  rpg: [
    'A medieval knight quest to slay a dragon...',
    'A mage academy student learning powerful spells...',
    'An epic journey to save the kingdom from darkness...',
  ],
  platformer: [
    'A colorful world hopping adventure with collectibles...',
    'A robot running through futuristic floating cities...',
    'A magical forest platformer with elemental powers...',
  ],
  horror: [
    'A haunted mansion exploration with supernatural enemies...',
    'A hospital survival horror escaping experiments...',
    'A dark forest survival against unknown creatures...',
  ],
  simulation: [
    'A commercial airline pilot flying global routes...',
    'A farming simulator building the ultimate farm...',
    'A city builder creating a metropolis from scratch...',
  ],
  puzzle: [
    'A portal-based puzzle game manipulating space...',
    'A physics puzzle solving ancient temple mechanisms...',
    'A time-manipulation puzzle changing past and future...',
  ],
}

const DEFAULT_PROMPTS = [
  'A space shooter where you defend Earth from alien invasion...',
  'A high-speed racing game through neon city streets...',
  'An RPG adventure in a magical forest with mystical creatures...',
]

// Playable Game Preview Component
const PlayableGamePreview = ({ genre, gameData, prompt, characterDescription }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [charX, setCharX] = useState(200)
  const [charY, setCharY] = useState(180)
  const [isJumping, setIsJumping] = useState(false)
  const [isBoosting, setIsBoosting] = useState(false)
  const [score, setScore] = useState(0)
  const [health, setHealth] = useState(100)
  const [bullets, setBullets] = useState<{id: number, x: number, y: number}[]>([])
  const [enemies, setEnemies] = useState<{id: number, x: number, y: number}[]>([
    { id: 1, x: 100, y: 50 },
    { id: 2, x: 250, y: 80 },
  ])
  const [effects, setEffects] = useState<{id: number, x: number, y: number, type: string}[]>([])
  const [activeBtn, setActiveBtn] = useState<string | null>(null)
  const [activeDpad, setActiveDpad] = useState<string | null>(null)
  const [jumpY, setJumpY] = useState(0)
  
  const bulletIdRef = useRef(0)
  const jumpAnimRef = useRef<number | null>(null)
  
  const GAME_WIDTH = 400
  const GAME_HEIGHT = 260
  const MOVE_SPEED = 15
  const BOOST_SPEED = 28

  const getColors = useCallback(() => {
    const colorMap: {[key: string]: {primary: string, accent: string, bg1: string, bg2: string}} = {
      shooter: { primary: '#FF4444', accent: '#00FFFF', bg1: '#1a0a0a', bg2: '#2a1a1a' },
      racing: { primary: '#FFEAA7', accent: '#FF6B6B', bg1: '#1a1a0a', bg2: '#2a2a1a' },
      sports: { primary: '#44FF44', accent: '#FFFFFF', bg1: '#0a1a0a', bg2: '#1a2a1a' },
      adventure: { primary: '#45B7D1', accent: '#FFD700', bg1: '#0a1a2a', bg2: '#1a2a3a' },
      fighting: { primary: '#FF6B6B', accent: '#FFFF00', bg1: '#2a0a0a', bg2: '#3a1a1a' },
      rpg: { primary: '#DDA0DD', accent: '#00FF00', bg1: '#1a0a1a', bg2: '#2a1a2a' },
      platformer: { primary: '#96CEB4', accent: '#FF69B4', bg1: '#0a1a1a', bg2: '#1a2a2a' },
      horror: { primary: '#8B0000', accent: '#00FF00', bg1: '#0a0a0a', bg2: '#1a0a0a' },
      simulation: { primary: '#87CEEB', accent: '#FFA500', bg1: '#0a1a2a', bg2: '#1a2a3a' },
      puzzle: { primary: '#4ECDC4', accent: '#FF00FF', bg1: '#0a1a1a', bg2: '#1a2a2a' },
    }
    return colorMap[genre] || { primary: '#4ECDC4', accent: '#FFD700', bg1: '#0a0a1a', bg2: '#1a1a3a' }
  }, [genre])

  const colors = getColors()

  // Enemy movement
  useEffect(() => {
    const enemyInterval = setInterval(() => {
      setEnemies(prev => prev.map(enemy => ({
        ...enemy,
        x: Math.max(20, Math.min(GAME_WIDTH - 60, enemy.x + (Math.sin(Date.now() / 500 + enemy.id) * 2))),
        y: Math.max(30, Math.min(120, enemy.y + (Math.cos(Date.now() / 700 + enemy.id) * 1))),
      })))
    }, 50)

    return () => clearInterval(enemyInterval)
  }, [])

  // Bullet movement and collision
  useEffect(() => {
    const bulletInterval = setInterval(() => {
      setBullets(prev => {
        const updated = prev.map(b => ({ ...b, y: b.y - 12 })).filter(b => b.y > -20)
        
        updated.forEach(bullet => {
          setEnemies(currentEnemies => {
            const hitEnemy = currentEnemies.find(e => 
              Math.abs(bullet.x - e.x) < 30 && Math.abs(bullet.y - e.y) < 30
            )
            if (hitEnemy) {
              setEffects(prev => [...prev, { id: Date.now(), x: hitEnemy.x, y: hitEnemy.y, type: 'explosion' }])
              setScore(s => s + 100)
              return currentEnemies.filter(e => e.id !== hitEnemy.id)
            }
            return currentEnemies
          })
        })
        
        return updated
      })
    }, 30)

    return () => clearInterval(bulletInterval)
  }, [])

  // Respawn enemies
  useEffect(() => {
    const respawnInterval = setInterval(() => {
      setEnemies(prev => {
        if (prev.length < 3) {
          return [...prev, { id: Date.now(), x: Math.random() * (GAME_WIDTH - 60) + 30, y: Math.random() * 80 + 30 }]
        }
        return prev
      })
    }, 3000)

    return () => clearInterval(respawnInterval)
  }, [])

  // Clear effects
  useEffect(() => {
    const effectInterval = setInterval(() => {
      setEffects(prev => prev.filter(e => Date.now() - e.id < 500))
    }, 100)

    return () => clearInterval(effectInterval)
  }, [])

  // D-Pad controls
  const handleDpadPress = (direction: string) => {
    setActiveDpad(direction)
    const speed = isBoosting ? BOOST_SPEED : MOVE_SPEED
    
    switch (direction) {
      case 'up': setCharY(y => Math.max(50, y - speed)); break
      case 'down': setCharY(y => Math.min(GAME_HEIGHT - 60, y + speed)); break
      case 'left': setCharX(x => Math.max(20, x - speed)); break
      case 'right': setCharX(x => Math.min(GAME_WIDTH - 40, x + speed)); break
    }
  }

  const handleDpadRelease = () => setActiveDpad(null)

  // Action buttons
  const handleButtonPress = (button: string) => {
    setActiveBtn(button)
    
    switch (button) {
      case 'A': // Shoot
        setEffects(prev => [...prev, { id: Date.now(), x: charX + 15, y: charY - 10, type: 'muzzle' }])
        setBullets(prev => [...prev, { id: bulletIdRef.current++, x: charX + 12, y: charY - 10 }])
        break
        
      case 'B': // Jump
        if (!isJumping) {
          setIsJumping(true)
          let jumpProgress = 0
          const jumpAnimation = () => {
            jumpProgress += 0.1
            if (jumpProgress <= 1) {
              const jumpHeight = Math.sin(jumpProgress * Math.PI) * 60
              setJumpY(-jumpHeight)
              jumpAnimRef.current = requestAnimationFrame(jumpAnimation)
            } else {
              setJumpY(0)
              setIsJumping(false)
            }
          }
          jumpAnimRef.current = requestAnimationFrame(jumpAnimation)
        }
        break
        
      case 'C': // Special
        setEffects(prev => [...prev, { id: Date.now(), x: charX + 15, y: charY - 10, type: 'special' }])
        ;[-20, 0, 20].forEach((offset, i) => {
          setTimeout(() => {
            setBullets(prev => [...prev, { id: bulletIdRef.current++, x: charX + 12 + offset, y: charY - 10 }])
          }, i * 40)
        })
        break
        
      case 'D': // Boost
        setIsBoosting(true)
        setTimeout(() => {
          setIsBoosting(false)
        }, 1500)
        break
    }
  }

  const handleButtonRelease = () => setActiveBtn(null)

  return (
    <div className="rounded-2xl overflow-hidden bg-black border-2 border-gray-700">
      {/* Game Screen */}
      <div 
        className="relative overflow-hidden"
        style={{ 
          height: GAME_HEIGHT, 
          background: `linear-gradient(180deg, ${colors.bg1} 0%, ${colors.bg2} 100%)` 
        }}
      >
        {/* Stars background */}
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
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
        
        {/* Enemies */}
        {enemies.map(enemy => (
          <div 
            key={enemy.id} 
            className="absolute"
            style={{ left: enemy.x, top: enemy.y }}
          >
            <div 
              className="absolute w-12 h-10 rounded-full opacity-30"
              style={{ backgroundColor: '#FF4444', top: -5, left: -5 }}
            />
            <div 
              className="w-10 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#FF4444' }}
            >
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
            style={{ 
              left: bullet.x, 
              top: bullet.y, 
              backgroundColor: colors.accent,
              boxShadow: `0 0 10px ${colors.accent}`
            }} 
          />
        ))}
        
        {/* Effects */}
        {effects.map(effect => (
          <div 
            key={effect.id} 
            className="absolute w-8 h-8 rounded-full animate-ping"
            style={{ 
              left: effect.x - 15, 
              top: effect.y - 15,
              backgroundColor: effect.type === 'explosion' ? '#FF6600' : colors.accent,
              opacity: 0.8
            }} 
          />
        ))}
        
        {/* Player */}
        <div 
          className="absolute transition-all duration-75"
          style={{ 
            left: charX, 
            top: charY + jumpY,
          }}
        >
          {/* Player glow */}
          <div 
            className="absolute w-12 h-14 rounded-full opacity-20"
            style={{ backgroundColor: colors.primary, top: -5, left: -5 }}
          />
          
          {/* Boost ring */}
          {isBoosting && (
            <div 
              className="absolute w-14 h-16 rounded-full border-2 animate-ping"
              style={{ borderColor: colors.accent, top: -10, left: -7 }}
            />
          )}
          
          {/* Player sprite */}
          <div className="flex flex-col items-center">
            <div 
              className="w-5 h-4 rounded-full mb-0.5"
              style={{ backgroundColor: colors.primary }}
            />
            <div 
              className="w-6 h-7 rounded-md"
              style={{ backgroundColor: colors.primary }}
            />
          </div>
          
          {/* Jet flame when boosting */}
          {isBoosting && (
            <div 
              className="absolute w-3 h-5 rounded-full animate-pulse"
              style={{ 
                backgroundColor: colors.accent, 
                bottom: -15, 
                left: '50%', 
                transform: 'translateX(-50%)' 
              }}
            />
          )}
        </div>
        
        {/* Minimal HUD */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
          <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${health}%` }}
            />
          </div>
          <span 
            className="font-mono font-bold text-sm"
            style={{ color: colors.accent }}
          >
            {score.toString().padStart(6, '0')}
          </span>
        </div>
        
        {/* Genre tag */}
        <div 
          className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: colors.primary + '50', color: colors.primary }}
        >
          {genre?.toUpperCase() || 'ACTION'}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center p-4 bg-[#0a0a10]">
        {/* D-Pad */}
        <div className="flex flex-col items-center">
          <button 
            className={`w-10 h-10 rounded-md flex items-center justify-center transition-all ${
              activeDpad === 'up' ? 'scale-95' : ''
            }`}
            style={{ backgroundColor: activeDpad === 'up' ? colors.primary : '#1a1a24' }}
            onMouseDown={() => handleDpadPress('up')}
            onMouseUp={handleDpadRelease}
            onMouseLeave={handleDpadRelease}
            onTouchStart={() => handleDpadPress('up')}
            onTouchEnd={handleDpadRelease}
          >
            <ChevronUp className={`w-5 h-5 ${activeDpad === 'up' ? 'text-white' : 'text-gray-500'}`} />
          </button>
          <div className="flex">
            <button 
              className={`w-10 h-10 rounded-md flex items-center justify-center transition-all ${
                activeDpad === 'left' ? 'scale-95' : ''
              }`}
              style={{ backgroundColor: activeDpad === 'left' ? colors.primary : '#1a1a24' }}
              onMouseDown={() => handleDpadPress('left')}
              onMouseUp={handleDpadRelease}
              onMouseLeave={handleDpadRelease}
              onTouchStart={() => handleDpadPress('left')}
              onTouchEnd={handleDpadRelease}
            >
              <ChevronLeft className={`w-5 h-5 ${activeDpad === 'left' ? 'text-white' : 'text-gray-500'}`} />
            </button>
            <div className="w-10 h-10 bg-[#0a0a10]" />
            <button 
              className={`w-10 h-10 rounded-md flex items-center justify-center transition-all ${
                activeDpad === 'right' ? 'scale-95' : ''
              }`}
              style={{ backgroundColor: activeDpad === 'right' ? colors.primary : '#1a1a24' }}
              onMouseDown={() => handleDpadPress('right')}
              onMouseUp={handleDpadRelease}
              onMouseLeave={handleDpadRelease}
              onTouchStart={() => handleDpadPress('right')}
              onTouchEnd={handleDpadRelease}
            >
              <ChevronRight className={`w-5 h-5 ${activeDpad === 'right' ? 'text-white' : 'text-gray-500'}`} />
            </button>
          </div>
          <button 
            className={`w-10 h-10 rounded-md flex items-center justify-center transition-all ${
              activeDpad === 'down' ? 'scale-95' : ''
            }`}
            style={{ backgroundColor: activeDpad === 'down' ? colors.primary : '#1a1a24' }}
            onMouseDown={() => handleDpadPress('down')}
            onMouseUp={handleDpadRelease}
            onMouseLeave={handleDpadRelease}
            onTouchStart={() => handleDpadPress('down')}
            onTouchEnd={handleDpadRelease}
          >
            <ChevronDown className={`w-5 h-5 ${activeDpad === 'down' ? 'text-white' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button 
              className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border-2 transition-all ${
                activeBtn === 'A' ? 'scale-90 border-white' : 'border-white/20'
              }`}
              style={{ backgroundColor: '#FF4444' }}
              onMouseDown={() => handleButtonPress('A')}
              onMouseUp={handleButtonRelease}
              onMouseLeave={handleButtonRelease}
              onTouchStart={() => handleButtonPress('A')}
              onTouchEnd={handleButtonRelease}
            >
              <span className="text-white font-bold text-sm">A</span>
              <span className="text-white text-[8px] font-semibold">FIRE</span>
            </button>
            <button 
              className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border-2 transition-all ${
                activeBtn === 'B' ? 'scale-90 border-white' : 'border-white/20'
              }`}
              style={{ backgroundColor: '#4ECDC4' }}
              onMouseDown={() => handleButtonPress('B')}
              onMouseUp={handleButtonRelease}
              onMouseLeave={handleButtonRelease}
              onTouchStart={() => handleButtonPress('B')}
              onTouchEnd={handleButtonRelease}
            >
              <span className="text-white font-bold text-sm">B</span>
              <span className="text-white text-[8px] font-semibold">JUMP</span>
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border-2 transition-all ${
                activeBtn === 'C' ? 'scale-90 border-white' : 'border-white/20'
              }`}
              style={{ backgroundColor: '#FFD700' }}
              onMouseDown={() => handleButtonPress('C')}
              onMouseUp={handleButtonRelease}
              onMouseLeave={handleButtonRelease}
              onTouchStart={() => handleButtonPress('C')}
              onTouchEnd={handleButtonRelease}
            >
              <span className="text-gray-800 font-bold text-sm">C</span>
              <span className="text-gray-800 text-[8px] font-semibold">SPECIAL</span>
            </button>
            <button 
              className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border-2 transition-all ${
                activeBtn === 'D' ? 'scale-90 border-white' : 'border-white/20'
              }`}
              style={{ backgroundColor: '#44FF88' }}
              onMouseDown={() => handleButtonPress('D')}
              onMouseUp={handleButtonRelease}
              onMouseLeave={handleButtonRelease}
              onTouchStart={() => handleButtonPress('D')}
              onTouchEnd={handleButtonRelease}
            >
              <span className="text-gray-800 font-bold text-sm">D</span>
              <span className="text-gray-800 text-[8px] font-semibold">BOOST</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Game Generator Page
export default function PlanetQGames() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [characterDescription, setCharacterDescription] = useState('')
  const [controlScheme, setControlScheme] = useState('dpad_buttons')
  const [targetPlatform, setTargetPlatform] = useState('javascript')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedGame, setGeneratedGame] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getExamplePrompts = () => {
    if (selectedGenre && GENRE_PROMPTS[selectedGenre]) {
      return GENRE_PROMPTS[selectedGenre]
    }
    return DEFAULT_PROMPTS
  }

  const handleGenerate = async () => {
    if (!selectedGenre || !prompt.trim()) {
      setError('Please select a genre and enter a game description')
      return
    }

    setIsGenerating(true)
    setError(null)

    // Simulate AI generation (replace with actual API call)
    setTimeout(() => {
      const mockGame = {
        game: {
          name: `${selectedGenre?.charAt(0).toUpperCase()}${selectedGenre?.slice(1)} Adventure`,
        },
        schema: {
          story_premise: prompt,
          main_character: {
            name: characterDescription || 'Hero',
            description: characterDescription || 'A brave adventurer',
          },
          initial_scene: {
            setting: prompt,
            mechanic: 'Explore and battle enemies',
          },
        },
        next_scene_prompts: [
          'Continue to the dark cave...',
          'Explore the ancient ruins...',
          'Face the final boss...',
        ],
      }
      
      setGeneratedGame(mockGame)
      setShowPreview(true)
      setIsGenerating(false)
    }, 2000)
  }

  const handleExamplePrompt = (example: string) => {
    setPrompt(example)
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Game Generator</h1>
          <p className="text-gray-400 text-lg">Transform your imagination into playable games with AI</p>
          
          {/* AI Badge */}
          <div className="inline-flex items-center gap-2 bg-[#4ECDC4]/10 px-4 py-2 rounded-full mt-4">
            <Sparkles className="w-4 h-4 text-[#4ECDC4]" />
            <span className="text-[#4ECDC4] text-sm font-semibold">Powered by Planet Q AI</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/20 text-red-400 p-4 rounded-xl mb-6">
            <X className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Genre Selector */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Select 3D Game Genre</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {GENRES.map((genre) => {
              const Icon = genre.icon
              return (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`flex-shrink-0 w-28 p-4 rounded-2xl bg-[#1a1a24] border-2 transition-all hover:scale-105 ${
                    selectedGenre === genre.id ? 'border-current' : 'border-[#2a2a34]'
                  }`}
                  style={{ borderColor: selectedGenre === genre.id ? genre.color : undefined }}
                >
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: genre.color + '20' }}
                  >
                    <Icon className="w-7 h-7" style={{ color: genre.color }} />
                  </div>
                  <p className="text-white text-xs font-semibold text-center">{genre.name}</p>
                  <p className="text-gray-500 text-[10px] text-center mt-1">{genre.description}</p>
                </button>
              )
            })}
          </div>
        </section>

        {/* Prompt Input */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Describe Your Game</h2>
            <span className="text-gray-500 text-sm">{prompt.length} / 500</span>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the game you want to create..."
            maxLength={500}
            className="w-full h-32 p-4 bg-[#1a1a24] border border-[#2a2a34] rounded-2xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#4ECDC4] transition-colors"
          />
          <p className="text-gray-500 text-sm mt-3 mb-2">Try an example:</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {getExamplePrompts().map((example, index) => (
              <button
                key={index}
                onClick={() => handleExamplePrompt(example)}
                className="flex-shrink-0 px-4 py-2 bg-[#2a2a34] rounded-full text-gray-400 text-sm hover:bg-[#3a3a44] transition-colors"
              >
                {example.substring(0, 35)}...
              </button>
            ))}
          </div>
        </section>

        {/* Character Description */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Character Description</h2>
          <input
            type="text"
            value={characterDescription}
            onChange={(e) => setCharacterDescription(e.target.value)}
            placeholder="Describe your main character..."
            maxLength={200}
            className="w-full p-4 bg-[#1a1a24] border border-[#2a2a34] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#4ECDC4] transition-colors"
          />
        </section>

        {/* Control Scheme */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Control Scheme</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setControlScheme('dpad_buttons')}
              className={`p-4 bg-[#1a1a24] rounded-2xl border-2 transition-all ${
                controlScheme === 'dpad_buttons' ? 'border-[#4ECDC4]' : 'border-[#2a2a34]'
              }`}
            >
              <div className="flex items-center justify-center gap-4 mb-3">
                {/* D-Pad Preview */}
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-gray-600 rounded-sm" />
                  <div className="flex">
                    <div className="w-4 h-4 bg-gray-600 rounded-sm" />
                    <div className="w-4 h-4 bg-gray-700" />
                    <div className="w-4 h-4 bg-gray-600 rounded-sm" />
                  </div>
                  <div className="w-4 h-4 bg-gray-600 rounded-sm" />
                </div>
                {/* Buttons Preview */}
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[8px] text-white font-bold">A</div>
                  <div className="w-5 h-5 rounded-full bg-[#4ECDC4] flex items-center justify-center text-[8px] text-white font-bold">B</div>
                  <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-[8px] text-gray-800 font-bold">C</div>
                  <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center text-[8px] text-gray-800 font-bold">D</div>
                </div>
              </div>
              <p className="text-white font-semibold text-sm">D-Pad + ABCD</p>
              <p className="text-gray-500 text-xs mt-1">Classic controller layout</p>
            </button>

            <button
              onClick={() => setControlScheme('swipe')}
              className={`p-4 bg-[#1a1a24] rounded-2xl border-2 transition-all ${
                controlScheme === 'swipe' ? 'border-[#4ECDC4]' : 'border-[#2a2a34]'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <Gamepad2 className="w-10 h-10 text-[#4ECDC4]" />
                <div className="flex flex-col items-center text-gray-500">
                  <ChevronUp className="w-4 h-4" />
                  <div className="flex">
                    <ChevronLeft className="w-4 h-4" />
                    <ChevronRight className="w-4 h-4" />
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              <p className="text-white font-semibold text-sm">Swipe Controls</p>
              <p className="text-gray-500 text-xs mt-1">Touch-based movement</p>
            </button>
          </div>
        </section>

        {/* Platform Selector */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Target Platform</h2>
          <div className="grid grid-cols-3 gap-3">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setTargetPlatform(platform.id)}
                className={`p-4 bg-[#1a1a24] rounded-xl border-2 transition-all ${
                  targetPlatform === platform.id ? 'border-[#4ECDC4]' : 'border-[#2a2a34]'
                }`}
              >
                <span className="text-2xl mb-2 block">{platform.icon}</span>
                <p className={`text-sm ${targetPlatform === platform.id ? 'text-[#4ECDC4]' : 'text-gray-400'}`}>
                  {platform.name}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-5 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 pulse-glow"
          style={{
            background: 'linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%)',
          }}
        >
          {isGenerating ? (
            <>
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              <span>Generate Game</span>
            </>
          )}
        </button>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mt-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-[#4ECDC4]/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-[#4ECDC4]" />
            </div>
            <p className="text-white font-semibold text-sm">AI-Powered</p>
            <p className="text-gray-500 text-xs mt-1">Neural networks create unique gameplay</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#4ECDC4]/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Play className="w-6 h-6 text-[#4ECDC4]" />
            </div>
            <p className="text-white font-semibold text-sm">Instant Play</p>
            <p className="text-gray-500 text-xs mt-1">Generate and play in seconds</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#4ECDC4]/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Infinity className="w-6 h-6 text-[#4ECDC4]" />
            </div>
            <p className="text-white font-semibold text-sm">Infinite Variety</p>
            <p className="text-gray-500 text-xs mt-1">Every game is one-of-a-kind</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-12">
          © 2025 Planet Q Games • Powered by Planet Q AI
        </p>
      </div>

      {/* Preview Modal */}
      {showPreview && generatedGame && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-end justify-center">
            <div className="w-full max-w-4xl bg-[#0a0a0f] rounded-t-3xl border border-[#2a2a34] animate-slide-up">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-[#2a2a34]">
                <h2 className="text-xl font-bold text-white">
                  {generatedGame.game?.name || 'Generated Game'}
                </h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="w-10 h-10 bg-[#2a2a34] rounded-full flex items-center justify-center hover:bg-[#3a3a44] transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                {/* Playable Preview */}
                <PlayableGamePreview 
                  genre={selectedGenre} 
                  gameData={generatedGame}
                  prompt={prompt}
                  characterDescription={characterDescription}
                />

                {/* Game Details */}
                <div className="bg-[#1a1a24] rounded-2xl p-4 mt-6">
                  <h3 className="text-white font-semibold mb-3">Game Details</h3>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="text-gray-500 w-24">Story:</span>
                      <span className="text-white flex-1">{generatedGame.schema?.story_premise || 'N/A'}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-24">Character:</span>
                      <span className="text-white flex-1">{generatedGame.schema?.main_character?.name || 'N/A'}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-24">Mechanic:</span>
                      <span className="text-white flex-1">{generatedGame.schema?.initial_scene?.mechanic || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Next Scene Ideas */}
                <div className="bg-[#1a1a24] rounded-2xl p-4 mt-4">
                  <h3 className="text-white font-semibold mb-3">Continue Your Story</h3>
                  {generatedGame.next_scene_prompts?.map((scenePrompt: string, index: number) => (
                    <button key={index} className="flex items-start gap-2 w-full text-left py-2 hover:bg-[#2a2a34] rounded-lg px-2 transition-colors">
                      <Plus className="w-4 h-4 text-[#4ECDC4] mt-0.5" />
                      <span className="text-gray-400 text-sm">{scenePrompt}</span>
                    </button>
                  ))}
                </div>

                {/* Export Button */}
                <button className="w-full mt-6 py-4 bg-[#4ECDC4] rounded-xl font-semibold text-white flex items-center justify-center gap-2 hover:bg-[#45B7D1] transition-colors">
                  <Code className="w-5 h-5" />
                  Export {targetPlatform.toUpperCase()} Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  )
}
