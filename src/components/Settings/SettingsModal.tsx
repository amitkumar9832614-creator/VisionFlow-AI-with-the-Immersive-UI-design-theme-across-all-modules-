import React, { FC, useState } from 'react';
import { RecognitionLanguage } from '../../lib/voice/speechRecognizer';
import {
  X,
  Sliders,
  Hand,
  Mic,
  ShieldCheck,
  Cpu,
  Volume2,
  Check,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: RecognitionLanguage;
  onChangeLanguage: (lang: RecognitionLanguage) => void;
  smoothingAlpha: number;
  onChangeSmoothingAlpha: (alpha: number) => void;
  isVoiceMuted: boolean;
  onToggleVoiceMute: () => void;
  hasGeminiKey: boolean;
}

export const SettingsModal: FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  selectedLanguage,
  onChangeLanguage,
  smoothingAlpha,
  onChangeSmoothingAlpha,
  isVoiceMuted,
  onToggleVoiceMute,
  hasGeminiKey,
}) => {
  const [activeTab, setActiveTab] = useState<'gestures' | 'voice' | 'system'>('gestures');

  if (!isOpen) return null;

  const defaultGestureTable = [
    { gesture: 'Open Palm', action: 'Show / Activate Visual Canvas', trigger: '5 extended fingers' },
    { gesture: 'Fist', action: 'Pause Interaction / Lock Frame', trigger: 'All fingers curled inward' },
    { gesture: 'Pinch', action: 'Grab / Select Visual Object', trigger: 'Thumb & Index tips touch (< 3cm)' },
    { gesture: 'Pinch + Move', action: 'Move / Pan Selected Object', trigger: 'Pinch + velocity vector' },
    { gesture: 'Two-Finger Pinch', action: 'Resize & Scale Object', trigger: 'Index & Middle close together' },
    { gesture: 'Pointing (Index)', action: 'Air Canvas Draw Mode', trigger: 'Index finger extended only' },
    { gesture: 'Rotate Wrist', action: 'Rotate Visual Object', trigger: 'Hand angle change around wrist' },
    { gesture: 'Swipe Left', action: 'Previous Image in Gallery', trigger: 'Fast horizontal swipe left' },
    { gesture: 'Swipe Right', action: 'Next Image in Gallery', trigger: 'Fast horizontal swipe right' },
    { gesture: 'Swipe Up', action: 'Generate New AI Variation', trigger: 'Fast vertical swipe up' },
    { gesture: 'Swipe Down', action: 'Save Current Image', trigger: 'Fast vertical swipe down' },
    { gesture: 'Two-Hand Zoom', action: 'Zoom Canvas in / out', trigger: 'Distance between two hands' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-fadeIn select-none">
      <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] w-full max-w-2xl max-h-[85vh] shadow-2xl border border-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white/40">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">VisionFlow Studio Settings</h2>
              <p className="text-xs text-slate-400 font-medium">Configure gesture mappings, tracking physics, and voice assistant</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('gestures')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'gestures'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Gesture Mappings</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'voice'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice & Audio</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'system'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>System & Privacy</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'gestures' && (
            <div className="space-y-4">
              {/* Smoothing & Anti-Jitter Slider */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Hand Movement Smoothing (EMA Alpha)</h4>
                    <p className="text-[11px] text-slate-400">
                      Lower values eliminate camera jitter; higher values increase responsiveness.
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-xl border border-cyan-100">
                    {smoothingAlpha.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.80"
                  step="0.05"
                  value={smoothingAlpha}
                  onChange={(e) => onChangeSmoothingAlpha(parseFloat(e.target.value))}
                  className="w-full accent-cyan-600 cursor-pointer"
                />
              </div>

              {/* Gesture Table */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-2xs bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="p-3">Gesture</th>
                      <th className="p-3">Action Mapped</th>
                      <th className="p-3 hidden sm:table-cell">Trigger Geometry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {defaultGestureTable.map((row, i) => (
                      <tr key={i} className="hover:bg-cyan-50/30 transition-colors">
                        <td className="p-3 font-bold text-slate-800 flex items-center gap-1.5">
                          <Hand className="w-3.5 h-3.5 text-cyan-600" />
                          <span>{row.gesture}</span>
                        </td>
                        <td className="p-3 text-cyan-700 font-semibold">{row.action}</td>
                        <td className="p-3 text-slate-400 text-[11px] hidden sm:table-cell">{row.trigger}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Speech Recognition Language</h4>
                <p className="text-[11px] text-slate-400">
                  Select the primary language for voice interpretation and speech-to-text.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'en-US', label: 'English (US / Global)' },
                    { id: 'hi-IN', label: 'Hindi (हिन्दी)' },
                    { id: 'en-IN', label: 'Hinglish (Hindi + English)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onChangeLanguage(item.id as RecognitionLanguage)}
                      className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                        selectedLanguage === item.id
                          ? 'border-cyan-600 bg-cyan-50/70 text-cyan-900 ring-2 ring-cyan-200'
                          : 'border-slate-100 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">{item.id}</span>
                        {selectedLanguage === item.id && <Check className="w-3.5 h-3.5 text-cyan-600" />}
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Speech Synthesis (Assistant Voice Feedback)</h4>
                  <p className="text-[11px] text-slate-400">
                    Speaks responses aloud when actions and vision analysis complete.
                  </p>
                </div>
                <button
                  onClick={onToggleVoiceMute}
                  className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                    !isVoiceMuted
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {!isVoiceMuted ? 'Voice Enabled' : 'Voice Muted'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100 text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>On-Device Privacy Engine</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  • <strong>Camera Frames:</strong> Hand tracking and landmark detection run 100% locally in your browser via WebAssembly. No continuous video stream is ever transmitted or recorded.
                </p>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  • <strong>Explicit Vision Snapshot:</strong> Single camera frames are only evaluated by Gemini AI when you explicitly click the &quot;AI Vision&quot; button or ask &quot;What am I showing you?&quot;.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Gemini AI Model:</span>
                  <span className="font-mono text-cyan-600 font-bold">gemini-3.7-flash</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Image Generation Engine:</span>
                  <span className="font-mono text-purple-600 font-bold">gemini-3.1-flash-lite-image</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Computer Vision Engine:</span>
                  <span className="font-mono text-emerald-600 font-bold">MediaPipe Tasks Vision 21 Landmarks</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white/40 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
