import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CanvasImageObject,
  AssistantMessage,
  GestureType,
  GestureDetectionResult,
} from './types';
import { useCamera } from './hooks/useCamera';
import { useHandTracking } from './hooks/useHandTracking';
import { useCanvasManager } from './hooks/useCanvasManager';
import { VoiceSpeechRecognizer, RecognitionLanguage } from './lib/voice/speechRecognizer';
import { speechSynth } from './lib/voice/speechSynthesizer';
import { geminiApiClient } from './lib/gemini-client';

import { Navbar } from './components/Navbar';
import { VisualCanvas } from './components/Canvas/VisualCanvas';
import { CameraPreview } from './components/Camera/CameraPreview';
import { VoiceControlBar } from './components/Voice/VoiceControlBar';
import { AssistantDrawer } from './components/Assistant/AssistantDrawer';
import { GalleryModal } from './components/Gallery/GalleryModal';
import { SettingsModal } from './components/Settings/SettingsModal';
import { DemoWalkthrough } from './components/Demo/DemoWalkthrough';

import {
  MessageSquare,
  Sparkles,
  Bot,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function App() {
  // --- Canvas State Manager ---
  const canvas = useCanvasManager();

  // --- Camera Hook ---
  const {
    videoRef,
    isActive: isCameraActive,
    startCamera,
    stopCamera,
    captureFrame,
  } = useCamera();

  const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);

  // --- Gesture State ---
  const [smoothingAlpha, setSmoothingAlpha] = useState<number>(0.35);
  const prevPalmPosRef = useRef<{ x: number; y: number } | null>(null);
  const prevPinchDistRef = useRef<number | null>(null);
  const prevRotationRef = useRef<number | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ id: string; text: string; type: 'info' | 'success' | 'warning' } | null>(null);

  const showToast = useCallback((text: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = `${Date.now()}`;
    setToastMessage({ id, text, type });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.id === id ? null : cur));
    }, 4000);
  }, []);

  // --- Handle Real-time Gestures ---
  const handleGestureAction = useCallback(
    (gesture: GestureType, result: GestureDetectionResult, isNewlyTriggered: boolean) => {
      // 1. Air Canvas Pointing Mode
      if (canvas.isAirCanvasActive && gesture === 'POINTING' && result.indexTip) {
        canvas.addAirCanvasPoint(result.indexTip.x, result.indexTip.y);
        return;
      }

      // 2. Pinch + Move (Object Pan)
      if (gesture === 'PINCH' || gesture === 'PINCH_MOVE') {
        const currentPos = result.palmCenter;
        if (prevPalmPosRef.current) {
          const dx = (currentPos.x - prevPalmPosRef.current.x) * 900;
          const dy = (currentPos.y - prevPalmPosRef.current.y) * 700;
          if (Math.hypot(dx, dy) > 2) {
            canvas.moveImage(dx, dy);
          }
        }
        prevPalmPosRef.current = currentPos;
      } else {
        prevPalmPosRef.current = null;
      }

      // 3. Two-Finger Pinch (Resize)
      if (gesture === 'TWO_FINGER_PINCH') {
        if (prevPinchDistRef.current !== null) {
          const delta = result.pinchDistance - prevPinchDistRef.current;
          if (Math.abs(delta) > 0.005) {
            const multiplier = 1 + delta * 3.5;
            canvas.zoomImage(multiplier);
          }
        }
        prevPinchDistRef.current = result.pinchDistance;
      } else {
        prevPinchDistRef.current = null;
      }

      // 4. Two Hand Zoom
      if (gesture === 'TWO_HAND_ZOOM') {
        if (prevPinchDistRef.current !== null) {
          const delta = result.pinchDistance - prevPinchDistRef.current;
          if (Math.abs(delta) > 0.008) {
            canvas.zoomImage(1 + delta * 2.5);
          }
        }
        prevPinchDistRef.current = result.pinchDistance;
      }

      // 5. Wrist Rotation
      if (gesture === 'ROTATE') {
        if (prevRotationRef.current !== null) {
          const deltaRot = result.rotationAngle - prevRotationRef.current;
          if (Math.abs(deltaRot) > 2) {
            canvas.rotateImage(deltaRot);
          }
        }
        prevRotationRef.current = result.rotationAngle;
      } else {
        prevRotationRef.current = null;
      }

      // 6. Discrete Triggered Gestures (Swipes, Thumbs Up)
      if (isNewlyTriggered) {
        if (gesture === 'SWIPE_LEFT') {
          showToast('👉 Gesture: Swipe Left (Previous Image)', 'info');
          canvas.addCommandHistory({
            type: 'GESTURE',
            input: 'Swipe Left',
            actionSummary: 'Navigated to previous image in gallery',
          });
          const currentIndex = canvas.gallery.findIndex((x) => x.id === canvas.currentImage.id);
          if (currentIndex > 0) {
            canvas.setImage(canvas.gallery[currentIndex - 1]);
          }
        } else if (gesture === 'SWIPE_RIGHT') {
          showToast('👈 Gesture: Swipe Right (Next Image)', 'info');
          canvas.addCommandHistory({
            type: 'GESTURE',
            input: 'Swipe Right',
            actionSummary: 'Navigated to next image in gallery',
          });
          const currentIndex = canvas.gallery.findIndex((x) => x.id === canvas.currentImage.id);
          if (currentIndex < canvas.gallery.length - 1) {
            canvas.setImage(canvas.gallery[currentIndex + 1]);
          }
        } else if (gesture === 'SWIPE_UP') {
          showToast('👆 Gesture: Swipe Up (Generate Variation)', 'info');
          handleCommandExecution(`Create a futuristic cyberpunk variation of ${canvas.currentImage.title}`);
        } else if (gesture === 'SWIPE_DOWN' || gesture === 'THUMBS_UP') {
          showToast('👍 Gesture: Save to Gallery', 'success');
          canvas.saveImageToGallery();
        } else if (gesture === 'FIST') {
          showToast('✊ Gesture: Fist (Locked/Paused)', 'info');
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canvas]
  );

  // --- Hand Tracking Hook ---
  const {
    isModelLoading,
    modelError,
    fps,
    primaryHandResult,
    activeGesture,
    simulateGesture,
    smoother,
  } = useHandTracking({
    videoRef,
    canvasRef: canvasOverlayRef,
    isCameraActive,
    onGestureAction: handleGestureAction,
    showOverlay: true,
  });

  // Update smoother alpha when settings change
  useEffect(() => {
    smoother.setAlpha(smoothingAlpha);
  }, [smoothingAlpha, smoother]);

  // --- Voice State ---
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [soundLevel, setSoundLevel] = useState<number>(0);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<RecognitionLanguage>('en-US');
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const recognizerRef = useRef<VoiceSpeechRecognizer | null>(null);

  // --- Assistant & Dialog State ---
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      text: 'Greetings! I am VisionFlow AI. Speak naturally (e.g. "Open a Ferrari image", "Create a futuristic blue version", "Make it cinematic") or use hand gestures to control the canvas.',
      timestamp: Date.now(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isVisionAnalyzing, setIsVisionAnalyzing] = useState<boolean>(false);

  // --- Modals State ---
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDemoOpen, setIsDemoOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // --- Command Execution Hub (Voice & Text) ---
  const handleCommandExecution = useCallback(
    async (commandText: string) => {
      if (!commandText.trim() || isProcessing) return;
      setIsProcessing(true);
      setInterimTranscript('');

      // Add user message
      const userMsg: AssistantMessage = {
        id: `user_${Date.now()}`,
        sender: 'user',
        text: commandText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        // Parse intent via backend or fallback
        const parsed = await geminiApiClient.parseCommand(commandText, {
          activeImageTitle: canvas.currentImage.title,
          activePrompt: canvas.currentImage.prompt,
          sourceType: canvas.currentImage.sourceType,
          isAirCanvasActive: canvas.isAirCanvasActive,
        });

        const intent = parsed.intent;
        const spokenFeedback = parsed.spokenResponse || 'Processing your request.';

        canvas.addCommandHistory({
          type: 'VOICE',
          input: commandText,
          actionSummary: `${intent}: ${parsed.actionPayload?.prompt || parsed.actionPayload?.query || spokenFeedback}`,
        });

        // 1. SEARCH_IMAGE
        if (intent === 'SEARCH_IMAGE') {
          const query = parsed.actionPayload?.query || commandText;
          showToast(`🔍 Searching photographs for "${query}"...`, 'info');
          const searchRes = await geminiApiClient.searchImages(query);
          if (searchRes.images && searchRes.images.length > 0) {
            const top = searchRes.images[0];
            canvas.setImage({
              url: top.url,
              thumbnailUrl: top.thumbnailUrl,
              title: top.title,
              sourceType: 'SEARCHED_IMAGE',
              attribution: top.attribution,
              originalUrl: top.url,
            });
            showToast(`Found: ${top.title}`, 'success');
          }
        }

        // 2. GENERATE_IMAGE
        else if (intent === 'GENERATE_IMAGE') {
          const prompt = parsed.actionPayload?.prompt || commandText;
          showToast(`✨ Generating AI image: "${prompt}"...`, 'info');
          const genRes = await geminiApiClient.generateImage(prompt, {
            aspectRatio: '16:9',
            stylePreset: 'cinematic',
          });

          if (genRes.imageUrl) {
            canvas.setImage({
              url: genRes.imageUrl,
              thumbnailUrl: genRes.imageUrl,
              title: genRes.title || 'AI Generated Art',
              prompt: prompt,
              sourceType: 'AI_GENERATED',
              originalUrl: genRes.imageUrl,
            });
            showToast('AI Image generated successfully!', 'success');
          }
        }

        // 3. EDIT_IMAGE / VARIATION
        else if (intent === 'EDIT_IMAGE' || intent === 'CREATE_VARIATION') {
          const prompt = parsed.actionPayload?.prompt || `Futuristic variation of ${canvas.currentImage.title}`;
          showToast(`🎨 Creating AI edit: "${prompt}"...`, 'info');
          const editRes = await geminiApiClient.editImage(canvas.currentImage.url, prompt);
          if (editRes.imageUrl) {
            canvas.setImage({
              url: editRes.imageUrl,
              thumbnailUrl: editRes.imageUrl,
              title: editRes.title || `${canvas.currentImage.title} (AI Variation)`,
              prompt: prompt,
              sourceType: 'AI_GENERATED',
              originalUrl: canvas.currentImage.url,
            });
            showToast('New AI variation loaded onto canvas!', 'success');
          }
        }

        // 4. APPLY_FILTER
        else if (intent === 'APPLY_FILTER') {
          const preset = parsed.actionPayload?.filterPreset || 'cinematic';
          canvas.applyFilterPreset(preset);
          showToast(`Applied ${preset} visual filter`, 'success');
        }

        // 5. TRANSFORM_IMAGE
        else if (intent === 'TRANSFORM_IMAGE') {
          if (parsed.actionPayload?.scale) {
            canvas.zoomImage(parsed.actionPayload.scale);
          }
          if (parsed.actionPayload?.rotation) {
            canvas.rotateImage(parsed.actionPayload.rotation);
          }
          if (parsed.actionPayload?.deltaX || parsed.actionPayload?.deltaY) {
            canvas.moveImage(parsed.actionPayload.deltaX || 0, parsed.actionPayload.deltaY || 0);
          }
          if (parsed.actionPayload?.brightness) {
            canvas.adjustBrightness(parsed.actionPayload.brightness);
          }
        }

        // 6. AIR_CANVAS_DRAW
        else if (intent === 'AIR_CANVAS_DRAW') {
          canvas.setIsAirCanvasActive(true);
          showToast('Air Canvas activated! Point with your index finger to draw.', 'info');
        }

        // 7. VISION_QUERY
        else if (intent === 'VISION_QUERY') {
          await handleVisionSnapshotQuery(commandText);
          return;
        }

        // 8. RESET_CANVAS
        else if (intent === 'RESET_CANVAS') {
          canvas.resetTransform();
          canvas.clearAirCanvas();
          showToast('Canvas transformations reset.', 'info');
        }

        // 9. SAVE_IMAGE
        else if (intent === 'SAVE_IMAGE') {
          canvas.saveImageToGallery();
          showToast('Image saved to gallery!', 'success');
        }

        // 10. SELECT_OBJECT
        else if (intent === 'SELECT_OBJECT') {
          showToast('Object selected. Pinch with hand to move or rotate.', 'info');
        }

        // AI Spoken response
        speechSynth.speak(spokenFeedback);

        // Add assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: `asst_${Date.now()}`,
            sender: 'assistant',
            text: spokenFeedback,
            timestamp: Date.now(),
            intent,
          },
        ]);
      } catch (err: any) {
        console.error('Command execution error:', err);
        const errMsg = 'I encountered an issue processing that command. Please try again.';
        speechSynth.speak(errMsg);
        setMessages((prev) => [
          ...prev,
          {
            id: `asst_err_${Date.now()}`,
            sender: 'assistant',
            text: errMsg,
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsProcessing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canvas, isProcessing, showToast]
  );

  // --- Vision Snapshot AI Query ---
  const handleVisionSnapshotQuery = useCallback(
    async (prompt: string = 'What am I showing you?') => {
      const frameData = captureFrame();
      if (!frameData) {
        showToast('Please enable the camera first to use AI Vision analysis.', 'warning');
        return;
      }

      setIsVisionAnalyzing(true);
      showToast('Analyzing camera snapshot with Gemini AI Vision...', 'info');

      try {
        const visionRes = await geminiApiClient.analyzeVisionSnapshot(frameData, prompt);
        const responseText = visionRes.description || 'I analyzed the frame.';

        speechSynth.speak(responseText);

        setMessages((prev) => [
          ...prev,
          {
            id: `vision_${Date.now()}`,
            sender: 'assistant',
            text: `👁️ AI Vision: ${responseText}`,
            timestamp: Date.now(),
            intent: 'VISION_QUERY',
          },
        ]);

        canvas.addCommandHistory({
          type: 'SYSTEM',
          input: 'Vision Snapshot Analysis',
          actionSummary: responseText,
        });

        // If suggestions provided, offer quick generation
        if (visionRes.creativeSuggestions && visionRes.creativeSuggestions.length > 0) {
          showToast(`Creative idea: "${visionRes.creativeSuggestions[0]}"`, 'info');
        }
      } catch (err: any) {
        showToast('Vision analysis failed. Ensure camera frame is visible.', 'warning');
      } finally {
        setIsVisionAnalyzing(false);
      }
    },
    [captureFrame, showToast, canvas]
  );

  // --- Voice Recognizer Setup ---
  useEffect(() => {
    const recognizer = new VoiceSpeechRecognizer({
      language: selectedLanguage,
      continuous: true,
      interimResults: true,
      onResult: (transcript, isFinal) => {
        if (isFinal) {
          handleCommandExecution(transcript);
        } else {
          setInterimTranscript(transcript);
        }
      },
      onSoundLevel: (level) => {
        setSoundLevel(level);
      },
      onError: (err) => {
        showToast(err, 'warning');
      },
      onStart: () => {
        setIsMicActive(true);
      },
      onEnd: () => {
        setIsMicActive(false);
        setSoundLevel(0);
      },
    });

    recognizerRef.current = recognizer;

    return () => {
      recognizer.stop();
    };
  }, [selectedLanguage, handleCommandExecution, showToast]);

  const toggleMic = useCallback(() => {
    if (isMicActive) {
      recognizerRef.current?.stop();
      setIsMicActive(false);
    } else {
      recognizerRef.current?.start();
      setIsMicActive(true);
      showToast('Microphone active. Speak your command...', 'info');
    }
  }, [isMicActive, showToast]);

  const toggleCamera = useCallback(() => {
    if (isCameraActive) {
      stopCamera();
      showToast('Camera stopped.', 'info');
    } else {
      startCamera();
      showToast('Camera starting... Point your hand toward the webcam.', 'info');
    }
  }, [isCameraActive, startCamera, stopCamera, showToast]);

  const toggleVoiceMute = useCallback(() => {
    const nextMute = !isVoiceMuted;
    setIsVoiceMuted(nextMute);
    speechSynth.setMuted(nextMute);
    showToast(nextMute ? 'Assistant voice muted.' : 'Assistant voice enabled.', 'info');
  }, [isVoiceMuted, showToast]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // --- Demo Walkthrough Step Dispatcher ---
  const handleExecuteDemoStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 2:
        if (!isCameraActive) startCamera();
        if (!isMicActive) recognizerRef.current?.start();
        break;
      case 3:
      case 4:
        handleCommandExecution('Show me a futuristic sports car');
        break;
      case 5:
      case 6:
        handleCommandExecution('Create a futuristic blue version');
        break;
      case 7:
        handleCommandExecution('Select the car');
        break;
      case 8:
        simulateGesture('PINCH');
        break;
      case 9:
        canvas.moveImage(120, 0);
        showToast('Image moved right via hand tracking.', 'success');
        break;
      case 10:
        canvas.zoomImage(1.3);
        showToast('Image scaled via finger spread.', 'success');
        break;
      case 11:
        handleCommandExecution('Make it cinematic');
        break;
      case 12:
        canvas.saveImageToGallery();
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gradient-to-br from-[#f8faff] via-[#ffffff] to-[#f4f7ff] text-slate-800 font-sans select-none p-2 sm:p-3 gap-2.5 relative">
      {/* 1. Futuristic Header Navigation Bar */}
      <Navbar
        isCameraActive={isCameraActive}
        isMicActive={isMicActive}
        isAirCanvasActive={canvas.isAirCanvasActive}
        isFullscreen={isFullscreen}
        onToggleCamera={toggleCamera}
        onToggleMic={toggleMic}
        onToggleAirCanvas={() => {
          const next = !canvas.isAirCanvasActive;
          canvas.setIsAirCanvasActive(next);
          showToast(next ? 'Air Canvas enabled (Point index finger to draw)' : 'Air Canvas disabled', 'info');
        }}
        onToggleFullscreen={toggleFullscreen}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onStartDemo={() => setIsDemoOpen(true)}
        galleryCount={canvas.gallery.length}
      />

      {/* 2. Main Multimodal Studio Body */}
      <main className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden relative">
        {/* Visual Interactive Canvas */}
        <VisualCanvas
          currentImage={canvas.currentImage}
          airCanvasStrokes={canvas.airCanvasStrokes}
          isAirCanvasActive={canvas.isAirCanvasActive}
          activeGesture={activeGesture}
          isComparing={canvas.isComparing}
          compareSplit={canvas.compareSplit}
          canUndo={canvas.canUndo}
          canRedo={canvas.canRedo}
          onZoom={canvas.zoomImage}
          onRotate={canvas.rotateImage}
          onMove={canvas.moveImage}
          onAdjustBrightness={canvas.adjustBrightness}
          onApplyFilter={canvas.applyFilterPreset}
          onReset={canvas.resetTransform}
          onUndo={canvas.undo}
          onRedo={canvas.redo}
          onToggleCompare={() => canvas.setIsComparing(!canvas.isComparing)}
          onSetCompareSplit={canvas.setCompareSplit}
          onSaveToGallery={canvas.saveImageToGallery}
          onDownload={canvas.downloadImage}
        />

        {/* Live Computer Vision & Hand Skeleton HUD Panel */}
        <CameraPreview
          videoRef={videoRef}
          canvasRef={canvasOverlayRef}
          isCameraActive={isCameraActive}
          isModelLoading={isModelLoading}
          modelError={modelError}
          fps={fps}
          primaryHand={primaryHandResult}
          activeGesture={activeGesture}
          onToggleCamera={toggleCamera}
          onAnalyzeVision={() => handleVisionSnapshotQuery()}
          onSimulateGesture={simulateGesture}
          isVisionAnalyzing={isVisionAnalyzing}
        />
      </main>

      {/* 3. Bottom Voice & Natural Command Bar */}
      <footer className="w-full shrink-0">
        <VoiceControlBar
          isMicActive={isMicActive}
          soundLevel={soundLevel}
          interimTranscript={interimTranscript}
          isProcessing={isProcessing}
          isVoiceMuted={isVoiceMuted}
          selectedLanguage={selectedLanguage}
          onToggleMic={toggleMic}
          onToggleVoiceMute={toggleVoiceMute}
          onChangeLanguage={(lang) => {
            setSelectedLanguage(lang);
            showToast(`Voice recognition set to ${lang}`, 'info');
          }}
          onSubmitCommand={handleCommandExecution}
          onQuickGenerate={() => handleCommandExecution('Create a futuristic cyberpunk sports car')}
          onQuickSearch={() => handleCommandExecution('Show me a picture of Lamborghini')}
          onQuickAirCanvas={() => {
            canvas.setIsAirCanvasActive(true);
            showToast('Air Canvas activated. Point with your index finger.', 'info');
          }}
          onQuickVision={() => handleVisionSnapshotQuery()}
          onReset={canvas.resetTransform}
          onSave={canvas.saveImageToGallery}
        />
      </footer>

      {/* Floating Assistant Drawer Toggle Button */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed top-20 right-6 z-30 px-3.5 py-2 rounded-full bg-white/90 backdrop-blur-md border border-white text-slate-800 shadow-xl flex items-center gap-2 text-xs font-bold hover:bg-white active:scale-95 transition-all"
        title="Open VisionFlow Assistant"
      >
        <Bot className="w-4 h-4 text-cyan-600" />
        <span className="hidden md:inline">Assistant</span>
        {messages.length > 1 && (
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
        )}
      </button>

      {/* Collapsible Assistant Drawer */}
      <AssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        messages={messages}
        history={canvas.commandHistory}
        isProcessing={isProcessing}
        onClearMessages={() =>
          setMessages([
            {
              id: `welcome_${Date.now()}`,
              sender: 'assistant',
              text: 'Conversation cleared. How can I assist your creative process?',
              timestamp: Date.now(),
            },
          ])
        }
        onSelectSuggestion={handleCommandExecution}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
          <div
            className={`px-4 py-2.5 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-center gap-2.5 text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
                : toastMessage.type === 'warning'
                ? 'bg-amber-950/90 text-amber-200 border-amber-500/40'
                : 'bg-slate-900/90 text-sky-200 border-sky-500/40'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toastMessage.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        gallery={canvas.gallery}
        onSelectImage={canvas.setImage}
      />

      {/* Settings & Mappings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedLanguage={selectedLanguage}
        onChangeLanguage={setSelectedLanguage}
        smoothingAlpha={smoothingAlpha}
        onChangeSmoothingAlpha={setSmoothingAlpha}
        isVoiceMuted={isVoiceMuted}
        onToggleVoiceMute={toggleVoiceMute}
        hasGeminiKey={true}
      />

      {/* Guided 12-Step Demo Walkthrough */}
      <DemoWalkthrough
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onExecuteDemoStep={handleExecuteDemoStep}
      />
    </div>
  );
}
