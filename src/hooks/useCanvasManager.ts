import { useState, useCallback, useRef } from 'react';
import { AirCanvasStroke, CanvasImageObject, CommandHistoryItem } from '../types';
import confetti from 'canvas-confetti';

const INITIAL_IMAGE: CanvasImageObject = {
  id: 'default_ferrari',
  url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1600&q=85',
  thumbnailUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=400&q=70',
  title: 'Ferrari SF90 Stradale',
  prompt: 'A sleek scarlet red Ferrari SF90 Stradale exotic supercar on a futuristic open track',
  sourceType: 'SEARCHED_IMAGE',
  attribution: 'Photo by Jannis Lucas on Unsplash',
  createdAt: Date.now(),
  originalUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1600&q=85',
  transforms: {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    hueRotate: 0,
    filterPreset: 'none',
  },
  isSelected: true,
};

export function useCanvasManager() {
  const [currentImage, setCurrentImage] = useState<CanvasImageObject>(INITIAL_IMAGE);
  const [gallery, setGallery] = useState<CanvasImageObject[]>([INITIAL_IMAGE]);
  const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>([
    {
      id: 'init_1',
      timestamp: Date.now(),
      type: 'SYSTEM',
      input: 'System Initialized',
      actionSummary: 'VisionFlow AI Multimodal Creative Studio loaded.',
    },
  ]);

  // Undo / Redo Stacks
  const undoStackRef = useRef<CanvasImageObject[]>([]);
  const redoStackRef = useRef<CanvasImageObject[]>([]);

  // Air Canvas Mode
  const [isAirCanvasActive, setIsAirCanvasActive] = useState<boolean>(false);
  const [airCanvasStrokes, setAirCanvasStrokes] = useState<AirCanvasStroke[]>([]);
  const [drawColor, setDrawColor] = useState<string>('#38bdf8'); // light cyan
  const [drawLineWidth, setDrawLineWidth] = useState<number>(6);

  // Before/After comparison toggle
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [compareSplit, setCompareSplit] = useState<number>(50); // 0 to 100%

  // Push state to undo stack before applying changes
  const recordHistory = useCallback((prev: CanvasImageObject) => {
    undoStackRef.current.push(JSON.parse(JSON.stringify(prev)));
    if (undoStackRef.current.length > 30) undoStackRef.current.shift();
    redoStackRef.current = [];
  }, []);

  const addCommandHistory = useCallback((item: Omit<CommandHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: CommandHistoryItem = {
      ...item,
      id: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };
    setCommandHistory((prev) => [newItem, ...prev.slice(0, 49)]);
  }, []);

  // Update full image (new search or generation or edit)
  const setImage = useCallback(
    (newImg: Partial<CanvasImageObject> & { url: string; title: string }) => {
      setCurrentImage((prev) => {
        recordHistory(prev);
        const updated: CanvasImageObject = {
          id: newImg.id || `img_${Date.now()}`,
          url: newImg.url,
          thumbnailUrl: newImg.thumbnailUrl || newImg.url,
          title: newImg.title,
          prompt: newImg.prompt,
          sourceType: newImg.sourceType || 'AI_GENERATED',
          attribution: newImg.attribution,
          createdAt: Date.now(),
          originalUrl: newImg.originalUrl || newImg.url,
          transforms: {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            hueRotate: 0,
            filterPreset: 'none',
          },
          isSelected: true,
        };

        // Add to gallery if not present
        setGallery((g) => [updated, ...g.filter((x) => x.id !== updated.id)]);
        return updated;
      });
    },
    [recordHistory]
  );

  // Update transforms
  const updateTransform = useCallback(
    (updater: (prevTransforms: CanvasImageObject['transforms']) => Partial<CanvasImageObject['transforms']>) => {
      setCurrentImage((prev) => {
        const changes = updater(prev.transforms);
        return {
          ...prev,
          transforms: {
            ...prev.transforms,
            ...changes,
          },
        };
      });
    },
    []
  );

  // Move image by delta x and y
  const moveImage = useCallback(
    (dx: number, dy: number) => {
      updateTransform((t) => ({
        x: Math.max(-400, Math.min(400, t.x + dx)),
        y: Math.max(-300, Math.min(300, t.y + dy)),
      }));
    },
    [updateTransform]
  );

  // Zoom / Scale image
  const zoomImage = useCallback(
    (scaleMultiplier: number) => {
      updateTransform((t) => ({
        scale: Math.max(0.4, Math.min(4.0, t.scale * scaleMultiplier)),
      }));
    },
    [updateTransform]
  );

  // Rotate image by delta degrees
  const rotateImage = useCallback(
    (deg: number) => {
      updateTransform((t) => ({
        rotation: (t.rotation + deg) % 360,
      }));
    },
    [updateTransform]
  );

  // Adjust brightness
  const adjustBrightness = useCallback(
    (delta: number) => {
      updateTransform((t) => ({
        brightness: Math.max(20, Math.min(200, t.brightness + delta)),
      }));
    },
    [updateTransform]
  );

  // Apply visual preset filter
  const applyFilterPreset = useCallback(
    (preset: string) => {
      setCurrentImage((prev) => {
        recordHistory(prev);
        let brightness = 100;
        let contrast = 100;
        let saturation = 100;
        let hueRotate = 0;
        let blur = 0;

        if (preset === 'cinematic') {
          contrast = 125;
          saturation = 115;
          brightness = 95;
        } else if (preset === 'cyberpunk') {
          contrast = 135;
          saturation = 160;
          hueRotate = 45;
        } else if (preset === 'warm') {
          brightness = 105;
          saturation = 120;
          hueRotate = -15;
        } else if (preset === 'cool') {
          brightness = 100;
          saturation = 110;
          hueRotate = 180;
        } else if (preset === '3d-render') {
          contrast = 130;
          saturation = 130;
          brightness = 110;
        }

        return {
          ...prev,
          transforms: {
            ...prev.transforms,
            brightness,
            contrast,
            saturation,
            hueRotate,
            blur,
            filterPreset: preset,
          },
        };
      });
    },
    [recordHistory]
  );

  // Reset transforms
  const resetTransform = useCallback(() => {
    setCurrentImage((prev) => {
      recordHistory(prev);
      return {
        ...prev,
        transforms: {
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          brightness: 100,
          contrast: 100,
          saturation: 100,
          blur: 0,
          hueRotate: 0,
          filterPreset: 'none',
        },
      };
    });
  }, [recordHistory]);

  // Undo / Redo
  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const previous = undoStackRef.current.pop()!;
    redoStackRef.current.push(JSON.parse(JSON.stringify(currentImage)));
    setCurrentImage(previous);
    addCommandHistory({
      type: 'SYSTEM',
      input: 'Undo',
      actionSummary: 'Reverted last visual transformation.',
    });
  }, [currentImage, addCommandHistory]);

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push(JSON.parse(JSON.stringify(currentImage)));
    setCurrentImage(next);
    addCommandHistory({
      type: 'SYSTEM',
      input: 'Redo',
      actionSummary: 'Restored visual transformation.',
    });
  }, [currentImage, addCommandHistory]);

  // Air Canvas stroke management
  const addAirCanvasPoint = useCallback(
    (x: number, y: number) => {
      setAirCanvasStrokes((strokes) => {
        if (strokes.length === 0) {
          const newStroke: AirCanvasStroke = {
            id: `stroke_${Date.now()}`,
            points: [{ x, y }],
            color: drawColor,
            lineWidth: drawLineWidth,
          };
          return [newStroke];
        }

        const lastStroke = strokes[strokes.length - 1];
        // Check if close to last point to prevent duplicates
        const lastPt = lastStroke.points[lastStroke.points.length - 1];
        if (lastPt && Math.hypot(lastPt.x - x, lastPt.y - y) < 0.002) {
          return strokes;
        }

        const updatedStroke: AirCanvasStroke = {
          ...lastStroke,
          points: [...lastStroke.points, { x, y }],
        };
        return [...strokes.slice(0, -1), updatedStroke];
      });
    },
    [drawColor, drawLineWidth]
  );

  const startNewAirStroke = useCallback(() => {
    setAirCanvasStrokes((strokes) => [
      ...strokes,
      {
        id: `stroke_${Date.now()}`,
        points: [],
        color: drawColor,
        lineWidth: drawLineWidth,
      },
    ]);
  }, [drawColor, drawLineWidth]);

  const clearAirCanvas = useCallback(() => {
    setAirCanvasStrokes([]);
  }, []);

  // Save / Download current image
  const saveImageToGallery = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#c084fc', '#f472b6', '#34d399'],
      });
    } catch {}

    setGallery((g) => {
      if (g.some((x) => x.id === currentImage.id)) return g;
      return [currentImage, ...g];
    });

    addCommandHistory({
      type: 'SYSTEM',
      input: 'Saved Image',
      actionSummary: `Saved "${currentImage.title}" to creative gallery.`,
    });
  }, [currentImage, addCommandHistory]);

  const downloadImage = useCallback(() => {
    const link = document.createElement('a');
    link.href = currentImage.url;
    link.download = `${currentImage.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
    link.target = '_blank';
    link.click();

    addCommandHistory({
      type: 'SYSTEM',
      input: 'Download',
      actionSummary: `Downloaded "${currentImage.title}"`,
    });
  }, [currentImage, addCommandHistory]);

  return {
    currentImage,
    gallery,
    commandHistory,
    isAirCanvasActive,
    airCanvasStrokes,
    drawColor,
    drawLineWidth,
    isComparing,
    compareSplit,
    canUndo: undoStackRef.current.length > 0,
    canRedo: redoStackRef.current.length > 0,
    setImage,
    updateTransform,
    moveImage,
    zoomImage,
    rotateImage,
    adjustBrightness,
    applyFilterPreset,
    resetTransform,
    undo,
    redo,
    addCommandHistory,
    setIsAirCanvasActive,
    setDrawColor,
    setDrawLineWidth,
    addAirCanvasPoint,
    startNewAirStroke,
    clearAirCanvas,
    setIsComparing,
    setCompareSplit,
    saveImageToGallery,
    downloadImage,
  };
}
