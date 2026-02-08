"use client";

import { useState, useEffect, useRef } from 'react';
import { useSpring, animated, useTrail } from 'react-spring';
import StarsWrapper from '@/components/canvas/StarsWrapper';
import { Gamepad2, Sparkles, Wand2, Cpu, Zap, ChevronRight, Loader2, Play, Joystick, Trophy, Target, Swords, Globe, Crosshair, Car } from 'lucide-react';

const PlanetQGamesPage = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGame, setGeneratedGame] = useState(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeShowcase, setActiveShowcase] = useState(0);

  // Game showcase videos
  const gameShowcases = [
    {
      title: '3D Open World',
      description: 'Explore vast landscapes and endless possibilities',
      video: 'https://customer-assets.emergentagent.com/job_voice-chat-link/artifacts/daashrra_652f88f5-1a93-49c6-b083-0f9bbba1b979.mp4',
      icon: Globe,
      gradient: 'from-emerald-500 to-cyan-500',
      bgGlow: 'bg-emerald-500'
    },
    {
      title: 'Shooter Game',
      description: 'Fast-paced action and intense combat',
      video: 'https://customer-assets.emergentagent.com/job_voice-chat-link/artifacts/9oqn4ok2_generated-video-7fe81dd4-1790-48e2-876a-3fc643c25469.mp4',
      icon: Crosshair,
      gradient: 'from-red-500 to-orange-500',
      bgGlow: 'bg-red-500'
    },
    {
      title: 'Racing Game',
      description: 'High-speed thrills and competitive racing',
      video: 'https://customer-assets.emergentagent.com/job_voice-chat-link/artifacts/3362kdch_generated-video-13e65f16-8497-4a44-8177-d5aed415acf1.mp4',
      icon: Car,
      gradient: 'from-blue-500 to-purple-500',
      bgGlow: 'bg-blue-500'
    }
  ];

  // Cycle through features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Animation properties
  const titleProps = useSpring({
    from: { opacity: 0, transform: 'translateY(-30px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { mass: 1, tension: 120, friction: 14 },
    delay: 200,
  });

  const promptBoxProps = useSpring({
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: { mass: 1, tension: 120, friction: 14 },
    delay: 400,
  });

  const showcaseProps = useSpring({
    from: { opacity: 0, y: 30 },
    to: { opacity: 1, y: 0 },
    config: { mass: 1, tension: 120, friction: 14 },
    delay: 600,
  });

  const glowPulse = useSpring({
    from: { opacity: 0.5 },
    to: { opacity: 1 },
    config: { duration: 2000 },
    loop: { reverse: true },
  });

  const features = [
    { icon: Swords, label: 'Action Games', color: 'from-red-500 to-orange-500' },
    { icon: Target, label: 'Puzzle Games', color: 'from-blue-500 to-cyan-500' },
    { icon: Trophy, label: 'Adventure', color: 'from-yellow-500 to-amber-500' },
    { icon: Joystick, label: 'Arcade', color: 'from-purple-500 to-pink-500' },
  ];

  const featureTrail = useTrail(features.length, {
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0 },
    delay: 600,
  });

  const examplePrompts = [
    "A space shooter where you defend Earth from alien waves",
    "A puzzle platformer with gravity-switching mechanics",
    "A retro-style racing game with neon cyberpunk aesthetics",
    "An RPG adventure in a magical underwater kingdom",
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedGame({
        title: "Your Game is Being Crafted",
        description: "AI game generation coming soon! Your imagination will become reality.",
        prompt: prompt
      });
      setIsGenerating(false);
    }, 2000);
  };

  const handleExampleClick = (example) => {
    setPrompt(example);
  };

  // Video card component
  const VideoShowcaseCard = ({ showcase, index, isActive }) => {
    const videoRef = useRef(null);

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }, []);

    return (
      <div
        onClick={() => setActiveShowcase(index)}
        className={`
          relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-500 group
          ${isActive ? 'ring-2 ring-offset-2 ring-offset-gray-900' : 'opacity-70 hover:opacity-100'}
        `}
        style={{
          ringColor: isActive ? showcase.bgGlow.replace('bg-', '') : undefined
        }}
      >
        {/* Glow effect */}
        <div className={`absolute -inset-1 ${showcase.bgGlow} rounded-2xl blur-lg opacity-${isActive ? '40' : '0'} group-hover:opacity-30 transition-opacity`} />

        <div className="relative bg-gray-900/90 rounded-2xl overflow-hidden border border-gray-700/50">
          {/* Video */}
          <div className="aspect-video relative overflow-hidden">
            <video
              ref={videoRef}
              src={showcase.video}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

            {/* Play indicator */}
            <div className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-gradient-to-r ${showcase.gradient} flex items-center justify-center`}>
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${showcase.gradient} flex items-center justify-center`}>
                <showcase.icon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Oxanium, sans-serif' }}>
                {showcase.title}
              </h3>
            </div>
            <p className="text-sm text-gray-400" style={{ fontFamily: 'Oxanium, sans-serif' }}>
              {showcase.description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start p-4 overflow-hidden bg-[#050816]">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <StarsWrapper />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-blue-900/20" />

        {/* Animated grid lines */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'center top',
          }} />
        </div>

        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-60" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-purple-400 rounded-full animate-bounce opacity-40" />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-pink-400 rounded-full animate-pulse opacity-50" />
      </div>

      <div className="relative z-10 w-full max-w-5xl px-4 py-8 sm:py-12">
        {/* Header */}
        <animated.div style={titleProps} className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="relative">
              <Gamepad2 className="w-10 h-10 sm:w-14 sm:h-14 text-cyan-400" />
              <animated.div
                style={glowPulse}
                className="absolute inset-0 bg-cyan-400 blur-xl opacity-50"
              />
            </div>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight"
              style={{
                fontFamily: 'Oxanium, sans-serif',
                background: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #ff00ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 40px rgba(168, 85, 247, 0.5)',
              }}
              data-testid="page-title"
            >
              AI Game Generator
            </h1>
          </div>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto" style={{ fontFamily: 'Oxanium, sans-serif' }}>
            Transform your imagination into playable games with AI
          </p>

          {/* Animated feature badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {featureTrail.map((style, index) => {
              const Feature = features[index];
              const isActive = activeFeature === index;
              return (
                <animated.div
                  key={index}
                  style={style}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500
                    ${isActive
                      ? `bg-gradient-to-r ${Feature.color} border-transparent shadow-lg shadow-purple-500/25`
                      : 'bg-gray-900/50 border-gray-700/50 hover:border-purple-500/50'
                    }
                  `}
                >
                  <Feature.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'Oxanium, sans-serif' }}>
                    {Feature.label}
                  </span>
                </animated.div>
              );
            })}
          </div>
        </animated.div>

        {/* Game Showcase Section */}
        <animated.div style={showcaseProps} className="mb-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Oxanium, sans-serif' }}>
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                What You Can Create
              </span>
            </h2>
            <p className="text-gray-400 text-sm" style={{ fontFamily: 'Oxanium, sans-serif' }}>
              AI-generated game previews • Powered by next-gen technology
            </p>
          </div>

          {/* Video showcase grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {gameShowcases.map((showcase, index) => (
              <VideoShowcaseCard
                key={index}
                showcase={showcase}
                index={index}
                isActive={activeShowcase === index}
              />
            ))}
          </div>
        </animated.div>

        {/* Main Prompt Box */}
        <animated.div style={promptBoxProps} className="relative">
          {/* Outer glow */}
          <animated.div
            style={glowPulse}
            className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-40"
          />

          {/* Main container */}
          <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
            {/* Top bar with icons */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-700/50 bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="hidden sm:flex items-center gap-2 text-gray-400">
                  <Cpu className="w-4 h-4" />
                  <span className="text-sm" style={{ fontFamily: 'Oxanium, sans-serif' }}>AI Game Engine v1.0</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                <span className="text-sm text-purple-400" style={{ fontFamily: 'Oxanium, sans-serif' }} data-testid="powered-by-text">Powered by Planet Q Productions</span>
              </div>
            </div>

            {/* Prompt input area */}
            <div className="p-4 sm:p-6">
              <div className="relative">
                <div className="absolute left-4 top-4 text-purple-400">
                  <Wand2 className="w-5 h-5" />
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your dream game... What's the genre? What makes it unique? What's the goal?"
                  className="w-full h-32 sm:h-40 bg-gray-800/50 border border-gray-700/50 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  style={{ fontFamily: 'Oxanium, sans-serif' }}
                  data-testid="game-prompt-input"
                />

                {/* Character count */}
                <div className="absolute right-4 bottom-4 text-xs text-gray-500" style={{ fontFamily: 'Oxanium, sans-serif' }}>
                  {prompt.length} / 500
                </div>
              </div>

              {/* Example prompts */}
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2" style={{ fontFamily: 'Oxanium, sans-serif' }}>Try an example:</p>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(example)}
                      className="text-xs px-3 py-1.5 bg-gray-800/50 hover:bg-purple-500/20 border border-gray-700/50 hover:border-purple-500/50 rounded-full text-gray-400 hover:text-purple-300 transition-all truncate max-w-[200px]"
                      style={{ fontFamily: 'Oxanium, sans-serif' }}
                      data-testid={`example-prompt-${index}`}
                    >
                      {example.slice(0, 30)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span style={{ fontFamily: 'Oxanium, sans-serif' }}>Instant Generation</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <Play className="w-4 h-4 text-green-400" />
                    <span style={{ fontFamily: 'Oxanium, sans-serif' }}>Play in Browser</span>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className={`
                    group relative flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 overflow-hidden
                    ${prompt.trim() && !isGenerating
                      ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105'
                      : 'bg-gray-700 cursor-not-allowed opacity-50'
                    }
                  `}
                  style={{ fontFamily: 'Oxanium, sans-serif' }}
                  data-testid="generate-game-button"
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />

                  <span className="relative z-10 text-white flex items-center gap-3">
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
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
        </animated.div>

        {/* Generated Game Result */}
        {generatedGame && (
          <animated.div
            style={promptBoxProps}
            className="mt-8 relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-cyan-500 rounded-2xl blur-lg opacity-30" />
            <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Oxanium, sans-serif' }}>
                    {generatedGame.title}
                  </h3>
                  <p className="text-sm text-gray-400" style={{ fontFamily: 'Oxanium, sans-serif' }}>
                    {generatedGame.description}
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <p className="text-sm text-gray-400 mb-2" style={{ fontFamily: 'Oxanium, sans-serif' }}>Your prompt:</p>
                <p className="text-white" style={{ fontFamily: 'Oxanium, sans-serif' }}>{generatedGame.prompt}</p>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 rounded-lg font-bold text-white transition-all"
                  style={{ fontFamily: 'Oxanium, sans-serif' }}
                  data-testid="play-game-button"
                >
                  <Play className="w-4 h-4 inline mr-2" />
                  Coming Soon
                </button>
                <button
                  onClick={() => { setGeneratedGame(null); setPrompt(''); }}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-bold text-gray-300 transition-all"
                  style={{ fontFamily: 'Oxanium, sans-serif' }}
                  data-testid="new-game-button"
                >
                  New Game
                </button>
              </div>
            </div>
          </animated.div>
        )}

        {/* Bottom features grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Cpu, title: 'AI-Powered', desc: 'Advanced neural networks create unique gameplay', color: 'cyan' },
            { icon: Zap, title: 'Instant Play', desc: 'Generate and play games in seconds', color: 'yellow' },
            { icon: Sparkles, title: 'Infinite Variety', desc: 'Every game is one-of-a-kind', color: 'purple' },
          ].map((feature, index) => (
            <animated.div
              key={index}
              style={{
                ...promptBoxProps,
                transitionDelay: `${index * 100 + 600}ms`
              }}
              className="group relative bg-gray-900/50 backdrop-blur-sm p-5 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-lg bg-${feature.color}-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'Oxanium, sans-serif' }}>
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400" style={{ fontFamily: 'Oxanium, sans-serif' }}>
                {feature.desc}
              </p>
            </animated.div>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-12 text-center text-gray-600 text-sm" style={{ fontFamily: 'Oxanium, sans-serif' }}>
          &copy; 2025 Planet Q Games • Powered by AI Imagination
        </p>
      </div>
    </div>
  );
};

export default PlanetQGamesPage;
