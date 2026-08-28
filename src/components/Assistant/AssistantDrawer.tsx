import React, { FC } from 'react';
import { AssistantMessage, CommandHistoryItem } from '../../types';
import {
  Sparkles,
  Bot,
  User,
  Trash2,
  ChevronRight,
  MessageSquare,
  Clock,
  CheckCircle2,
  Hand,
  Mic,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: AssistantMessage[];
  history: CommandHistoryItem[];
  isProcessing: boolean;
  onClearMessages: () => void;
  onSelectSuggestion: (text: string) => void;
}

export const AssistantDrawer: FC<AssistantDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  history,
  isProcessing,
  onClearMessages,
  onSelectSuggestion,
}) => {
  const [activeTab, setActiveTab] = React.useState<'chat' | 'history'>('chat');

  if (!isOpen) return null;

  const suggestions = [
    'Show me a futuristic sports car',
    'Create a futuristic blue version',
    'Make it cinematic',
    'Select the car',
    'What am I showing you?',
    'Create a deep space galaxy',
    'Air Canvas draw mode',
  ];

  return (
    <aside className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white/90 backdrop-blur-2xl border-l border-white/80 shadow-2xl z-40 flex flex-col select-none">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">VisionFlow AI</h2>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Multimodal Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClearMessages}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
            title="Close Assistant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 text-xs font-bold p-2 gap-2 bg-slate-50/50">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'chat'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-cyan-600" />
          <span>Assistant Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'history'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-purple-600" />
          <span>Audit Log ({history.length})</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'chat' ? (
          <>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3 shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">How can I assist you?</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-4">
                  Speak naturally or type commands to search images, generate art, or manipulate objects with hand gestures.
                </p>

                {/* Suggestions List */}
                <div className="w-full text-left space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-amber-500" />
                    Try saying:
                  </span>
                  {suggestions.slice(0, 4).map((sugg, i) => (
                    <button
                      key={i}
                      onClick={() => onSelectSuggestion(sugg)}
                      className="w-full text-left text-xs bg-white hover:bg-cyan-50/80 hover:text-cyan-800 text-slate-700 px-3.5 py-2.5 rounded-2xl border border-slate-100 shadow-2xs transition-all flex items-center justify-between group"
                    >
                      <span className="font-medium">&quot;{sugg}&quot;</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-600 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 text-xs ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender !== 'user' && (
                      <div className="w-7 h-7 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                        msg.sender === 'user'
                          ? 'bg-slate-900 text-white rounded-br-xs'
                          : 'bg-white/90 text-slate-800 rounded-bl-xs border border-slate-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      {msg.intent && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center gap-1 text-[10px] font-bold text-cyan-600 uppercase">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Intent: {msg.intent}</span>
                        </div>
                      )}
                    </div>

                    {msg.sender === 'user' && (
                      <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex gap-2.5 text-xs">
                    <div className="w-7 h-7 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="bg-white/90 rounded-2xl px-3.5 py-2.5 text-slate-600 flex items-center gap-2 border border-slate-100 shadow-2xs">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-[11px] font-medium">Synthesizing creative command...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Command & Gesture History Audit Log */
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-white/90 border border-slate-100 text-xs flex items-start gap-2.5 shadow-2xs"
              >
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 mt-0.5 shrink-0">
                  {item.type === 'VOICE' ? (
                    <Mic className="w-3.5 h-3.5 text-cyan-600" />
                  ) : item.type === 'GESTURE' ? (
                    <Hand className="w-3.5 h-3.5 text-purple-600" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold uppercase tracking-wider text-slate-600">{item.type}</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                  <p className="font-bold text-slate-800 truncate mt-0.5">&quot;{item.input}&quot;</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.actionSummary}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Suggestions Chips */}
      {activeTab === 'chat' && messages.length > 0 && (
        <div className="p-3.5 border-t border-slate-100 bg-white/40">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Quick Prompts:</span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 3).map((sugg, i) => (
              <button
                key={i}
                onClick={() => onSelectSuggestion(sugg)}
                className="text-[11px] bg-white hover:bg-cyan-50 hover:text-cyan-800 text-slate-600 px-3 py-1 rounded-full border border-slate-100 shadow-2xs transition-all font-medium"
              >
                {sugg}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
