import { useEffect, useRef, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Create and play audio - handle space in filename
    const audio = new Audio("/thanvish audio.mp3");
    audioRef.current = audio;
    
    // Set audio properties for background music
    audio.loop = true; // Loop the music continuously
    audio.volume = 0.7; // Background music volume
    audio.preload = "auto";
    
    // Only start audio on first user interaction (click, touch, or keypress)
    const startAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    };
    document.addEventListener("click", startAudio, { once: true });
    document.addEventListener("touchstart", startAudio, { once: true });
    document.addEventListener("keydown", startAudio, { once: true });

    // Cleanup on unmount
    return () => {
      // Remove any pending event listeners
      document.removeEventListener("click", startAudio);
      document.removeEventListener("touchstart", startAudio);
      document.removeEventListener("keydown", startAudio);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleInteraction = () => {
    setIsVisible(false);
    
    // Smoothly fade out audio
    if (audioRef.current) {
      const fadeOut = setInterval(() => {
        if (audioRef.current && audioRef.current.volume > 0.05) {
          audioRef.current.volume -= 0.05;
        } else {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.volume = 0.7; // Reset volume for next time
          }
          clearInterval(fadeOut);
        }
      }, 30); // Fade out over ~420ms
    }
    
    // Complete transition after fade
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      onComplete();
    }, 500); // Match transition duration + fade time
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleInteraction}
      onTouchEnd={(e) => {
        e.preventDefault();
        handleInteraction();
      }}
      onMouseMove={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 6; // -3deg..3deg
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * -6; // -3deg..3deg
        setTilt({ x, y });
      }}
      style={{
        backgroundImage: "url('/thanvish.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        cursor: "pointer",
        touchAction: "manipulation",
      }}
    >
      {/* Local component styles for subtle animations */}
      <style>{`
        @keyframes twinkle { 0%, 100% { opacity: .2; transform: scale(.9); } 50% { opacity: .7; transform: scale(1); } }
        @keyframes shimmer { 0% { transform: translateX(-150%); } 100% { transform: translateX(150%); } }
        @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Premium vignette and subtle color tint */}
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
      {/* Fine film-grain for luxe texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\" viewBox=\"0 0 64 64\"><filter id=\"n\"><feTurbulence baseFrequency=\"0.8\" numOctaves=\"2\" stitchTiles=\"stitch\"/></filter><rect width=\"64\" height=\"64\" filter=\"url(%23n)\" opacity=\"0.4\"/></svg>')",
          backgroundSize: "180px 180px",
        }}
      />

      {/* Ambient gold glows */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-yellow-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-yellow-700/20 blur-3xl" />

      {/* Twinkling stars layer */}
      <svg className="pointer-events-none absolute inset-0 opacity-40" width="100%" height="100%">
        <g fill="url(#gold)" style={{ animation: "twinkle 3s ease-in-out infinite" }}>
          <circle cx="12%" cy="18%" r="1.2" />
          <circle cx="78%" cy="26%" r="1.1" style={{ animationDelay: "600ms" }} />
          <circle cx="30%" cy="70%" r="1.4" style={{ animationDelay: "1200ms" }} />
          <circle cx="88%" cy="82%" r="1.1" style={{ animationDelay: "900ms" }} />
          <circle cx="58%" cy="56%" r="1.3" style={{ animationDelay: "300ms" }} />
        </g>
        <defs>
          <radialGradient id="gold" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde68a"/>
            <stop offset="60%" stopColor="#f59e0b"/>
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/>
          </radialGradient>
        </defs>
      </svg>

      {/* Centered glass card with golden accent */}
      <div className="relative z-10 mx-6 w-full max-w-md" style={{ transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
        <div className="rounded-3xl backdrop-blur-md bg-white/5 ring-1 ring-white/10 shadow-2xl overflow-hidden relative">
          {/* Top glow */}
          <div className="pointer-events-none absolute -inset-1 rounded-[28px] bg-gradient-to-br from-yellow-200/20 via-yellow-400/10 to-transparent blur-2xl" />
          {/* Ornate corner accents */}
          <div className="pointer-events-none absolute top-0 left-0 h-10 w-10 border-t border-l border-yellow-300/40 rounded-tl-3xl" />
          <div className="pointer-events-none absolute top-0 right-0 h-10 w-10 border-t border-r border-yellow-300/40 rounded-tr-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-10 w-10 border-b border-l border-yellow-300/30 rounded-bl-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-10 w-10 border-b border-r border-yellow-300/30 rounded-br-3xl" />

          {/* Content */}
          <div className="relative px-8 py-10 flex flex-col items-center text-center gap-6">
            {/* Logo badge */}
            <div className="relative">
              {/* Rotating conic halo */}
              <div
                className="absolute inset-[-14px] rounded-full"
                style={{
                  background:
                    "conic-gradient(from 0deg, rgba(250,204,21,0.0) 0deg, rgba(250,204,21,0.85) 90deg, rgba(250,204,21,0.0) 180deg, rgba(250,204,21,0.6) 270deg, rgba(250,204,21,0.0) 360deg)",
                  animation: "spinSlow 12s linear infinite",
                  WebkitMask:
                    "radial-gradient(farthest-side, transparent calc(100% - 16px), black calc(100% - 15px))",
                  mask: "radial-gradient(farthest-side, transparent calc(100% - 16px), black calc(100% - 15px))",
                  filter: "blur(1px)",
                  opacity: 0.9,
                }}
              />
              {/* Thin rotating outer ring */}
              <div className="absolute inset-[-10px] rounded-full border border-yellow-300/40" style={{ animation: "spinSlow 10s linear infinite" }} />
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-[0_0_40px_rgba(250,204,21,0.35)] p-[2px]">
                <div className="h-full w-full rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                  <img src="/thanvish.jpg" alt="Thanvish" className="h-full w-full object-cover opacity-90" />
                </div>
              </div>
              {/* Soft halo */}
              <div className="absolute inset-0 -z-10 rounded-full bg-yellow-400/20 blur-2xl" />
            </div>

            {/* Brand text */}
            <div className="w-full space-y-3">
              <div className="text-2xl md:text-3xl font-semibold tracking-[0.25em]" style={{ fontFamily: "Lora, serif" }}>
                <span className="bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-500 bg-clip-text text-transparent drop-shadow">THANVISH</span>
              </div>
              {/* Premium divider */}
              <div className="mx-auto h-px w-4/5 bg-gradient-to-r from-transparent via-yellow-400/70 to-transparent" />
              <div className="text-xs md:text-sm uppercase tracking-[0.55em] text-yellow-200/80">Music</div>
            </div>

            {/* Enter button */}
            <button
              aria-label="Enter"
              onClick={handleInteraction}
              className="relative mt-2 inline-flex items-center justify-center rounded-full px-7 py-2.5 text-sm md:text-base font-medium text-black
                         bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 shadow-[0_10px_30px_-10px_rgba(250,204,21,0.8)]
                         transition-all duration-200 hover:shadow-[0_18px_40px_-12px_rgba(250,204,21,0.95)] hover:-translate-y-0.5 active:translate-y-0"
            >
              Tap to enter
              {/* Shimmer */}
              <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                <span className="absolute top-0 left-0 h-full w-1/3 -skew-x-12 bg-white/40" style={{ animation: "shimmer 2.2s ease-in-out infinite" }} />
              </span>
            </button>

            {/* Hint */}
            <p className="text-xs text-white/60">Tap anywhere to continue</p>
          </div>
        </div>
      </div>
    </div>
  );
}

