import React, { FC, useState, RefObject } from 'react';
import {
  GestureDetectionResult,
  GestureType,
} from '../../types';
import {
  Camera,
  CameraOff,
  Eye,
  Scan,
  Sparkles,
  Hand,
  Activity,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isCameraActive: boolean;
  isModelLoading: boolean;
  modelError: string | null;
  fps: number;
  primaryHand: GestureDetectionResult | null;
  activeGesture: GestureType;
  onToggleCamera: () => void;
  onAnalyzeVision: () => void;
  onSimulateGesture: (gesture: GestureType) => void;
  isVisionAnalyzing: boolean;
}

export const CameraPreview: FC<CameraPreviewProps> = ({
  videoRef,
  canvasRef,
  isCameraActive,
  isModelLoading,
  modelError,
  fps,
  primaryHand,
  activeGesture,
  onToggleCamera,
  onAnalyzeVision,
  onSimulateGesture,
  isVisionAnalyzing,
}) => {
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  // Map gesture type to human readable action
  const getGestureActionDesc = (gesture: GestureType): { label: string; action: string; color: string } => {
    switch (gesture) {
      case 'PINCH':
        return { label: 'Pinch', action: 'Grab / Select Object', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      case 'PINCH_MOVE':
        return { label: 'Pinch + Move', action: 'Moving Canvas Object', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      case 'OPEN_PALM':
        return { label: 'Open Palm', action: 'Activate Visual Canvas', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
      case 'FIST':
        return { label: 'Fist', action: 'Pause Interaction', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'TWO_FINGER_PINCH':
        return { label: 'Two-Finger Pinch', action: 'Resize Object', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      case 'POINTING':
        return { label: 'Pointing (Index)', action: 'Air Canvas Draw Mode', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'SWIPE_LEFT':
        return { label: 'Swipe Left', action: 'Previous Image', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
      case 'SWIPE_RIGHT':
        return { label: 'Swipe Right', action: 'Next Image', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
      case 'SWIPE_UP':
        return { label: 'Swipe Up', action: 'Generate Variation', color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' };
      case 'SWIPE_DOWN':
        return { label: 'Swipe Down', action: 'Save Image', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' };
      case 'TWO_HAND_ZOOM':
        return { label: 'Two-Hand Zoom', action: 'Zoom Canvas', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
      case 'THUMBS_UP':
        return { label: 'Thumbs Up', action: 'Save to Gallery', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      default:
        return { label: 'Tracking...', action: 'Show hand inside camera frame', color: 'text-slate-400 bg-slate-800 border-slate-700' };
    }
  };

  const currentAction = getGestureActionDesc(activeGesture);

  return (
    <div className="w-full lg:w-96 flex flex-col space-y-4 min-h-0 shrink-0 select-none">
      {/* 1. Upper Live Tracking Video Viewfinder */}
      <div className="h-1/2 min-h-[220px] bg-slate-900 rounded-[36px] lg:rounded-[40px] shadow-2xl relative overflow-hidden group border-4 border-white">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-600 via-slate-900 to-slate-950 pointer-events-none" />

        {/* Real Live Video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover scale-x-[-1] ${!isCameraActive ? 'hidden' : ''}`}
        />

        {/* MediaPipe Skeleton Overlay */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none ${!showOverlay || !isCameraActive ? 'hidden' : ''}`}
        />

        {/* Top Badges: Live View & AI Vision */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <div className="bg-red-500 text-white text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase shadow-sm">
            Live View
          </div>
          {isCameraActive && (
            <span className="bg-black/50 backdrop-blur text-white text-[9px] px-2 py-0.5 rounded-full font-mono">
              {fps > 0 ? `${fps} FPS` : 'Tracking'}
            </span>
          )}
        </div>

        {isCameraActive && (
          <button
            onClick={onAnalyzeVision}
            disabled={isVisionAnalyzing}
            className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white text-[10px] font-semibold backdrop-blur-md border border-indigo-400/40 shadow-lg active:scale-95 transition-all"
            title="Send snapshot to Gemini AI Vision"
          >
            {isVisionAnalyzing ? <Activity className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
            <span>{isVisionAnalyzing ? 'Analyzing...' : 'AI Vision'}</span>
          </button>
        )}

        {/* Bottom Right Confidence */}
        <div className="absolute bottom-4 right-4 z-20 text-white/70 font-mono text-[10px] bg-slate-950/70 backdrop-blur px-2.5 py-0.5 rounded-full border border-white/10">
          {primaryHand ? `${Math.round(primaryHand.confidence * 100)}% Confidence` : '94% Confidence'}
        </div>

        {/* Camera Off Placeholder */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-900/90">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white mb-3 shadow-inner">
              <CameraOff className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Camera Standby</h3>
            <p className="text-xs text-slate-400 max-w-xs mb-4">
              Enable camera to track 21 hand landmarks and spatial gestures in real time.
            </p>
            <button
              onClick={onToggleCamera}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Enable Camera</span>
            </button>
          </div>
        )}

        {/* Model Loading Spinner */}
        {isCameraActive && isModelLoading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-20">
            <Activity className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
            <p className="text-xs font-semibold text-white">Loading MediaPipe Tasks Vision...</p>
            <p className="text-[11px] text-slate-400 mt-1">Initializing 21 hand landmarks</p>
          </div>
        )}
      </div>

      {/* 2. Lower Interaction State & Telemetry Card */}
      <div className="flex-1 bg-white/60 backdrop-blur-xl border border-white rounded-[36px] lg:rounded-[40px] p-5 sm:p-6 shadow-xl flex flex-col justify-between min-h-0 overflow-y-auto">
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Live Interaction
            </h3>
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
            >
              {showOverlay ? 'HUD On' : 'HUD Off'}
            </button>
          </div>

          {/* Active Gesture Card */}
          <div className="bg-white/90 border border-slate-100/90 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-100 to-purple-100 flex items-center justify-center text-slate-800 text-sm shadow-2xs font-bold">
                ✋
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {currentAction.label}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {currentAction.action}
                </p>
              </div>
            </div>

            {activeGesture !== 'NONE' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>

          {/* Hand Geometry Details */}
          {primaryHand ? (
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-600">
              <div className="bg-white/80 p-2 rounded-xl border border-slate-100 text-center shadow-2xs">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Pinch</span>
                <span className="text-cyan-600 font-bold text-xs">{primaryHand.pinchDistance.toFixed(2)}</span>
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-slate-100 text-center shadow-2xs">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Angle</span>
                <span className="text-purple-600 font-bold text-xs">{Math.round(primaryHand.rotationAngle)}°</span>
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-slate-100 text-center shadow-2xs">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Velocity</span>
                <span className="text-emerald-600 font-bold text-xs">
                  {Math.hypot(primaryHand.velocity.vx, primaryHand.velocity.vy).toFixed(1)}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white/50 p-2.5 rounded-xl border border-dashed border-slate-200 text-center text-[11px] text-slate-400">
              Wave hand in front of camera to begin tracking
            </div>
          )}
        </div>

        {/* Quick Simulator Bar */}
        <div className="pt-3 border-t border-slate-200/60 mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Quick Trigger Simulator
            </span>
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700 underline"
            >
              {showSimulator ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {showSimulator && (
            <div className="grid grid-cols-3 gap-1.5 pt-1 animate-fadeIn">
              <button
                onClick={() => onSimulateGesture('PINCH')}
                className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-semibold border border-slate-200 shadow-2xs transition-all active:scale-95"
              >
                Pinch (Grab)
              </button>
              <button
                onClick={() => onSimulateGesture('OPEN_PALM')}
                className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-semibold border border-slate-200 shadow-2xs transition-all active:scale-95"
              >
                Open Palm
              </button>
              <button
                onClick={() => onSimulateGesture('FIST')}
                className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-semibold border border-slate-200 shadow-2xs transition-all active:scale-95"
              >
                Fist (Lock)
              </button>
              <button
                onClick={() => onSimulateGesture('SWIPE_RIGHT')}
                className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-semibold border border-slate-200 shadow-2xs transition-all active:scale-95"
              >
                Swipe Right
              </button>
              <button
                onClick={() => onSimulateGesture('SWIPE_LEFT')}
                className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-semibold border border-slate-200 shadow-2xs transition-all active:scale-95"
              >
                Swipe Left
              </button>
              <button
                onClick={() => onSimulateGesture('POINTING')}
                className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-semibold border border-slate-200 shadow-2xs transition-all active:scale-95"
              >
                Air Draw
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
