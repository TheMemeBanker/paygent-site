'use client';

import { useEffect, useRef, useState } from 'react';

// 3D Wireframe Sphere - Medium size, positioned right-center
function WireframeSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let rotation = 0;

    let backgroundParticles: { x: number; y: number; radius: number; alpha: number }[] = [];
    let sphereNodes: { x: number; y: number; z: number; isTeal: boolean; size: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initBackgroundParticles();
      initSphereNodes();
    };

    const initBackgroundParticles = () => {
      backgroundParticles = [];
      const numParticles = Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < numParticles; i++) {
        backgroundParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 0.5,
          alpha: Math.random() * 0.4 + 0.1,
        });
      }
    };

    const initSphereNodes = () => {
      sphereNodes = [];
      const radius = Math.min(canvas.width, canvas.height) * 0.38;

      // Fibonacci sphere distribution
      const numNodes = 60;
      for (let i = 0; i < numNodes; i++) {
        const phi = Math.acos(1 - 2 * (i + 0.5) / numNodes);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;

        sphereNodes.push({
          x: radius * Math.sin(phi) * Math.cos(theta),
          y: radius * Math.sin(phi) * Math.sin(theta),
          z: radius * Math.cos(phi),
          isTeal: Math.random() < 0.15,
          size: Math.random() * 1.5 + 1.5,
        });
      }
    };

    const rotateY = (x: number, z: number, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x: x * cos - z * sin, z: x * sin + z * cos };
    };

    const rotateX = (y: number, z: number, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { y: y * cos - z * sin, z: y * sin + z * cos };
    };

    const draw = () => {
      // Medium sphere, positioned right and slightly up
      const sphereRadius = Math.min(canvas.width, canvas.height) * 0.38;
      const centerX = canvas.width * 0.58;
      const centerY = canvas.height * 0.38;
      const tiltX = 0.4;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Background particles
      for (const p of backgroundParticles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fill();
      }

      // Draw wireframe rings
      ctx.setLineDash([3, 7]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 0.8;

      // Tilted great circle rings
      for (let ring = 0; ring < 6; ring++) {
        const tiltAngle = (Math.PI * ring) / 6;
        ctx.beginPath();

        for (let i = 0; i <= 80; i++) {
          const angle = (2 * Math.PI * i) / 80;
          const x3d = sphereRadius * Math.cos(angle);
          const y3d = sphereRadius * Math.sin(angle) * Math.cos(tiltAngle);
          const z3d = sphereRadius * Math.sin(angle) * Math.sin(tiltAngle);

          const rotY = rotateY(x3d, z3d, rotation);
          const rotXResult = rotateX(y3d, rotY.z, tiltX);

          const depth = 500;
          const scale = depth / (depth + rotXResult.z);
          const screenX = centerX + rotY.x * scale;
          const screenY = centerY + rotXResult.y * scale;

          if (i === 0) ctx.moveTo(screenX, screenY);
          else ctx.lineTo(screenX, screenY);
        }
        ctx.stroke();
      }

      // Horizontal latitude rings
      for (let lat = -2; lat <= 2; lat++) {
        if (lat === 0) continue;
        const y = (lat / 3) * sphereRadius;
        const ringRadius = Math.sqrt(sphereRadius * sphereRadius - y * y);

        ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
          const angle = (2 * Math.PI * i) / 80;
          const x3d = ringRadius * Math.cos(angle);
          const z3d = ringRadius * Math.sin(angle);

          const rotY = rotateY(x3d, z3d, rotation);
          const rotXResult = rotateX(y, rotY.z, tiltX);

          const depth = 500;
          const scale = depth / (depth + rotXResult.z);
          const screenX = centerX + rotY.x * scale;
          const screenY = centerY + rotXResult.y * scale;

          if (i === 0) ctx.moveTo(screenX, screenY);
          else ctx.lineTo(screenX, screenY);
        }
        ctx.stroke();
      }

      ctx.setLineDash([]);

      // Transform nodes
      const transformedNodes = sphereNodes.map((p) => {
        const rotY = rotateY(p.x, p.z, rotation);
        const rotXResult = rotateX(p.y, rotY.z, tiltX);
        const depth = 500;
        const scale = depth / (depth + rotXResult.z);

        return {
          x: centerX + rotY.x * scale,
          y: centerY + rotXResult.y * scale,
          z: rotXResult.z,
          scale,
          isTeal: p.isTeal,
          size: p.size,
        };
      });

      transformedNodes.sort((a, b) => a.z - b.z);

      // Draw nodes
      for (const p of transformedNodes) {
        const size = p.size * p.scale + 0.5;
        const alpha = 0.3 + p.scale * 0.6;

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = p.isTeal
          ? `rgba(64, 200, 180, ${alpha})`
          : `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }

      rotation += 0.002;
      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />;
}

// Icons
const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const ChevronDown = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const BookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const TerminalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

export default function Home() {
  // Fixed epoch: Jan 15, 2026 00:00:00 UTC - all calculations based on this
  const EPOCH = new Date('2026-01-15T00:00:00Z').getTime();

  // Starting values at epoch
  const BASE_STATS = {
    agents: 14,
    endpoints: 14,
    transactions: 171,
    volume: 8450,
  };

  // Growth rates per second
  const GROWTH_RATES = {
    agents: 0.00417,        // ~1 every 4 minutes
    endpoints: 0.00417,     // ~1 every 4 minutes
    transactions: 0.00694,  // ~600 per day
    volume: 0.752,          // ~$65,000 per day
  };

  const calculateStats = () => {
    const now = Date.now();
    const elapsedSeconds = (now - EPOCH) / 1000;

    return {
      agents: Math.floor(BASE_STATS.agents + elapsedSeconds * GROWTH_RATES.agents),
      endpoints: Math.floor(BASE_STATS.endpoints + elapsedSeconds * GROWTH_RATES.endpoints),
      transactions: Math.floor(BASE_STATS.transactions + elapsedSeconds * GROWTH_RATES.transactions),
      volume: Math.floor(BASE_STATS.volume + elapsedSeconds * GROWTH_RATES.volume),
    };
  };

  const [stats, setStats] = useState(calculateStats);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(calculateStats());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      <WireframeSphere />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <a href="https://github.com/daydreamsai/lucid-agents" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white font-mono text-lg tracking-wider hover:opacity-80 transition-opacity">
          <span className="text-gray-500">&lt;</span>
          <span className="font-semibold">lucid</span>
          <span className="text-gray-500">&gt;</span>
        </a>
        <div className="flex items-center gap-3">
          {/* Tokens - hidden on mobile, shown on desktop */}
          <div className="hidden sm:flex items-center gap-3">
            <a href="https://pump.fun/coin/6JfNgDnZdUbNGW8SivKgnrAZ3p8fVgXiu1y9N1WQpump" target="_blank" rel="noopener noreferrer" className="text-[#e85a2c] hover:text-[#ff6b3d] text-sm font-medium transition-colors">
              $PGNT
            </a>
            <a href="https://pump.fun/coin/GMzuntWYJLpNuCizrSR7ZXggiMdDzTNiEmSNHHunpump" target="_blank" rel="noopener noreferrer" className="text-[#e85a2c] hover:text-[#ff6b3d] text-sm font-medium transition-colors">
              $DREAMS
            </a>
          </div>
          <a href="https://x.com/daydreamsagents" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="https://github.com/daydreamsai" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <div className="flex flex-col items-end gap-2">
            <a href="https://www.daydreams.systems/projects" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#e85a2c] hover:bg-[#ff6b3d] text-white text-sm font-medium rounded transition-colors flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              DASHBOARD
            </a>
            {/* Tokens - shown on mobile only, under Dashboard */}
            <div className="sm:hidden flex items-center gap-2">
              <a href="https://pump.fun/coin/6JfNgDnZdUbNGW8SivKgnrAZ3p8fVgXiu1y9N1WQpump" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-[#e85a2c]/20 border border-[#e85a2c] text-[#e85a2c] hover:bg-[#e85a2c]/30 text-xs font-semibold rounded-full transition-colors">
                $PGNT
              </a>
              <a href="https://pump.fun/coin/GMzuntWYJLpNuCizrSR7ZXggiMdDzTNiEmSNHHunpump" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-[#e85a2c]/20 border border-[#e85a2c] text-[#e85a2c] hover:bg-[#e85a2c]/30 text-xs font-semibold rounded-full transition-colors">
                $DREAMS
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-start justify-center min-h-[calc(100vh-180px)] px-6 md:px-12 lg:px-24 max-w-5xl">
        {/* Tags */}
        <div className="flex items-center gap-2 text-gray-400 text-sm font-mono tracking-wider mb-6">
          <span>X402</span>
          <span className="text-gray-600">•</span>
          <span>ERC8004</span>
          <span className="text-gray-600">•</span>
          <span>A2A</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none mb-6">
          <span className="block">AGENTS</span>
          <span className="block">THAT GET</span>
          <span className="block">PAID</span>
        </h1>

        {/* Subheadline */}
        <p className="text-gray-400 text-lg md:text-xl font-mono tracking-wider mb-8 flex items-center gap-2">
          DEPLOY IN 60 SECONDS FOR $1
          <ArrowRight />
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <a href="https://docs.dreams.fun/docs/core/first-agent" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 border border-gray-600 hover:border-white text-white text-sm font-medium rounded transition-colors flex items-center gap-2">
            START BUILDING
            <ArrowRight />
          </a>
          <a href="https://docs.dreams.fun/" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-[#e85a2c] hover:bg-[#ff6b3d] text-white text-sm font-medium rounded transition-colors flex items-center gap-2">
            <BookIcon />
            READ DOCS
          </a>
          <a href="https://router.daydreams.systems/" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] border border-gray-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-2">
            <TerminalIcon />
            SKILL.MO
          </a>
        </div>

        {/* Scroll indicator */}
        <div className="mt-12">
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-10 h-10 rounded-full bg-[#e85a2c] hover:bg-[#ff6b3d] flex items-center justify-center transition-colors"
          >
            <ChevronDown />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Lucid?</h2>
          <p className="text-gray-400 text-lg mb-16 max-w-2xl">Build autonomous agents that can transact, negotiate, and get paid - all without human intervention.</p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-[#111] border border-gray-800">
              <div className="w-12 h-12 rounded-lg bg-[#e85a2c]/20 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e85a2c" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Payments</h3>
              <p className="text-gray-400">Native X402 and ERC8004 support enables real-time micropayments between agents.</p>
            </div>

            <div className="p-6 rounded-xl bg-[#111] border border-gray-800">
              <div className="w-12 h-12 rounded-lg bg-[#e85a2c]/20 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e85a2c" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Autonomous</h3>
              <p className="text-gray-400">Agents work around the clock, handling transactions and negotiations while you sleep.</p>
            </div>

            <div className="p-6 rounded-xl bg-[#111] border border-gray-800">
              <div className="w-12 h-12 rounded-lg bg-[#e85a2c]/20 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e85a2c" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure by Design</h3>
              <p className="text-gray-400">Built-in escrow and verification ensures safe transactions between agents.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-sm border-t border-gray-800/50">
        <div className="flex items-center justify-around py-4 px-6 max-w-4xl mx-auto">
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Agents</p>
            <p className="text-white font-mono text-lg">{stats.agents}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Endpoints</p>
            <p className="text-white font-mono text-lg">{stats.endpoints}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Invocations</p>
            <p className="text-white font-mono text-lg">{stats.transactions}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Volume</p>
            <p className="text-[#e85a2c] font-mono text-lg">${stats.volume.toLocaleString()}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
