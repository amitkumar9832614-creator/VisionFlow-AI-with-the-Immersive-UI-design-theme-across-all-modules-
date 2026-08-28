import React, { FC, useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Search,
  Pencil,
  RotateCcw,
  Bookmark,
  Volume2,
  VolumeX,
  Globe,
  Loader2,
  Eye,
} from 'lucide-react';
import { RecognitionLanguage } from '../../lib/voice/speechRecognizer';

interface VoiceControlBarProps {
  isMicActive: boolean;
  soundLevel: number;
  interimTranscript: string;
  isProcessing: boolean;
  isVoiceMuted: boolean;
  selectedLanguage: RecognitionLanguage;
  onToggleMic: () => void;
  onToggleVoiceMute: () => void;
  onChangeLanguage: (lang: RecognitionLanguage) => void;
  onSubmitCommand: (text: string) => void;
  onQuickGenerate: () => void;
  onQuickSearch: () => void;
  onQuickAirCanvas: () => void;
  onQuickVision: () => void;
  onReset: () => void;
  onSave: () => void;
}

export const VoiceControlBar: FC<VoiceControlBarProps> = ({
  isMicActive,
  soundLevel,
  interimTranscript,
  isProcessing,
  isVoiceMuted,
  selectedLanguage,
  onToggleMic,
  onToggleVoiceMute,
  onChangeLanguage,
  onSubmitCommand,
  onQuickGenerate,
  onQuickSearch,
  onQuickAirCanvas,
  onQuickVision,
  onReset,
  onSave,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSubmitCommand(inputText.trim());
    setInputText('');
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-2 flex flex-col gap-2.5 z-20 select-none">
      {/* Real-time Voice / Speech Waveform Overlay Bar */}
      {isMicActive && (
        <div className="bg-cyan-500/10 backdrop-blur-md border border-cyan-400/30 px-5 py-2 rounded-2xl flex items-center justify-between text-xs text-cyan-800 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-cyan-500 rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.max(4, Math.min(24, 6 + soundLevel * 40 * Math.sin(i + 1)))}px`,
                  }}
                />
              ))}
            </div>
            <span className="font-semibold text-slate-800">
              🎙️ {interimTranscript ? `"${interimTranscript}"` : 'Listening for your voice... (Speak naturally in English/Hindi/Hinglish)'}
            </span>
          </div>

          <span className="text-[11px] font-mono text-cyan-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-cyan-200">
            {selectedLanguage === 'en-US' ? 'English (US)' : selectedLanguage === 'hi-IN' ? 'Hindi (हिन्दी)' : 'Hinglish'}
          </span>
        </div>
      )}

      {/* Main Glass Floating Command Bar */}
      <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[32px] lg:rounded-full p-2 sm:p-2.5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        {/* Glowing Gradient Mic Button */}
        <button
          onClick={onToggleMic}
          className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 shadow-lg ${
            isMicActive
              ? 'bg-rose-500 text-white ring-4 ring-rose-300 animate-pulse'
              : 'bg-gradient-to-tr from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-cyan-500/25 active:scale-95'
          }`}
          title={isMicActive ? 'Stop voice listening' : 'Start speaking (Voice assistant)'}
        >
          {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Seamless Text Input Form */}
        <form onSubmit={handleSubmit} className="flex-1 w-full flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Speak or type a command... (e.g. 'Create a blue supercar', 'Make it cyberpunk')"
            disabled={isProcessing}
            className="bg-transparent border-none text-slate-800 placeholder-slate-400 font-medium px-4 py-2 w-full focus:outline-hidden text-xs sm:text-sm"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all shadow-md ${
              inputText.trim() && !isProcessing
                ? 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
            title="Submit command"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>

        {/* Quick Language & Voice Audio Toggle */}
        <div className="flex items-center gap-1.5 shrink-0 px-2">
          <button
            onClick={() => {
              const nextLang: RecognitionLanguage =
                selectedLanguage === 'en-US' ? 'hi-IN' : selectedLanguage === 'hi-IN' ? 'en-IN' : 'en-US';
              onChangeLanguage(nextLang);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
            title="Change voice input language (English / Hindi / Hinglish)"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-600" />
            <span className="text-[11px]">
              {selectedLanguage === 'en-US' ? 'EN' : selectedLanguage === 'hi-IN' ? 'HI' : 'HIN'}
            </span>
          </button>

          <button
            onClick={onToggleVoiceMute}
            className={`p-2 rounded-full text-xs transition-all ${
              isVoiceMuted
                ? 'bg-rose-50 text-rose-600'
                : 'bg-slate-100/90 hover:bg-slate-200 text-slate-700'
            }`}
            title={isVoiceMuted ? 'Unmute Assistant voice feedback' : 'Mute Assistant voice feedback'}
          >
            {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-600" />}
          </button>
        </div>
      </div>

      {/* Quick Intent Suggestion Action Pills */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button
          onClick={onQuickGenerate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/70 hover:bg-white text-purple-700 rounded-full text-xs font-semibold whitespace-nowrap shadow-2xs border border-white/80 transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>AI Generate</span>
        </button>

        <button
          onClick={onQuickSearch}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/70 hover:bg-white text-cyan-700 rounded-full text-xs font-semibold whitespace-nowrap shadow-2xs border border-white/80 transition-all active:scale-95"
        >
          <Search className="w-3.5 h-3.5 text-cyan-600" />
          <span>AI Search</span>
        </button>

        <button
          onClick={onQuickAirCanvas}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/70 hover:bg-white text-amber-700 rounded-full text-xs font-semibold whitespace-nowrap shadow-2xs border border-white/80 transition-all active:scale-95"
        >
          <Pencil className="w-3.5 h-3.5 text-amber-600" />
          <span>Air Canvas</span>
        </button>

        <button
          onClick={onQuickVision}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/70 hover:bg-white text-indigo-700 rounded-full text-xs font-semibold whitespace-nowrap shadow-2xs border border-white/80 transition-all active:scale-95"
        >
          <Eye className="w-3.5 h-3.5 text-indigo-600" />
          <span>AI Vision</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/70 hover:bg-white text-slate-700 rounded-full text-xs font-semibold whitespace-nowrap shadow-2xs border border-white/80 transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset</span>
        </button>

        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/70 hover:bg-white text-emerald-700 rounded-full text-xs font-semibold whitespace-nowrap shadow-2xs border border-white/80 transition-all active:scale-95"
        >
          <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
          <span>Save Gallery</span>
        </button>
      </div>
    </div>
  );
};
