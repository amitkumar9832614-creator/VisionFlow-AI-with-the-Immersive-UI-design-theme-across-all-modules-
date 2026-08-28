import React, { FC, useState } from 'react';
import { CanvasImageObject } from '../../types';
import {
  X,
  Sparkles,
  Search,
  Download,
  Check,
  Trash2,
  ExternalLink,
  Layers,
  Calendar,
} from 'lucide-react';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  gallery: CanvasImageObject[];
  onSelectImage: (image: CanvasImageObject) => void;
}

export const GalleryModal: FC<GalleryModalProps> = ({
  isOpen,
  onClose,
  gallery,
  onSelectImage,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'AI_GENERATED' | 'SEARCHED_IMAGE'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = gallery.filter((item) => {
    if (filter === 'ALL') return true;
    return item.sourceType === filter;
  });

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-fadeIn select-none">
      <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] w-full max-w-4xl max-h-[85vh] shadow-2xl border border-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white/40">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Creative Visual Gallery</h2>
              <p className="text-xs text-slate-400 font-medium">
                Browse and restore your AI generated creations & photos ({gallery.length} items)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
          {(['ALL', 'AI_GENERATED', 'SEARCHED_IMAGE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                filter === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {tab === 'ALL' ? 'All Visuals' : tab === 'AI_GENERATED' ? 'AI Generated' : 'Searched Photos'}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
              <Layers className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No visuals found in this category.</p>
              <p className="text-xs text-slate-400 mt-1">
                Say &quot;Create a futuristic supercar&quot; or &quot;Show me the Eiffel Tower&quot; to populate your gallery.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-cyan-200 transition-all overflow-hidden flex flex-col"
                >
                  {/* Image Card Thumbnail */}
                  <div className="relative aspect-video bg-slate-950 overflow-hidden">
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Source Tag Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      {item.sourceType === 'AI_GENERATED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-600/90 backdrop-blur-md text-white text-[10px] font-bold shadow-xs">
                          <Sparkles className="w-2.5 h-2.5" />
                          AI Render
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-600/90 backdrop-blur-md text-white text-[10px] font-bold shadow-xs">
                          <Search className="w-2.5 h-2.5" />
                          Photo
                        </span>
                      )}
                    </div>

                    {/* Quick Load on Canvas Overlay Button */}
                    <button
                      onClick={() => {
                        onSelectImage(item);
                        onClose();
                      }}
                      className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 backdrop-blur-2xs flex items-center justify-center text-white font-bold text-xs gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Load into Canvas</span>
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{item.title}</h4>
                      {item.prompt && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 italic">&quot;{item.prompt}&quot;</p>
                      )}
                      {item.attribution && (
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{item.attribution}</p>
                      )}
                    </div>

                    <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1 text-[10px] font-medium">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-1">
                        {item.prompt && (
                          <button
                            onClick={() => handleCopyPrompt(item.id, item.prompt || '')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all"
                            title="Copy prompt"
                          >
                            {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Sparkles className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <a
                          href={item.url}
                          download={`${item.title}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all"
                          title="Download Image"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white/40 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px] font-medium">Click any visual card to load it back into the interactive hand canvas.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
