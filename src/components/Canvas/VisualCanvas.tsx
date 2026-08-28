import React, { FC, useRef, useState, useEffect } from 'react';
import {
  CanvasImageObject,
  AirCanvasStroke,
  GestureType,
} from '../../types';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  RotateCcw as ResetIcon,
  Undo,
  Redo,
  Sparkles,
  Search,
  Sliders,
  SplitSquareVertical,
  Download,
  Bookmark,
  Sun,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface VisualCanvasProps {
  currentImage: CanvasImageObject;
  airCanvasStrokes: AirCanvasStroke[];
  isAirCanvasActive: boolean;
  activeGesture: GestureType;
  isComparing: boolean;
  compareSplit: number;
  canUndo: boolean;
  canRedo: boolean;
  onZoom: (multiplier: number) => void;
  onRotate: (deg: number) => void;
  onMove: (dx: number, dy: number) => void;
  onAdjustBrightness: (delta: number) => void;
  onApplyFilter: (preset: string) => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleCompare: () => void;
  onSetCompareSplit: (val: number) => void;
  onSaveToGallery: () => void;
  onDownload: () => void;
}

export const VisualCanvas: FC<VisualCanvasProps> = ({
  currentImage,
  airCanvasStrokes,
  isAirCanvasActive,
  activeGesture,
  isComparing,
  compareSplit,
  canUndo,
  canRedo,
  onZoom,
  onRotate,
  onMove,
  onAdjustBrightness,
  onApplyFilter,
  onReset,
  onUndo,
  onRedo,
  onToggleCompare,
  onSetCompareSplit,
  onSaveToGallery,
  onDownload,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const airCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Draw Air Canvas strokes
  useEffect(() => {
    const canvas = airCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    airCanvasStrokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = stroke.color;
      ctx.shadowBlur = 12;

      const first = stroke.points[0];
      ctx.moveTo(first.x * canvas.width, first.y * canvas.height);

      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
      }
      ctx.stroke();
    });
  }, [airCanvasStrokes]);

  // Handle manual mouse drag fallback
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsMouseDown(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    onMove(dx, dy);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  // Wheel zoom fallback
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      onZoom(1.08);
    } else {
      onZoom(0.92);
    }
  };

  const { transforms } = currentImage;
  const filterStyle = `brightness(${transforms.brightness}%) contrast(${transforms.contrast}%) saturate(${transforms.saturation}%) hue-rotate(${transforms.hueRotate}deg) blur(${transforms.blur}px)`;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="relative flex-1 h-full min-h-[380px] bg-white/80 backdrop-blur-md rounded-[36px] lg:rounded-[40px] overflow-hidden border border-white shadow-2xl flex items-center justify-center select-none group"
    >
      {/* Background Subtle Gradient & Grid */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/[0.03] pointer-events-none" />
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Left Attribution / Currently Selected Card */}
      <div className="absolute top-5 left-5 sm:top-6 sm:left-6 z-20 flex flex-col gap-2 max-w-xs sm:max-w-sm pointer-events-auto">
        <div className="bg-white/90 backdrop-blur border border-slate-100/90 rounded-2xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Currently Selected</span>
            {currentImage.sourceType === 'AI_GENERATED' ? (
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold uppercase">
                AI Gen
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-[10px] font-bold uppercase">
                Search
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">{currentImage.title}</h2>
          {currentImage.attribution && (
            <p className="text-slate-400 text-[11px] truncate mt-0.5">{currentImage.attribution}</p>
          )}
          {currentImage.prompt && (
            <p className="text-slate-400 text-[11px] italic truncate mt-0.5">&quot;{currentImage.prompt}&quot;</p>
          )}
        </div>
      </div>

      {/* Top Right Quick Transform Metrics & Undo */}
      <div className="absolute top-5 right-5 sm:top-6 sm:right-6 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur border border-slate-100/90 p-2 sm:p-2.5 rounded-2xl shadow-sm text-xs text-slate-700">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded-xl transition-all ${
            canUndo ? 'hover:bg-slate-100 text-slate-700 active:scale-95' : 'text-slate-300 cursor-not-allowed'
          }`}
          title="Undo transformation"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded-xl transition-all ${
            canRedo ? 'hover:bg-slate-100 text-slate-700 active:scale-95' : 'text-slate-300 cursor-not-allowed'
          }`}
          title="Redo transformation"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        <button
          onClick={onSaveToGallery}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
          title="Save to Gallery"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>

        <button
          onClick={onDownload}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all"
          title="Download full resolution"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Main Image Stage Frame */}
      <div
        className="relative w-full h-full flex items-center justify-center p-8 sm:p-12 transition-transform duration-75 ease-out"
        style={{
          transform: `translate3d(${transforms.x}px, ${transforms.y}px, 0px) scale(${transforms.scale}) rotate(${transforms.rotation}deg)`,
          transformOrigin: 'center center',
        }}
      >
        <div className="relative max-w-full max-h-[74vh] rounded-3xl shadow-2xl border-8 border-white/60 overflow-hidden bg-slate-100">
          {/* Subtle Cyber Focus Border */}
          <div className="absolute inset-0 border-[3px] border-cyan-400/30 rounded-2xl pointer-events-none z-10" />

          {/* Top Right Badges */}
          <div className="absolute top-4 right-4 flex space-x-2 z-20">
            <span className="px-3 py-1 bg-cyan-500 text-white text-[10px] font-bold rounded-full uppercase shadow-xs">
              Hand Guided
            </span>
            <span className="px-3 py-1 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold rounded-full uppercase shadow-xs">
              {currentImage.sourceType === 'AI_GENERATED' ? 'AI Render' : 'Photo'}
            </span>
          </div>

          {isComparing && currentImage.originalUrl ? (
            // Before / After Split Comparison Mode
            <div className="relative max-w-full max-h-[70vh] overflow-hidden">
              {/* Modified Image (Full) */}
              <img
                src={currentImage.url}
                alt={currentImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[66vh] w-auto object-contain select-none pointer-events-none"
                style={{ filter: filterStyle }}
              />

              {/* Original Image (Clipped Left) */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white shadow-xl"
                style={{ width: `${compareSplit}%` }}
              >
                <img
                  src={currentImage.originalUrl}
                  alt="Original"
                  referrerPolicy="no-referrer"
                  className="max-h-[66vh] w-auto max-w-none object-contain select-none pointer-events-none"
                />
                <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-bold tracking-wider uppercase">
                  Original
                </span>
              </div>

              <span className="absolute bottom-3 right-3 bg-cyan-600/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-bold tracking-wider uppercase">
                Enhanced
              </span>
            </div>
          ) : (
            // Standard Single View Stage
            <div className="relative max-w-full max-h-[70vh] flex items-center justify-center">
              <img
                src={currentImage.url}
                alt={currentImage.title}
                referrerPolicy="no-referrer"
                className={`max-h-[66vh] w-auto object-contain transition-all duration-150 ${
                  activeGesture === 'PINCH' || activeGesture === 'PINCH_MOVE'
                    ? 'ring-4 ring-rose-500'
                    : activeGesture === 'OPEN_PALM'
                    ? 'ring-4 ring-cyan-400'
                    : ''
                }`}
                style={{ filter: filterStyle }}
              />

              {/* Gesture Selection Indicator Ring */}
              {(activeGesture === 'PINCH' || activeGesture === 'PINCH_MOVE') && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                  <span className="bg-rose-500/90 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg animate-pulse flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Object Grabbed (Move Hand to Control)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Air Canvas Drawing Layer Overlay */}
      {isAirCanvasActive && (
        <canvas
          ref={airCanvasRef}
          width={1280}
          height={720}
          className="absolute inset-0 w-full h-full pointer-events-none z-15"
        />
      )}

      {/* Floating Bottom Left Telemetry & Controls Bar */}
      <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6 z-20 flex flex-wrap items-end justify-between gap-3 pointer-events-auto">
        {/* Real-time Telemetry Metrics Pill */}
        <div className="bg-black/5 backdrop-blur-md rounded-2xl p-3 sm:p-4 flex items-center space-x-6 sm:space-x-8 border border-white/60 shadow-xs">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Scale</p>
            <p className="text-lg sm:text-xl font-mono font-bold text-slate-700">{transforms.scale.toFixed(1)}x</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Rotate</p>
            <p className="text-lg sm:text-xl font-mono font-bold text-slate-700">{Math.round(transforms.rotation)}°</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Brightness</p>
            <p className="text-lg sm:text-xl font-mono font-bold text-slate-700">{transforms.brightness}%</p>
          </div>
        </div>

        {/* Floating Quick Action Circles & Filters */}
        <div className="flex items-center gap-2">
          {/* Preset Filters Dropdown/Pills */}
          <div className="hidden md:flex items-center gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/80 shadow-md">
            {['none', 'cinematic', 'cyberpunk', 'warm'].map((preset) => (
              <button
                key={preset}
                onClick={() => onApplyFilter(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  transforms.filterPreset === preset
                    ? 'bg-cyan-500 text-white shadow-xs'
                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                {preset === 'none' ? 'Normal' : preset}
              </button>
            ))}
          </div>

          {/* Reset Transform Button */}
          <button
            onClick={onReset}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white shadow-lg hover:bg-slate-50 flex items-center justify-center text-lg text-slate-700 border border-slate-100 transition-all active:scale-95"
            title="Reset transformations & filters"
          >
            <ResetIcon className="w-5 h-5" />
          </button>

          {/* Split Compare Button */}
          <button
            onClick={onToggleCompare}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center text-lg border transition-all active:scale-95 ${
              isComparing
                ? 'bg-purple-600 text-white border-purple-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-100'
            }`}
            title="Compare with original"
          >
            <SplitSquareVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
