import { FC } from 'react';
import {
  Sparkles,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Layers,
  Settings,
  Maximize2,
  Minimize2,
  PlayCircle,
  Pencil,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  isCameraActive: boolean;
  isMicActive: boolean;
  isAirCanvasActive: boolean;
  isFullscreen: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleAirCanvas: () => void;
  onToggleFullscreen: () => void;
  onOpenGallery: () => void;
  onOpenSettings: () => void;
  onStartDemo: () => void;
  galleryCount: number;
}

export const Navbar: FC<NavbarProps> = ({
  isCameraActive,
  isMicActive,
  isAirCanvasActive,
  isFullscreen,
  onToggleCamera,
  onToggleMic,
  onToggleAirCanvas,
  onToggleFullscreen,
  onOpenGallery,
  onOpenSettings,
  onStartDemo,
  galleryCount,
}) => {
  return (
    <header className="w-full bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl px-6 lg:px-8 py-3.5 shadow-xs flex items-center justify-between z-30 shrink-0">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 bg-gradient-to-tr from-cyan-400 to-purple-500 rounded-xl shadow-lg shadow-cyan-200/50 flex items-center justify-center text-white">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              VisionFlow <span className="text-cyan-600 font-extrabold">AI</span>
            </h1>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/70">
              Studio
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold hidden sm:block">
            Creative Multimodal Assistant
          </p>
        </div>
      </div>

      {/* Center Live Privacy Status Indicators */}
      <div className="hidden md:flex items-center gap-5 bg-white/50 px-4 py-1.5 rounded-full border border-white/80 shadow-2xs">
        <button
          onClick={onToggleCamera}
          className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          title={isCameraActive ? 'Camera tracking active (processed locally)' : 'Start camera for gesture tracking'}
        >
          <div className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="uppercase text-[11px] font-semibold text-slate-500 tracking-wider">
            {isCameraActive ? 'Camera Active' : 'Camera Off'}
          </span>
        </button>

        <div className="h-3.5 w-px bg-slate-200" />

        <button
          onClick={onToggleMic}
          className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          title={isMicActive ? 'Voice Assistant listening' : 'Start voice recognition'}
        >
          <div className={`w-2 h-2 rounded-full ${isMicActive ? 'bg-pink-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="uppercase text-[11px] font-semibold text-slate-500 tracking-wider">
            {isMicActive ? 'Mic Listening' : 'Mic Muted'}
          </span>
        </button>

        <div className="h-3.5 w-px bg-slate-200" />

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Local Privacy</span>
        </div>
      </div>

      {/* Right Control Actions */}
      <div className="flex items-center gap-2">
        {/* Guided Demo Tour */}
        <button
          onClick={onStartDemo}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
        >
          <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Pro Tour</span>
        </button>

        {/* Air Canvas Toggle */}
        <button
          onClick={onToggleAirCanvas}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${
            isAirCanvasActive
              ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
              : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200/80 shadow-2xs'
          }`}
          title="Air Canvas - Draw in the air with index finger"
        >
          <Pencil className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden md:inline">Air Draw</span>
        </button>

        {/* Gallery */}
        <button
          onClick={onOpenGallery}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 text-xs font-semibold shadow-2xs transition-all relative"
          title="Visual Gallery"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-600" />
          <span className="hidden sm:inline">Gallery</span>
          {galleryCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-cyan-100 text-cyan-700 border border-cyan-200">
              {galleryCount}
            </span>
          )}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs transition-all"
          title="Settings & Gesture Mappings"
        >
          <Settings className="w-4 h-4 text-slate-600" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-full bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs transition-all hidden sm:flex items-center justify-center"
          title={isFullscreen ? 'Exit Fullscreen' : 'Presentation Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-slate-600" /> : <Maximize2 className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
};
