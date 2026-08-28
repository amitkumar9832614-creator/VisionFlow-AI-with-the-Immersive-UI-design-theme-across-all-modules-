import React, { FC, useState } from 'react';
import {
  X,
  Play,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Camera,
  Mic,
  Hand,
  Sun,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface DemoWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteDemoStep: (stepNumber: number) => void;
}

export const DemoWalkthrough: FC<DemoWalkthroughProps> = ({
  isOpen,
  onClose,
  onExecuteDemoStep,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  if (!isOpen) return null;

  const demoSteps = [
    {
      step: 1,
      title: 'Initialize VisionFlow AI',
      subtitle: 'Multimodal Vision + Voice + Hand Interaction Studio',
      description: 'VisionFlow AI blends on-device 21-point hand tracking with Gemini multimodal AI intent intelligence.',
      icon: Sparkles,
      color: 'from-sky-500 to-indigo-600',
      actionText: 'Start Walkthrough',
    },
    {
      step: 2,
      title: 'Enable Camera & Microphone',
      subtitle: 'Secure Local Processing',
      description: 'Click the Camera and Mic icons at the top to grant camera and audio access. Tracking runs locally in browser WebAssembly.',
      icon: Camera,
      color: 'from-emerald-500 to-teal-600',
      actionText: 'Enable Devices',
    },
    {
      step: 3,
      title: 'Say: "Show me a futuristic sports car"',
      subtitle: 'Natural Voice Search',
      description: 'Speak aloud or click the microphone to search authentic photographs with verified source credits.',
      icon: Mic,
      color: 'from-sky-500 to-cyan-600',
      actionText: 'Execute Voice Search',
    },
    {
      step: 4,
      title: 'Visual Canvas Loaded',
      subtitle: 'High-Resolution Display',
      description: 'The sports car photograph is rendered on the interactive stage with source attribution tags.',
      icon: Layers,
      color: 'from-blue-500 to-indigo-600',
      actionText: 'Inspect Stage',
    },
    {
      step: 5,
      title: 'Say: "Create a futuristic blue version"',
      subtitle: 'Generative AI Synthesis',
      description: 'The AI understands contextual transformations and generates a new artwork using Gemini 3.1 Flash Lite Image.',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-600',
      actionText: 'Generate Blue Version',
    },
    {
      step: 6,
      title: 'AI Generates Masterpiece',
      subtitle: 'New Visual Object Created',
      description: 'The generated image is placed on the canvas and labeled as "AI GENERATED IMAGE".',
      icon: CheckCircle2,
      color: 'from-indigo-500 to-purple-600',
      actionText: 'Proceed to Hand Control',
    },
    {
      step: 7,
      title: 'Say: "Select the car"',
      subtitle: 'Voice-to-Selection Binding',
      description: 'The visual object is focused and readied for gestural transformations.',
      icon: Mic,
      color: 'from-sky-500 to-blue-600',
      actionText: 'Select Object',
    },
    {
      step: 8,
      title: 'Pinch with Your Hand',
      subtitle: 'Gesture-Based Object Grabbing',
      description: 'Bring your thumb and index fingertips together. The visual object highlights with a rose grabbing ring.',
      icon: Hand,
      color: 'from-rose-500 to-pink-600',
      actionText: 'Simulate Pinch',
    },
    {
      step: 9,
      title: 'Move Hand Right',
      subtitle: 'Spatial Translation (Pan)',
      description: 'Holding the pinch, move your hand horizontally. The image tracks your palm movement in real time.',
      icon: ArrowRight,
      color: 'from-amber-500 to-orange-600',
      actionText: 'Simulate Move Right',
    },
    {
      step: 10,
      title: 'Spread Fingers / Two-Hand Zoom',
      subtitle: 'Dynamic Scale Transformation',
      description: 'Open your fingers wide or use two hands to smoothly zoom in on the vehicle aerodynamics.',
      icon: Sparkles,
      color: 'from-cyan-500 to-sky-600',
      actionText: 'Simulate Zoom',
    },
    {
      step: 11,
      title: 'Say: "Make it cinematic"',
      subtitle: 'Intelligent Visual Color Grading',
      description: 'AI and custom shaders enhance contrast, dynamic lighting, and saturation for a cinematic studio look.',
      icon: Sun,
      color: 'from-amber-500 to-yellow-600',
      actionText: 'Apply Cinematic Filter',
    },
    {
      step: 12,
      title: 'Say: "Save this"',
      subtitle: 'Complete Creative Workflow',
      description: 'Your finalized transformed creation is stored in the Creative Gallery with confetti celebrations!',
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600',
      actionText: 'Save to Gallery',
    },
  ];

  const current = demoSteps[currentStepIndex];
  const StepIcon = current.icon;

  const handleNext = () => {
    onExecuteDemoStep(current.step);
    if (currentStepIndex < demoSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-fadeIn select-none">
      <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] w-full max-w-lg shadow-2xl border border-white flex flex-col overflow-hidden">
        {/* Step Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 flex">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / demoSteps.length) * 100}%` }}
          />
        </div>

        {/* Top Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-white/40">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200/80 text-xs font-bold font-mono">
              Step {current.step} / {demoSteps.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">Interactive Demo Tour</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Content */}
        <div className="p-7 text-center flex flex-col items-center">
          <div
            className={`w-16 h-16 rounded-3xl bg-gradient-to-tr ${current.color} text-white flex items-center justify-center shadow-lg mb-4`}
          >
            <StepIcon className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1">{current.title}</h3>
          <p className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-3">{current.subtitle}</p>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md">{current.description}</p>
        </div>

        {/* Step Navigation Footer */}
        <div className="p-4 sm:p-5 bg-white/40 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentStepIndex > 0 ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs' : 'opacity-0 pointer-events-none'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1.5">
            {demoSteps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === currentStepIndex ? 'w-5 bg-slate-900' : i < currentStepIndex ? 'w-2 bg-cyan-500' : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <span>{current.actionText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
